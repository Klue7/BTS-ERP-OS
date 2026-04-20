import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import type { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../../prisma/client.ts';
import {
  createCustomerQuoteDocument,
} from '../inventory/service.ts';
import { createMarketingCalendarEntry } from '../marketing/service.ts';
import { getUploadsDirectory, storePublicUpload } from '../uploads.ts';
import { getTenderIntelligenceProvider } from './provider.ts';
import {
  readTenderStore,
  writeTenderStore,
  type TenderBoqRecord,
  type TenderBoqLine,
  type TenderDocumentRecord,
  type TenderMemberResponseRecord,
  type TenderOpportunityRecord,
  type TenderQuoteRecord,
  type TenderStore,
} from './repository.ts';
import type {
  CreateTenderMemberResponseInput,
  CreateTenderOpportunityInput,
  CreateTenderQuoteDraftInput,
  CreateTenderSubmissionInput,
  ImportTenderSourcePackResult,
  ParsedTenderUpload,
  PromoteTenderDocumentToBoqInput,
  SyncEtendersInput,
  TenderBoqSummary,
  TenderDeskSnapshot,
  TenderDocumentSummary,
  TenderMemberAccessGapLine,
  TenderMemberAccessSummary,
  TenderMemberOpportunitySummary,
  TenderMemberPortalFilters,
  TenderMemberPortalSnapshot,
  TenderMemberResponseSummary,
  TenderMemberRole,
  TenderOpportunitySummary,
  TenderProjectMetadata,
  TenderQuoteSummary,
  TenderSyncResult,
  UpdateTenderBoqLineInput,
  UploadTenderBoqInput,
} from '../../tenders/contracts.ts';

const tenderIntelligence = getTenderIntelligenceProvider();
const etenderApiBaseUrl = 'https://ocds-api.etenders.gov.za/api/OCDSReleases';
const defaultEtenderKeywords = [
  'brick',
  'bricks',
  'cladding',
  'tile',
  'tiles',
  'paving',
  'masonry',
  'facade',
  'wall',
  'flooring',
  'renovation',
  'refurbishment',
  'construction',
  'building',
  'civil',
];

const productMatchArgs = {
  include: {
    productSuppliers: {
      include: {
        supplier: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    },
  },
} satisfies Prisma.ProductFindManyArgs;

type ProductMatchRecord = Prisma.ProductGetPayload<{
  include: {
    productSuppliers: {
      include: {
        supplier: true;
      };
    };
  };
}>;

function createKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function round(value: number, precision = 2) {
  return Number(value.toFixed(precision));
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrencyCompact(value: number | null) {
  if (value === null) {
    return 'TBD';
  }
  if (value >= 1_000_000) {
    return `R${round(value / 1_000_000, 1)}m`;
  }
  if (value >= 1_000) {
    return `R${round(value / 1_000, 0)}k`;
  }
  return `R${round(value, 0)}`;
}

function normalizeFilter(value?: string | null) {
  return normalizeText(value ?? '');
}

function inferTenderMaterialTags(record: TenderOpportunityRecord, boqs: TenderBoqRecord[]) {
  const relatedBoqs = boqs.filter((boq) => boq.opportunityId === record.id);
  const materialText = [
    record.title,
    record.description ?? '',
    record.procurementCategory ?? '',
    record.projectMetadata?.scopeSummary ?? '',
    ...(record.projectMetadata?.detectedMaterials ?? []),
    ...record.documents.flatMap((document) => [
      document.fileName,
      document.kind,
      document.analysisSummary ?? '',
      ...(document.extractedMetadata?.detectedMaterials ?? []),
    ]),
    ...relatedBoqs.flatMap((boq) => boq.lines.map((line) => line.description)),
  ].join(' ');

  const candidates = [
    ['Cladding', /cladd|facade|façade|tile/i],
    ['Brickwork', /brick|masonry|wall/i],
    ['Paving', /pav|driveway|walkway|road/i],
    ['Blocks', /block|screen|breeze/i],
    ['Capping', /capping|coping|lintel/i],
    ['Flooring', /floor|screed|slab/i],
    ['Drawing Review', /drawing|plan|architect|dwg|cad/i],
    ['BOQ Review', /\bboq\b|bill of quantities|rfq|quotation/i],
  ] as const;

  const detected = candidates
    .filter(([, pattern]) => pattern.test(materialText))
    .map(([label]) => label);
  const metadataMaterials = record.projectMetadata?.detectedMaterials ?? [];

  return Array.from(new Set([...metadataMaterials, ...detected])).slice(0, 8);
}

function inferTenderMemberRoles(record: TenderOpportunityRecord, materialTags: string[], gapLines: TenderMemberAccessGapLine[]): TenderMemberRole[] {
  const haystack = normalizeText([
    record.title,
    record.description ?? '',
    record.procurementCategory ?? '',
    record.type,
    record.projectMetadata?.scopeSummary ?? '',
    materialTags.join(' '),
    gapLines.map((line) => line.description).join(' '),
  ].join(' '));
  const roles = new Set<TenderMemberRole>();

  if (/architect|drawing|plan|facade|refurbishment|building/.test(haystack)) {
    roles.add('Architect');
  }
  if (/interior|hospitality|fit out|fitout|feature wall|finish/.test(haystack)) {
    roles.add('Interior Designer');
  }
  if (/boq|quantity|rfq|rate|quote|pricing|bill/.test(haystack) || gapLines.length > 0) {
    roles.add('Quantity Surveyor');
  }
  if (/construction|contractor|masonry|civil|maintenance|installation|completion/.test(haystack)) {
    roles.add('Contractor');
  }
  if (gapLines.length > 0 || /supply|material|tile|brick|paving|cladding|block|capping/.test(haystack)) {
    roles.add('Quantity Surveyor');
    roles.add('Contractor');
  }

  if (roles.size === 0) {
    roles.add('Architect');
    roles.add('Quantity Surveyor');
  }

  return Array.from(roles);
}

function buildTenderGapLines(record: TenderOpportunityRecord, boqs: TenderBoqRecord[]): TenderMemberAccessGapLine[] {
  const relatedBoqs = boqs.filter((boq) => boq.opportunityId === record.id);
  const gapLines = relatedBoqs.flatMap((boq) => boq.lines
    .filter((line) => line.matchStatus !== 'Mapped' || !line.suggestedProductId)
    .map((line) => ({
      id: line.id,
      reference: line.reference,
      description: line.description,
      quantityLabel: line.quantityLabel,
      status: line.matchStatus,
    } satisfies TenderMemberAccessGapLine)));

  if (gapLines.length > 0) {
    return gapLines.slice(0, 8);
  }

  if (record.boqStatus === 'Missing') {
    return [{
      id: `${record.id}-scope-review`,
      reference: record.sourceReference ?? record.id,
      description: record.projectMetadata?.scopeSummary ?? record.description ?? 'Source pack requires member review before products can be matched.',
      quantityLabel: 'Scope review',
      status: 'Scope Review',
    }];
  }

  return [];
}

function buildTenderMemberAccess(record: TenderOpportunityRecord, store: TenderStore): TenderMemberAccessSummary {
  const gapLines = buildTenderGapLines(record, store.boqs);
  const materialTags = inferTenderMaterialTags(record, store.boqs);
  const requiredRoles = inferTenderMemberRoles(record, materialTags, gapLines);
  const documents = record.documents
    .filter((document) => document.kind === 'BOQ' || document.kind === 'RFQ' || document.kind === 'Tender Document' || document.kind === 'Architectural Drawing')
    .map((document) => ({
      id: document.id,
      kind: document.kind,
      fileName: document.fileName,
      url: document.importedAssetUrl ?? document.sourceUrl ?? document.url,
      importStatus: document.importedAssetUrl ? 'Imported' as const : 'Source Linked' as const,
    }))
    .slice(0, 6);
  const responseCount = store.memberResponses.filter((response) => response.opportunityId === record.id).length;
  const isOpen = record.stage !== 'Awarded' && record.stage !== 'Lost' && Date.parse(record.closeDate) >= Date.now() - 24 * 60 * 60 * 1000;

  return {
    isOpen,
    accessLabel: gapLines.length > 0 ? 'Partner quote needed' : 'Open for member review',
    requiredRoles,
    materialTags,
    gapLines,
    documents,
    responseCount,
  };
}

function mapOpportunity(record: TenderOpportunityRecord, store: TenderStore): TenderOpportunitySummary {
  return {
    id: record.id,
    source: record.source,
    type: record.type,
    client: record.client,
    title: record.title,
    description: record.description ?? null,
    location: record.location,
    closeDate: record.closeDate,
    tenderStartDate: record.tenderStartDate ?? null,
    boqStatus: record.boqStatus,
    owner: record.owner,
    stage: record.stage,
    valueZar: record.valueZar,
    procurementCategory: record.procurementCategory ?? null,
    sourceStatus: record.sourceStatus ?? null,
    contactName: record.contactName ?? null,
    contactEmail: record.contactEmail ?? null,
    contactPhone: record.contactPhone ?? null,
    sourceReference: record.sourceReference ?? null,
    sourceUrl: record.sourceUrl ?? null,
    linkedCustomerId: record.linkedCustomerId ?? null,
    linkedCustomerName: record.linkedCustomerName ?? null,
    projectMetadata: record.projectMetadata ?? null,
    memberAccess: buildTenderMemberAccess(record, store),
    documentsCount: record.documents.length,
    lastUpdatedAt: record.updatedAt,
  };
}

function mapDocument(record: TenderDocumentRecord): TenderDocumentSummary {
  return {
    id: record.id,
    opportunityId: record.opportunityId,
    kind: record.kind,
    fileName: record.fileName,
    mimeType: record.mimeType,
    url: record.importedAssetUrl ?? record.sourceUrl ?? record.url,
    sourceUrl: record.sourceUrl ?? record.url,
    importedAssetUrl: record.importedAssetUrl ?? null,
    importedAt: record.importedAt ?? null,
    importStatus: record.importedAssetUrl ? 'Imported' : 'Source Linked',
    uploadedAt: record.uploadedAt,
    analysisSummary: record.analysisSummary ?? null,
    analysisStatus: record.analysisStatus,
    providerLabel: record.providerLabel ?? null,
    extractedMetadata: record.extractedMetadata ?? null,
  };
}

function mapBoq(record: TenderBoqRecord): TenderBoqSummary {
  const mappedLines = record.lines.filter((line) => line.matchStatus === 'Mapped').length;
  const ambiguousLines = record.lines.filter((line) => line.matchStatus === 'Ambiguous').length;
  const unmappedLines = record.lines.filter((line) => line.matchStatus === 'Unmapped').length;
  return {
    id: record.id,
    tenderId: record.opportunityId,
    tenderTitle: record.tenderTitle,
    sourceDocumentId: record.sourceDocumentId ?? null,
    sourceDocumentKind: record.sourceDocumentKind ?? null,
    status: record.status,
    totalLines: record.lines.length,
    mappedLines,
    unmappedLines,
    ambiguousLines,
    uploadedAt: record.uploadedAt,
    fileName: record.fileName,
    parseMode: record.parseMode,
    reviewNote: record.reviewNote ?? null,
    lines: record.lines,
  };
}

function mapQuote(record: TenderQuoteRecord): TenderQuoteSummary {
  return {
    id: record.id,
    tenderId: record.opportunityId,
    tenderTitle: record.tenderTitle,
    status: record.status,
    boqId: record.boqId ?? null,
    valueZar: record.valueZar,
    costZar: record.costZar,
    marginPct: record.marginPct,
    discountPct: record.discountPct ?? null,
    markupPct: record.markupPct ?? null,
    lastUpdated: record.lastUpdated,
    exclusions: record.exclusions,
    notes: record.notes ?? null,
    mappedItems: record.mappedItems,
    businessDocumentKey: record.businessDocumentKey ?? null,
    pdfUrl: record.pdfUrl ?? null,
  };
}

function mapMemberResponse(record: TenderMemberResponseRecord): TenderMemberResponseSummary {
  return {
    id: record.id,
    tenderId: record.opportunityId,
    tenderTitle: record.tenderTitle,
    memberName: record.memberName,
    memberRole: record.memberRole,
    companyName: record.companyName ?? null,
    email: record.email,
    phone: record.phone ?? null,
    scopeNote: record.scopeNote ?? null,
    status: record.status,
    createdAt: record.createdAt,
  };
}

function buildSnapshot(): TenderDeskSnapshot {
  const store = readTenderStore();
  const today = Date.now();
  const inSevenDays = today + 7 * 24 * 60 * 60 * 1000;

  return {
    opportunities: store.opportunities.map((opportunity) => mapOpportunity(opportunity, store)).sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt)),
    documents: store.opportunities.flatMap((opportunity) => opportunity.documents.map(mapDocument)),
    boqs: store.boqs.map(mapBoq).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    quotes: store.quotes.map(mapQuote).sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)),
    submissions: store.submissions.map((submission) => ({
      id: submission.id,
      tenderId: submission.opportunityId,
      tenderTitle: submission.tenderTitle,
      status: submission.status,
      submittedAt: submission.submittedAt,
      responseExpected: submission.responseExpected,
      channel: submission.channel,
      quoteId: submission.quoteId,
      quoteValueZar: submission.quoteValueZar ?? null,
      quoteBusinessDocumentKey: submission.quoteBusinessDocumentKey ?? null,
      attachments: submission.attachments,
    })),
    memberResponses: store.memberResponses.map(mapMemberResponse).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    metrics: {
      activeTenders: store.opportunities.filter((opportunity) => opportunity.stage !== 'Awarded' && opportunity.stage !== 'Lost').length,
      boqsToReview: store.boqs.filter((boq) => boq.status === 'Review Needed').length,
      draftQuotes: store.quotes.filter((quote) => quote.status !== 'Submitted').length,
      submissionsDueSoon: store.opportunities.filter((opportunity) => {
        const closeDate = Date.parse(opportunity.closeDate);
        return Number.isFinite(closeDate) && closeDate >= today && closeDate <= inSevenDays;
      }).length,
    },
  };
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeKeyword(value: string) {
  return normalizeText(value).trim();
}

function extractTokens(value: string) {
  return new Set(normalizeText(value).split(' ').filter((token) => token.length > 2));
}

function toIsoDate(value?: string | null) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}

function inferOpportunityTitle(title?: string | null, description?: string | null) {
  const cleanTitle = title?.trim() ?? '';
  const cleanDescription = description?.trim() ?? '';
  const codeLikeTitle = /^[A-Z0-9/_-]{6,}$/.test(cleanTitle);
  if (cleanDescription && (!cleanTitle || codeLikeTitle)) {
    return cleanDescription.slice(0, 140);
  }
  return cleanTitle || cleanDescription || 'Government Tender Opportunity';
}

function inferTenderType(input: { mainProcurementCategory?: string | null; description?: string | null; title?: string | null }) {
  const haystack = normalizeText([
    input.mainProcurementCategory ?? '',
    input.description ?? '',
    input.title ?? '',
  ].join(' '));
  if (haystack.includes('residential') || haystack.includes('housing')) {
    return 'Residential' as const;
  }
  if (haystack.includes('infrastructure') || haystack.includes('municipal') || haystack.includes('public') || haystack.includes('civil')) {
    return 'Public / Infrastructure' as const;
  }
  return 'Commercial' as const;
}

function inferLocation(input: { deliveryLocation?: string | null; province?: string | null }) {
  return input.deliveryLocation?.trim() || input.province?.trim() || 'South Africa';
}

function keywordMatchScore(text: string, keywords: string[]) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return 0;
  }

  return keywords.reduce((score, keyword) => {
    const normalizedKeyword = normalizeKeyword(keyword);
    if (!normalizedKeyword) {
      return score;
    }
    return normalized.includes(normalizedKeyword) ? score + 1 : score;
  }, 0);
}

interface EtenderDocument {
  id?: string;
  title?: string;
  description?: string;
  url?: string;
  format?: string;
  datePublished?: string;
}

interface EtenderRelease {
  ocid: string;
  date?: string;
  buyer?: { name?: string | null } | null;
  tender?: {
    id?: string | null;
    title?: string | null;
    description?: string | null;
    province?: string | null;
    deliveryLocation?: string | null;
    mainProcurementCategory?: string | null;
    status?: string | null;
    value?: { amount?: number | null } | null;
    tenderPeriod?: { startDate?: string | null; endDate?: string | null } | null;
    procuringEntity?: { name?: string | null } | null;
    contactPerson?: { name?: string | null; email?: string | null; telephoneNumber?: string | null } | null;
    documents?: EtenderDocument[] | null;
  } | null;
}

async function fetchEtenderReleases(input: SyncEtendersInput) {
  const today = new Date();
  const defaultDateTo = today.toISOString().slice(0, 10);
  const defaultDateFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dateFrom = input.dateFrom ?? defaultDateFrom;
  const dateTo = input.dateTo ?? defaultDateTo;
  const pageSize = Math.min(Math.max(input.pageSize ?? 50, 1), 100);
  const maxPages = Math.min(Math.max(input.maxPages ?? 3, 1), 10);
  const releases: EtenderRelease[] = [];

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const url = new URL(etenderApiBaseUrl);
    url.searchParams.set('PageNumber', String(pageNumber));
    url.searchParams.set('PageSize', String(pageSize));
    url.searchParams.set('dateFrom', dateFrom);
    url.searchParams.set('dateTo', dateTo);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`eTender API returned ${response.status} while syncing government opportunities.`);
    }

    const payload = await response.json() as { releases?: EtenderRelease[] };
    const pageReleases = Array.isArray(payload.releases) ? payload.releases : [];
    releases.push(...pageReleases);

    if (pageReleases.length < pageSize) {
      break;
    }
  }

  return {
    releases,
    dateFrom,
    dateTo,
  };
}

function mapEtenderDocuments(opportunityId: string, release: EtenderRelease, now: string): TenderDocumentRecord[] {
  return (release.tender?.documents ?? [])
    .filter((document) => Boolean(document.url))
    .map((document) => {
      const title = document.title?.trim() || document.description?.trim() || 'Government Tender Document';
      const lowerTitle = title.toLowerCase();
      const kind: TenderDocumentRecord['kind'] =
        lowerTitle.includes('boq') || lowerTitle.includes('bill of quantities')
          ? 'BOQ'
          : lowerTitle.includes('rfq')
            ? 'RFQ'
            : lowerTitle.includes('draw')
              ? 'Architectural Drawing'
              : 'Tender Document';
      const extractedMetadata = extractTenderProjectMetadata({
        fileName: title,
        mimeType: document.format ? `application/${document.format}` : 'application/octet-stream',
        extractedText: [document.title ?? '', document.description ?? '', release.tender?.description ?? ''].join('\n'),
        fallbackTitle: release.tender?.title ?? document.title ?? null,
        fallbackReference: release.tender?.id ?? release.ocid ?? null,
        fallbackContactName: release.tender?.contactPerson?.name ?? null,
        fallbackContactEmail: release.tender?.contactPerson?.email ?? null,
        fallbackContactPhone: release.tender?.contactPerson?.telephoneNumber ?? null,
        fallbackLocation: inferLocation({ deliveryLocation: release.tender?.deliveryLocation, province: release.tender?.province }),
      });

      return {
        id: createKey('TDOC'),
        opportunityId,
        kind,
        fileName: title,
        mimeType: document.format ? `application/${document.format}` : 'application/octet-stream',
        url: String(document.url),
        sourceUrl: String(document.url),
        importedAssetUrl: null,
        importedAt: null,
        uploadedAt: toIsoDate(document.datePublished) ?? now,
        analysisSummary: `Synced from South African eTender portal release ${release.ocid}.`,
        analysisStatus: 'Queued',
        providerLabel: 'South African eTender OCDS API',
        extractedMetadata,
      };
    });
}

function mergeDocuments(current: TenderDocumentRecord[], incoming: TenderDocumentRecord[]) {
  const byKey = new Map<string, TenderDocumentRecord>(
    current.map((document) => [`${document.url}|${document.fileName}`, document]),
  );
  for (const document of incoming) {
    const key = `${document.url}|${document.fileName}`;
    const existing = byKey.get(key);
    if (!existing) {
      current.push(document);
      byKey.set(key, document);
    } else {
      existing.analysisSummary ||= document.analysisSummary;
      existing.providerLabel ||= document.providerLabel;
      existing.extractedMetadata = mergeProjectMetadata(existing.extractedMetadata, document.extractedMetadata);
    }
  }
}

async function listProductsForMatching() {
  return prisma.product.findMany(productMatchArgs);
}

function pickProductMatch(description: string, products: ProductMatchRecord[]) {
  const descriptionTokens = extractTokens(description);
  let best: { product: ProductMatchRecord; score: number } | null = null;

  for (const product of products) {
    const haystack = [
      product.name,
      product.publicSku,
      product.category,
      product.productType,
      product.finish ?? '',
      product.collectionName ?? '',
      product.description ?? '',
      ...(product.presentationTags ?? []),
    ].join(' ');
    const productTokens = extractTokens(haystack);
    let score = 0;
    for (const token of descriptionTokens) {
      if (productTokens.has(token)) {
        score += token.length > 5 ? 3 : 1;
      }
    }
    if (normalizeText(description).includes(normalizeText(product.publicSku))) {
      score += 5;
    }
    if (normalizeText(description).includes(normalizeText(product.name))) {
      score += 6;
    }

    if (!best || score > best.score) {
      best = { product, score };
    }
  }

  if (!best || best.score <= 1) {
    return null;
  }

  return {
    productId: best.product.referenceId,
    productName: best.product.name,
    confidenceScore: Math.min(0.98, round(best.score / 12, 2)),
  };
}

function extractLooseText(buffer: Buffer) {
  return buffer
    .toString('utf8')
    .replace(/[^\x20-\x7E\r\n\t]/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, 12000);
}

const tenderMaterialKeywords = [
  'brick',
  'bricks',
  'cladding',
  'tile',
  'tiles',
  'paving',
  'paver',
  'masonry',
  'facade',
  'wall',
  'floor',
  'flooring',
  'coping',
  'capping',
  'kerb',
  'grout',
  'adhesive',
  'porcelain',
  'stone',
];

function cleanMetadataValue(value?: string | null) {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\s+/g, ' ').replace(/^[\s:,-]+|[\s:,-]+$/g, '').trim();
  return normalized || null;
}

function extractRegexValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = cleanMetadataValue(match?.[1]);
    if (value) {
      return value;
    }
  }
  return null;
}

function extractEmailFromText(text: string) {
  const match = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  return cleanMetadataValue(match?.[0] ?? null);
}

function extractPhoneFromText(text: string) {
  const match = text.match(/(?:\+27|0)\s?\d(?:[\s-]?\d){8,10}/);
  return cleanMetadataValue(match?.[0] ?? null);
}

function extractDateValue(text: string, labels: string[]) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(?:${escaped.join('|')})\\s*[:\\-]?\\s*([0-3]?\\d[\\/\\-][01]?\\d[\\/\\-](?:20)?\\d{2}|[0-3]?\\d\\s+[A-Za-z]{3,9}\\s+20\\d{2}|20\\d{2}[\\/\\-][01]?\\d[\\/\\-][0-3]?\\d)`, 'i');
  return extractRegexValue(text, [pattern]);
}

function extractDrawingReferences(text: string) {
  const matches = text.match(/\b(?:DRW|DWG|ARCH|A|S|E|M|CIV|DET)[-_ ]?\d{1,4}[A-Z]?\b/gi) ?? [];
  return [...new Set(matches.map((match) => match.replace(/\s+/g, ' ').trim()).filter((match) => match.length >= 3))].slice(0, 8);
}

function extractDetectedMaterials(text: string) {
  const haystack = normalizeText(text);
  return tenderMaterialKeywords.filter((keyword) => haystack.includes(normalizeText(keyword))).slice(0, 8);
}

function buildScopeSummary(text: string) {
  const sentences = text
    .replace(/\r/g, '\n')
    .split(/(?<=[.!?])\s+|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 24);
  const candidate = sentences.find((line) => /brick|cladding|tile|paving|masonry|facade|floor|wall|supply|installation|construction/i.test(line))
    ?? sentences[0]
    ?? '';
  return cleanMetadataValue(candidate?.slice(0, 220));
}

function mergeProjectMetadata(...items: Array<TenderProjectMetadata | null | undefined>): TenderProjectMetadata | null {
  const merged: TenderProjectMetadata = {
    drawingReferences: [],
    detectedMaterials: [],
  };

  for (const item of items) {
    if (!item) {
      continue;
    }
    merged.projectName ||= cleanMetadataValue(item.projectName);
    merged.tenderNumber ||= cleanMetadataValue(item.tenderNumber);
    merged.siteAddress ||= cleanMetadataValue(item.siteAddress);
    merged.deliveryAddress ||= cleanMetadataValue(item.deliveryAddress);
    merged.briefingDate ||= cleanMetadataValue(item.briefingDate);
    merged.briefingLocation ||= cleanMetadataValue(item.briefingLocation);
    merged.scopeSummary ||= cleanMetadataValue(item.scopeSummary);
    merged.contactName ||= cleanMetadataValue(item.contactName);
    merged.contactEmail ||= cleanMetadataValue(item.contactEmail);
    merged.contactPhone ||= cleanMetadataValue(item.contactPhone);
    merged.drawingReferences = [...new Set([...merged.drawingReferences, ...(item.drawingReferences ?? [])])].slice(0, 8);
    merged.detectedMaterials = [...new Set([...merged.detectedMaterials, ...(item.detectedMaterials ?? [])])].slice(0, 8);
  }

  const hasData = Boolean(
    merged.projectName
    || merged.tenderNumber
    || merged.siteAddress
    || merged.deliveryAddress
    || merged.briefingDate
    || merged.briefingLocation
    || merged.scopeSummary
    || merged.contactName
    || merged.contactEmail
    || merged.contactPhone
    || merged.drawingReferences.length
    || merged.detectedMaterials.length,
  );

  return hasData ? merged : null;
}

function extractTenderProjectMetadata(input: {
  fileName: string;
  mimeType: string;
  extractedText?: string;
  fallbackTitle?: string | null;
  fallbackReference?: string | null;
  fallbackContactName?: string | null;
  fallbackContactEmail?: string | null;
  fallbackContactPhone?: string | null;
  fallbackLocation?: string | null;
}): TenderProjectMetadata | null {
  const text = cleanMetadataValue(input.extractedText) ?? '';
  const fileStem = cleanMetadataValue(path.basename(input.fileName, path.extname(input.fileName)).replace(/[_-]+/g, ' '));
  const projectName = extractRegexValue(text, [
    /(?:project(?:\s+title|\s+name)?|works?)\s*[:\-]\s*([^\n]{6,140})/i,
    /(?:tender(?:\s+description)?|rfq(?:\s+description)?)\s*[:\-]\s*([^\n]{6,140})/i,
  ]) ?? input.fallbackTitle ?? fileStem;

  const metadata = mergeProjectMetadata({
    projectName,
    tenderNumber: extractRegexValue(text, [
      /(?:tender|bid|rfq|quotation)\s*(?:no|number|ref(?:erence)?)\s*[:\-]?\s*([A-Z0-9/_-]{4,})/i,
    ]) ?? input.fallbackReference ?? null,
    siteAddress: extractRegexValue(text, [
      /(?:site address|physical address|project address|site location|works address)\s*[:\-]\s*([^\n]{8,180})/i,
    ]) ?? input.fallbackLocation ?? null,
    deliveryAddress: extractRegexValue(text, [
      /(?:delivery address|delivery location|goods to be delivered to)\s*[:\-]\s*([^\n]{8,180})/i,
    ]),
    briefingDate: extractDateValue(text, ['briefing date', 'briefing', 'site inspection', 'compulsory briefing']),
    briefingLocation: extractRegexValue(text, [
      /(?:briefing venue|briefing location|site inspection venue|compulsory briefing venue)\s*[:\-]\s*([^\n]{6,180})/i,
    ]),
    scopeSummary: buildScopeSummary(text || [input.fallbackTitle, input.fileName].filter(Boolean).join(' ')),
    contactName: extractRegexValue(text, [
      /(?:contact person|enquiries?|attention)\s*[:\-]\s*([A-Za-z][^\n]{3,80})/i,
    ]) ?? input.fallbackContactName ?? null,
    contactEmail: extractEmailFromText(text) ?? input.fallbackContactEmail ?? null,
    contactPhone: extractPhoneFromText(text) ?? input.fallbackContactPhone ?? null,
    drawingReferences: extractDrawingReferences(`${input.fileName}\n${text}`),
    detectedMaterials: extractDetectedMaterials(`${input.fileName}\n${text}`),
  });

  if (!metadata && (input.mimeType.startsWith('image/') || input.fileName.toLowerCase().includes('draw'))) {
    return {
      projectName: input.fallbackTitle ?? fileStem,
      tenderNumber: input.fallbackReference ?? null,
      siteAddress: input.fallbackLocation ?? null,
      deliveryAddress: null,
      briefingDate: null,
      briefingLocation: null,
      scopeSummary: 'Architectural drawing imported for manual review and BOQ support.',
      contactName: input.fallbackContactName ?? null,
      contactEmail: input.fallbackContactEmail ?? null,
      contactPhone: input.fallbackContactPhone ?? null,
      drawingReferences: extractDrawingReferences(input.fileName),
      detectedMaterials: extractDetectedMaterials(input.fileName),
    };
  }

  return metadata;
}

function applyMetadataToOpportunity(opportunity: TenderOpportunityRecord, metadata?: TenderProjectMetadata | null) {
  const merged = mergeProjectMetadata(opportunity.projectMetadata, metadata);
  if (!merged) {
    return;
  }
  opportunity.projectMetadata = merged;
  opportunity.contactName ||= merged.contactName ?? null;
  opportunity.contactEmail ||= merged.contactEmail ?? null;
  opportunity.contactPhone ||= merged.contactPhone ?? null;
  opportunity.location = opportunity.location && opportunity.location !== 'South Africa'
    ? opportunity.location
    : (merged.siteAddress ?? opportunity.location);
}

function parseQuantity(raw: string) {
  const cleaned = raw.replace(/,/g, '').replace(/[^\d.]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildFallbackLine(fileName: string): TenderBoqLine[] {
  return [{
    id: createKey('LINE'),
    reference: '1',
    description: path.basename(fileName, path.extname(fileName)).replace(/[-_]+/g, ' '),
    quantityLabel: '1 lot',
    quantity: 1,
    unit: 'lot',
    matchStatus: 'Unmapped',
    suggestedProductId: null,
    suggestedProductName: null,
    confidenceScore: null,
  }];
}

function inferLineFromRecord(record: Record<string, unknown>, index: number) {
  const entries = Object.entries(record);
  const findValue = (patterns: string[]) => {
    const matchedEntry = entries.find(([key]) => patterns.some((pattern) => normalizeText(key).includes(pattern)));
    return matchedEntry?.[1];
  };

  const reference = String(findValue(['ref', 'item', 'code', 'line']) ?? index + 1);
  const description = String(findValue(['description', 'spec', 'material', 'item']) ?? entries.map(([, value]) => String(value)).join(' ')).trim();
  const quantityRaw = String(findValue(['qty', 'quantity', 'amount']) ?? '1');
  const unit = String(findValue(['unit', 'uom']) ?? '').trim() || null;

  if (!description) {
    return null;
  }

  return {
    id: createKey('LINE'),
    reference,
    description,
    quantityLabel: unit ? `${quantityRaw} ${unit}` : quantityRaw,
    quantity: parseQuantity(quantityRaw),
    unit,
  };
}

function parseSpreadsheetLines(fileName: string, buffer: Buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return buildFallbackLine(fileName);
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    const mapped = rows
      .map((row, index) => inferLineFromRecord(row, index))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .slice(0, 120);

    return mapped.length ? mapped : buildFallbackLine(fileName);
  } catch {
    return buildFallbackLine(fileName);
  }
}

function parseTextLines(fileName: string, text: string) {
  const rawLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 6)
    .slice(0, 120);

  const lines = rawLines.map((line, index) => {
    const quantityMatch = line.match(/(\d[\d,.\s]*)\s*(m2|pcs|bags|lm|m|m3|ea|kg)?$/i);
    const quantityLabel = quantityMatch ? quantityMatch[0].trim() : '1 lot';
    const quantity = quantityMatch ? parseQuantity(quantityMatch[1]) : 1;
    const unit = quantityMatch?.[2] ?? 'lot';
    const description = quantityMatch ? line.slice(0, line.length - quantityMatch[0].length).trim() : line;
    return {
      id: createKey('LINE'),
      reference: String(index + 1),
      description: description || line,
      quantityLabel,
      quantity,
      unit,
    };
  });

  return lines.length ? lines : buildFallbackLine(fileName);
}

async function parseTenderBoqLines(fileName: string, mimeType: string, buffer: Buffer, parseMode: UploadTenderBoqInput['parseMode'], aiDirection?: string) {
  const extension = path.extname(fileName).toLowerCase();
  const looseText = extractLooseText(buffer);
  const products = await listProductsForMatching();

  const baseLines =
    extension === '.xlsx' || extension === '.xls' || extension === '.csv'
      ? parseSpreadsheetLines(fileName, buffer)
      : parseTextLines(fileName, looseText);

  const lines: TenderBoqLine[] = baseLines.map((line) => {
    const match = pickProductMatch(line.description, products);
    const matchStatus: TenderBoqLine['matchStatus'] =
      parseMode === 'Manual Mapping'
        ? (match ? 'Mapped' : 'Ambiguous')
        : (match?.confidenceScore && match.confidenceScore >= 0.45 ? 'Mapped' : match ? 'Ambiguous' : 'Unmapped');

    return {
      ...line,
      matchStatus,
      suggestedProductId: match?.productId ?? null,
      suggestedProductName: match?.productName ?? null,
      confidenceScore: match?.confidenceScore ?? null,
    };
  });

  const analysis = await tenderIntelligence.analyzeDocument({
    fileName,
    mimeType,
    extractedText: looseText,
    aiDirection,
  });

  return {
    lines,
    analysis,
  };
}

async function upsertTenderCustomerProfile(input: {
  client: string;
  email?: string;
  phone?: string;
  type: TenderOpportunityRecord['type'];
}) {
  const normalizedEmail = input.email?.trim().toLowerCase() || null;
  const normalizedPhone = input.phone?.trim() || null;

  const existing = await prisma.customerProfile.findFirst({
    where: normalizedEmail
      ? { OR: [{ email: normalizedEmail }, { name: input.client }] }
      : normalizedPhone
        ? { OR: [{ phone: normalizedPhone }, { name: input.client }] }
        : { name: input.client },
  });

  if (existing) {
    return prisma.customerProfile.update({
      where: { id: existing.id },
      data: {
        email: normalizedEmail ?? existing.email,
        phone: normalizedPhone ?? existing.phone,
        customerType: existing.customerType ?? (input.type === 'Public / Infrastructure' ? 'Trade' : 'Retail'),
      },
    });
  }

  return prisma.customerProfile.create({
    data: {
      customerKey: `CUST_TENDER_${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name: input.client,
      email: normalizedEmail,
      phone: normalizedPhone,
      customerType: input.type === 'Public / Infrastructure' ? 'Trade' : 'Retail',
      stage: 'Lead',
    },
  });
}

function recalculateBoqState(boq: TenderBoqRecord) {
  const mappedLines = boq.lines.filter((line) => line.matchStatus === 'Mapped').length;
  const ambiguousLines = boq.lines.filter((line) => line.matchStatus === 'Ambiguous').length;
  const unmappedLines = boq.lines.filter((line) => line.matchStatus === 'Unmapped').length;
  boq.status = ambiguousLines > 0 || unmappedLines > 0 ? 'Review Needed' : 'Mapped';
  boq.reviewNote =
    boq.status === 'Mapped'
      ? 'All BOQ lines are mapped to BTS catalog products and ready for quote generation.'
      : `${ambiguousLines} ambiguous line${ambiguousLines === 1 ? '' : 's'} and ${unmappedLines} unmapped line${unmappedLines === 1 ? '' : 's'} still require review.`;
  return { mappedLines, ambiguousLines, unmappedLines };
}

function createTenderBoqRecord(input: {
  opportunity: TenderOpportunityRecord;
  fileName: string;
  parseMode: UploadTenderBoqInput['parseMode'];
  parsed: Awaited<ReturnType<typeof parseTenderBoqLines>>;
  uploadedAt: string;
  sourceDocumentId?: string | null;
  sourceDocumentKind?: TenderDocumentRecord['kind'] | null;
}): TenderBoqRecord {
  const boq: TenderBoqRecord = {
    id: createKey('BOQ'),
    opportunityId: input.opportunity.id,
    tenderTitle: input.opportunity.title,
    sourceDocumentId: input.sourceDocumentId ?? null,
    sourceDocumentKind: input.sourceDocumentKind ?? null,
    status: 'Review Needed',
    uploadedAt: input.uploadedAt,
    fileName: input.fileName,
    parseMode: input.parseMode,
    reviewNote: input.parsed.analysis.summary,
    lines: input.parsed.lines,
  };
  recalculateBoqState(boq);
  return boq;
}

function canAutoPromoteTenderDocument(document: TenderDocumentRecord) {
  return document.kind === 'BOQ' || document.kind === 'RFQ';
}

function hasExistingBoqForDocument(store: ReturnType<typeof readTenderStore>, opportunityId: string, document: TenderDocumentRecord) {
  return store.boqs.some((boq) =>
    boq.opportunityId === opportunityId
    && (
      (boq.sourceDocumentId && boq.sourceDocumentId === document.id)
      || boq.fileName === document.fileName
    ));
}

function findExistingBoqForDocument(store: ReturnType<typeof readTenderStore>, opportunityId: string, document: TenderDocumentRecord) {
  return store.boqs.find((boq) =>
    boq.opportunityId === opportunityId
    && (
      (boq.sourceDocumentId && boq.sourceDocumentId === document.id)
      || boq.fileName === document.fileName
    ));
}

function syncOpportunityFromBoqs(storeOpportunity: TenderOpportunityRecord, boqs: TenderBoqRecord[]) {
  const related = boqs.filter((boq) => boq.opportunityId === storeOpportunity.id);
  if (!related.length) {
    storeOpportunity.boqStatus = 'Missing';
    storeOpportunity.stage = 'Intake';
    return;
  }

  const latest = [...related].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))[0];
  storeOpportunity.boqStatus = latest.status === 'Mapped' ? 'Mapped' : 'Pending Review';
  storeOpportunity.stage = latest.status === 'Mapped' ? 'Quoting' : 'BOQ Review';
  storeOpportunity.updatedAt = new Date().toISOString();
}

export function getTenderDeskSnapshot() {
  return buildSnapshot();
}

const tenderMemberRoles: TenderMemberRole[] = ['Architect', 'Interior Designer', 'Quantity Surveyor', 'Contractor'];

function mapMemberOpportunity(record: TenderOpportunityRecord, store: TenderStore): TenderMemberOpportunitySummary {
  return {
    id: record.id,
    source: record.source,
    type: record.type,
    client: record.client,
    title: record.title,
    description: record.description ?? null,
    location: record.location,
    closeDate: record.closeDate,
    valueZar: record.valueZar,
    stage: record.stage,
    sourceReference: record.sourceReference ?? null,
    sourceUrl: record.sourceUrl ?? null,
    projectMetadata: record.projectMetadata ?? null,
    memberAccess: buildTenderMemberAccess(record, store),
  };
}

function memberOpportunityMatchesFilters(opportunity: TenderMemberOpportunitySummary, filters: TenderMemberPortalFilters) {
  const role = filters.role && filters.role !== 'All' ? filters.role : null;
  if (role && !opportunity.memberAccess.requiredRoles.includes(role)) {
    return false;
  }

  const material = normalizeFilter(filters.material);
  if (material && !opportunity.memberAccess.materialTags.some((tag) => normalizeFilter(tag).includes(material))) {
    return false;
  }

  const location = normalizeFilter(filters.location);
  if (location && !normalizeFilter(opportunity.location).includes(location)) {
    return false;
  }

  const query = normalizeFilter(filters.query);
  if (!query) {
    return true;
  }

  const searchable = normalizeFilter([
    opportunity.title,
    opportunity.client,
    opportunity.description ?? '',
    opportunity.location,
    opportunity.sourceReference ?? '',
    opportunity.memberAccess.requiredRoles.join(' '),
    opportunity.memberAccess.materialTags.join(' '),
    opportunity.memberAccess.gapLines.map((line) => line.description).join(' '),
    opportunity.projectMetadata?.scopeSummary ?? '',
  ].join(' '));

  return searchable.includes(query);
}

export function getTenderMemberPortalSnapshot(filters: TenderMemberPortalFilters = {}): TenderMemberPortalSnapshot {
  const store = readTenderStore();
  const allOpportunities = store.opportunities
    .map((opportunity) => mapMemberOpportunity(opportunity, store))
    .filter((opportunity) => opportunity.memberAccess.isOpen)
    .sort((left, right) => left.closeDate.localeCompare(right.closeDate));
  const opportunities = allOpportunities.filter((opportunity) => memberOpportunityMatchesFilters(opportunity, filters));
  const responses = store.memberResponses.map(mapMemberResponse).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const materialSet = new Set<string>();
  const locationSet = new Set<string>();

  for (const opportunity of allOpportunities) {
    opportunity.memberAccess.materialTags.forEach((tag) => materialSet.add(tag));
    if (opportunity.location.trim()) {
      locationSet.add(opportunity.location.trim());
    }
  }

  return {
    opportunities,
    responses,
    filters: {
      roles: tenderMemberRoles,
      materials: Array.from(materialSet).sort((left, right) => left.localeCompare(right)),
      locations: Array.from(locationSet).sort((left, right) => left.localeCompare(right)),
    },
    metrics: {
      openTenders: allOpportunities.length,
      gapLines: allOpportunities.reduce((sum, opportunity) => sum + opportunity.memberAccess.gapLines.length, 0),
      quotePackRequests: responses.filter((response) => response.status === 'Quote Pack Requested').length,
    },
  };
}

export function createTenderMemberResponse(opportunityId: string, input: CreateTenderMemberResponseInput): TenderMemberPortalSnapshot {
  const store = readTenderStore();
  const opportunity = store.opportunities.find((record) => record.id === opportunityId);
  if (!opportunity) {
    throw new Error(`Tender opportunity ${opportunityId} was not found.`);
  }

  const memberName = input.memberName.trim();
  const email = input.email.trim();
  const memberRole = input.memberRole;
  if (!memberName) {
    throw new Error('Member name is required.');
  }
  if (!email || !email.includes('@')) {
    throw new Error('A valid member email is required.');
  }
  if (!tenderMemberRoles.includes(memberRole)) {
    throw new Error('A valid member role is required.');
  }

  const now = new Date().toISOString();
  const response: TenderMemberResponseRecord = {
    id: createKey('TMR'),
    opportunityId: opportunity.id,
    tenderTitle: opportunity.title,
    memberName,
    memberRole,
    companyName: input.companyName?.trim() || null,
    email,
    phone: input.phone?.trim() || null,
    scopeNote: input.scopeNote?.trim() || null,
    status: input.status ?? 'Quote Pack Requested',
    createdAt: now,
  };

  store.memberResponses.unshift(response);
  opportunity.updatedAt = now;
  writeTenderStore(store);
  return getTenderMemberPortalSnapshot({ role: memberRole });
}

export async function createTenderOpportunity(input: CreateTenderOpportunityInput) {
  const store = readTenderStore();
  const now = new Date().toISOString();
  const customer = await upsertTenderCustomerProfile({
    client: input.client.trim(),
    email: input.email,
    phone: input.phone,
    type: input.type,
  });

  const documents: TenderDocumentRecord[] = (input.documents ?? []).map((document) => ({
    id: createKey('TDOC'),
    opportunityId: '',
    kind: document.kind,
    fileName: document.fileName,
    mimeType: document.mimeType,
    url: document.url,
    sourceUrl: document.url,
    importedAssetUrl: null,
    importedAt: null,
    uploadedAt: now,
    analysisSummary: document.analysisSummary ?? null,
    analysisStatus: document.analysisStatus ?? 'Queued',
    providerLabel: document.providerLabel ?? null,
    extractedMetadata: document.extractedMetadata ?? null,
  }));
  const projectMetadata = mergeProjectMetadata(...documents.map((document) => document.extractedMetadata ?? null));

  const opportunity: TenderOpportunityRecord = {
    id: createKey('TND'),
    source: input.source,
    type: input.type,
    client: input.client.trim(),
    title: input.title.trim(),
    description: null,
    location: input.location.trim(),
    closeDate: input.closeDate,
    tenderStartDate: null,
    boqStatus: 'Missing',
    owner: input.owner.trim() || 'Unassigned',
    stage: 'Intake',
    valueZar: input.valueZar ?? null,
    procurementCategory: null,
    sourceStatus: null,
    contactName: null,
    contactEmail: input.email?.trim() || null,
    contactPhone: input.phone?.trim() || null,
    linkedCustomerId: customer.customerKey,
    linkedCustomerName: customer.name,
    projectMetadata,
    createdAt: now,
    updatedAt: now,
    documents,
  };

  opportunity.documents = opportunity.documents.map((document) => ({ ...document, opportunityId: opportunity.id }));
  applyMetadataToOpportunity(opportunity, projectMetadata);

  for (const document of opportunity.documents) {
    if (document.kind !== 'BOQ' && document.kind !== 'RFQ') {
      continue;
    }
    if (!isInternalUploadUrl(document.url)) {
      continue;
    }

    const internalPath = resolveInternalUploadPath(document.url);
    if (!fs.existsSync(internalPath)) {
      continue;
    }

    const buffer = fs.readFileSync(internalPath);
    const parseMode: UploadTenderBoqInput['parseMode'] = document.kind === 'RFQ' ? 'Manual Mapping' : 'AI Assisted';
    const parsed = await parseTenderBoqLines(
      document.fileName,
      document.mimeType,
      buffer,
      parseMode,
      `${document.kind} uploaded during tender intake.`,
    );
    const boq = createTenderBoqRecord({
      opportunity,
      fileName: document.fileName,
      parseMode,
      parsed,
      uploadedAt: now,
      sourceDocumentId: document.id,
      sourceDocumentKind: document.kind,
    });

    document.importedAssetUrl = document.url;
    document.importedAt = document.importedAt ?? now;
    document.analysisSummary = `${parsed.analysis.summary} Auto-promoted into BOQ desk during tender intake.`;
    document.analysisStatus = parsed.analysis.status;
    document.providerLabel = parsed.analysis.provider;
    store.boqs.unshift(boq);
  }

  syncOpportunityFromBoqs(opportunity, store.boqs);
  store.opportunities.unshift(opportunity);
  writeTenderStore(store);
  return mapOpportunity(opportunity, store);
}

export async function promoteTenderDocumentToBoq(opportunityId: string, input: PromoteTenderDocumentToBoqInput) {
  const store = readTenderStore();
  const opportunity = store.opportunities.find((record) => record.id === opportunityId);
  if (!opportunity) {
    throw new Error(`Tender opportunity ${opportunityId} was not found.`);
  }

  const document = opportunity.documents.find((record) => record.id === input.documentId);
  if (!document) {
    throw new Error(`Tender document ${input.documentId} was not found.`);
  }
  if (!canAutoPromoteTenderDocument(document)) {
    throw new Error(`Tender document ${document.fileName} is not promotable into BOQ processing.`);
  }

  const now = new Date().toISOString();
  await promoteTenderDocumentToBoqRecord({
    store,
    opportunity,
    document,
    parseMode: input.parseMode,
    aiDirection: input.aiDirection,
    now,
  });

  opportunity.updatedAt = now;
  writeTenderStore(store);
  return buildSnapshot();
}

export async function syncGovProcureTenders(input: SyncEtendersInput = {}): Promise<TenderSyncResult> {
  const { releases } = await fetchEtenderReleases(input);
  const keywords = (input.keywords?.length ? input.keywords : defaultEtenderKeywords).map(normalizeKeyword).filter(Boolean);
  const store = readTenderStore();
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const release of releases) {
    const tender = release.tender;
    if (!tender || !release.ocid) {
      skipped += 1;
      continue;
    }

    const searchableText = [
      tender.title ?? '',
      tender.description ?? '',
      tender.mainProcurementCategory ?? '',
      ...(tender.documents ?? []).map((document) => [document.title ?? '', document.description ?? ''].join(' ')),
    ].join(' ');

    const score = keywordMatchScore(searchableText, keywords);
    if (score === 0) {
      skipped += 1;
      continue;
    }

    const clientName = tender.procuringEntity?.name?.trim() || release.buyer?.name?.trim() || 'South African Government';
    const customer = await upsertTenderCustomerProfile({
      client: clientName,
      type: 'Public / Infrastructure',
    });
    const closeDate = toIsoDate(tender.tenderPeriod?.endDate) ?? toIsoDate(release.date) ?? new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const sourceReference = tender.id?.trim() || release.ocid;
    const sourceUrl = tender.documents?.[0]?.url?.trim() || `https://www.etenders.gov.za/`;
    const title = inferOpportunityTitle(tender.title, tender.description);
    const existing = store.opportunities.find((record) => record.source === 'GovProcure' && record.sourceReference === sourceReference);

    if (existing) {
      const documents = mapEtenderDocuments(existing.id, release, now);
      const documentMetadata = mergeProjectMetadata(...documents.map((document) => document.extractedMetadata ?? null));
      existing.client = clientName;
      existing.title = title;
      existing.description = tender.description?.trim() || existing.description || null;
      existing.location = inferLocation({ deliveryLocation: tender.deliveryLocation, province: tender.province });
      existing.closeDate = closeDate;
      existing.tenderStartDate = toIsoDate(tender.tenderPeriod?.startDate) ?? existing.tenderStartDate ?? null;
      existing.type = inferTenderType({
        mainProcurementCategory: tender.mainProcurementCategory,
        description: tender.description,
        title: tender.title,
      });
      existing.valueZar = typeof tender.value?.amount === 'number' ? tender.value.amount : existing.valueZar;
      existing.procurementCategory = tender.mainProcurementCategory?.trim() || existing.procurementCategory || null;
      existing.sourceStatus = tender.status?.trim() || existing.sourceStatus || null;
      existing.contactName = tender.contactPerson?.name?.trim() || existing.contactName || null;
      existing.contactEmail = tender.contactPerson?.email?.trim() || existing.contactEmail || null;
      existing.contactPhone = tender.contactPerson?.telephoneNumber?.trim() || existing.contactPhone || null;
      existing.sourceUrl = sourceUrl;
      existing.linkedCustomerId = customer.customerKey;
      existing.linkedCustomerName = customer.name;
      existing.updatedAt = now;
      mergeDocuments(existing.documents, documents);
      applyMetadataToOpportunity(existing, mergeProjectMetadata(existing.projectMetadata, documentMetadata, {
        projectName: title,
        tenderNumber: sourceReference,
        siteAddress: inferLocation({ deliveryLocation: tender.deliveryLocation, province: tender.province }),
        scopeSummary: cleanMetadataValue(tender.description),
        contactName: tender.contactPerson?.name?.trim() || null,
        contactEmail: tender.contactPerson?.email?.trim() || null,
        contactPhone: tender.contactPerson?.telephoneNumber?.trim() || null,
        drawingReferences: [],
        detectedMaterials: extractDetectedMaterials(searchableText),
      }));
      updated += 1;
      continue;
    }

    const opportunityId = createKey('TND');
    const documents = mapEtenderDocuments(opportunityId, release, now);
    const projectMetadata = mergeProjectMetadata(...documents.map((document) => document.extractedMetadata ?? null), {
      projectName: title,
      tenderNumber: sourceReference,
      siteAddress: inferLocation({ deliveryLocation: tender.deliveryLocation, province: tender.province }),
      scopeSummary: cleanMetadataValue(tender.description),
      contactName: tender.contactPerson?.name?.trim() || null,
      contactEmail: tender.contactPerson?.email?.trim() || null,
      contactPhone: tender.contactPerson?.telephoneNumber?.trim() || null,
      drawingReferences: [],
      detectedMaterials: extractDetectedMaterials(searchableText),
    });
    const opportunity: TenderOpportunityRecord = {
      id: opportunityId,
      source: 'GovProcure',
      type: inferTenderType({
        mainProcurementCategory: tender.mainProcurementCategory,
        description: tender.description,
        title: tender.title,
      }),
      client: clientName,
      title,
      description: tender.description?.trim() || null,
      location: inferLocation({ deliveryLocation: tender.deliveryLocation, province: tender.province }),
      closeDate,
      tenderStartDate: toIsoDate(tender.tenderPeriod?.startDate) ?? null,
      boqStatus: 'Missing',
      owner: 'Unassigned',
      stage: 'Intake',
      valueZar: typeof tender.value?.amount === 'number' ? tender.value.amount : null,
      procurementCategory: tender.mainProcurementCategory?.trim() || null,
      sourceStatus: tender.status?.trim() || null,
      contactName: tender.contactPerson?.name?.trim() || null,
      contactEmail: tender.contactPerson?.email?.trim() || null,
      contactPhone: tender.contactPerson?.telephoneNumber?.trim() || null,
      sourceReference,
      sourceUrl,
      linkedCustomerId: customer.customerKey,
      linkedCustomerName: customer.name,
      projectMetadata,
      createdAt: now,
      updatedAt: now,
      documents,
    };
    applyMetadataToOpportunity(opportunity, projectMetadata);
    store.opportunities.unshift(opportunity);
    imported += 1;
  }

  writeTenderStore(store);
  return {
    imported,
    updated,
    skipped,
    source: 'GovProcure',
    snapshot: buildSnapshot(),
  };
}

function inferFilenameFromUrl(url: string, fallbackName: string) {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split('/').filter(Boolean).pop();
    return decodeURIComponent(lastSegment ?? fallbackName) || fallbackName;
  } catch {
    return fallbackName;
  }
}

function isInternalUploadUrl(url: string) {
  return url.startsWith('/api/uploads/');
}

function resolveInternalUploadPath(url: string) {
  const relativePath = url.replace(/^\/api\/uploads\//, '');
  return path.join(getUploadsDirectory(), relativePath);
}

async function resolveTenderDocumentBuffer(input: {
  document: TenderDocumentRecord;
  now: string;
}): Promise<{ buffer: Buffer; mimeType: string }> {
  const { document, now } = input;
  const sourceUrl = document.sourceUrl ?? document.url;
  if (!sourceUrl) {
    throw new Error(`Tender document ${document.id} has no source URL.`);
  }

  let mimeType = document.mimeType || 'application/octet-stream';

  if (isInternalUploadUrl(sourceUrl)) {
    const internalPath = resolveInternalUploadPath(sourceUrl);
    if (!fs.existsSync(internalPath)) {
      throw new Error(`Internal upload for tender document ${document.id} was not found on disk.`);
    }

    const buffer = fs.readFileSync(internalPath);
    document.importedAssetUrl = document.importedAssetUrl ?? sourceUrl;
    document.importedAt = document.importedAt ?? now;
    return { buffer, mimeType };
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Source document fetch failed with ${response.status}.`);
  }

  mimeType = response.headers.get('content-type')?.trim() || mimeType;
  const buffer = Buffer.from(await response.arrayBuffer());

  if (!document.importedAssetUrl) {
    const stored = storePublicUpload({
      originalFilename: inferFilenameFromUrl(sourceUrl, document.fileName),
      mimeType,
      buffer,
    });
    document.importedAssetUrl = stored.url;
    document.importedAt = now;
    document.mimeType = mimeType;
  }

  return { buffer, mimeType };
}

async function promoteTenderDocumentToBoqRecord(input: {
  store: ReturnType<typeof readTenderStore>;
  opportunity: TenderOpportunityRecord;
  document: TenderDocumentRecord;
  parseMode: UploadTenderBoqInput['parseMode'];
  aiDirection?: string;
  now: string;
}) {
  const existingBoq = findExistingBoqForDocument(input.store, input.opportunity.id, input.document);
  if (existingBoq) {
    syncOpportunityFromBoqs(input.opportunity, input.store.boqs);
    return existingBoq;
  }

  const { buffer, mimeType } = await resolveTenderDocumentBuffer({
    document: input.document,
    now: input.now,
  });

  const parsed = await parseTenderBoqLines(
    input.document.fileName,
    mimeType,
    buffer,
    input.parseMode,
    input.aiDirection?.trim() || `${input.document.kind} imported from tender source workflow.`,
  );
  const boq = createTenderBoqRecord({
    opportunity: input.opportunity,
    fileName: input.document.fileName,
    parseMode: input.parseMode,
    parsed,
    uploadedAt: input.now,
    sourceDocumentId: input.document.id,
    sourceDocumentKind: input.document.kind,
  });

  input.document.analysisSummary = `${parsed.analysis.summary} Auto-promoted into BOQ desk for estimator review.`;
  input.document.analysisStatus = parsed.analysis.status;
  input.document.providerLabel = parsed.analysis.provider;
  input.document.extractedMetadata = mergeProjectMetadata(
    input.document.extractedMetadata,
    extractTenderProjectMetadata({
      fileName: input.document.fileName,
      mimeType,
      extractedText: extractLooseText(buffer),
      fallbackTitle: input.opportunity.title,
      fallbackReference: input.opportunity.sourceReference ?? null,
      fallbackContactName: input.opportunity.contactName ?? null,
      fallbackContactEmail: input.opportunity.contactEmail ?? null,
      fallbackContactPhone: input.opportunity.contactPhone ?? null,
      fallbackLocation: input.opportunity.location,
    }),
  );
  applyMetadataToOpportunity(input.opportunity, input.document.extractedMetadata);
  input.store.boqs.unshift(boq);
  syncOpportunityFromBoqs(input.opportunity, input.store.boqs);
  return boq;
}

export async function importTenderSourcePack(tenderId: string): Promise<ImportTenderSourcePackResult> {
  const store = readTenderStore();
  const opportunity = store.opportunities.find((record) => record.id === tenderId);
  if (!opportunity) {
    throw new Error(`Tender opportunity ${tenderId} was not found.`);
  }

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let autoPromotedBoqs = 0;
  const now = new Date().toISOString();

  for (const document of opportunity.documents) {
    const sourceUrl = document.sourceUrl ?? document.url;
    if (!sourceUrl) {
      failed += 1;
      continue;
    }

    let buffer: Buffer | null = null;
    let contentType = document.mimeType || 'application/octet-stream';

    try {
      if (!document.importedAssetUrl && isInternalUploadUrl(sourceUrl)) {
        const internalPath = resolveInternalUploadPath(sourceUrl);
        if (!fs.existsSync(internalPath)) {
          failed += 1;
          continue;
        }

        buffer = fs.readFileSync(internalPath);
        document.importedAssetUrl = sourceUrl;
        document.importedAt = document.importedAt ?? now;
        document.analysisSummary = `${document.analysisSummary ?? 'Tender source document synced.'} Existing BTS upload linked for review on ${toIsoDate(now) ?? now}.`;
        skipped += 1;
      } else if (!document.importedAssetUrl) {
        const response = await fetch(sourceUrl);
        if (!response.ok) {
          failed += 1;
          continue;
        }

        contentType = response.headers.get('content-type')?.trim() || contentType;
        buffer = Buffer.from(await response.arrayBuffer());
        const stored = storePublicUpload({
          originalFilename: inferFilenameFromUrl(sourceUrl, document.fileName),
          mimeType: contentType,
          buffer,
        });

        document.importedAssetUrl = stored.url;
        document.importedAt = now;
        document.mimeType = contentType;
        document.analysisSummary = `${document.analysisSummary ?? 'Tender source document synced.'} Imported into BTS storage on ${toIsoDate(now) ?? now}.`;
        imported += 1;
      } else {
        skipped += 1;
      }

      if (!document.extractedMetadata && sourceUrl) {
        if (!buffer) {
          const metadataResponse = await fetch(sourceUrl);
          if (metadataResponse.ok) {
            contentType = metadataResponse.headers.get('content-type')?.trim() || contentType;
            buffer = Buffer.from(await metadataResponse.arrayBuffer());
          }
        }

        if (buffer) {
          document.extractedMetadata = extractTenderProjectMetadata({
            fileName: document.fileName,
            mimeType: contentType,
            extractedText: extractLooseText(buffer),
            fallbackTitle: opportunity.title,
            fallbackReference: opportunity.sourceReference ?? null,
            fallbackContactName: opportunity.contactName ?? null,
            fallbackContactEmail: opportunity.contactEmail ?? null,
            fallbackContactPhone: opportunity.contactPhone ?? null,
            fallbackLocation: opportunity.location,
          });
        }
      }

      applyMetadataToOpportunity(opportunity, document.extractedMetadata);

      if (canAutoPromoteTenderDocument(document) && !hasExistingBoqForDocument(store, opportunity.id, document)) {
        const parseMode: UploadTenderBoqInput['parseMode'] = document.kind === 'RFQ' ? 'Manual Mapping' : 'AI Assisted';
        await promoteTenderDocumentToBoqRecord({
          store,
          opportunity,
          document,
          parseMode,
          aiDirection: `${document.kind} imported from government tender source pack.`,
          now,
        });
        autoPromotedBoqs += 1;
      }
    } catch {
      failed += 1;
    }
  }

  opportunity.updatedAt = now;
  writeTenderStore(store);

  return {
    imported,
    skipped,
    failed,
    autoPromotedBoqs,
    snapshot: buildSnapshot(),
  };
}

export async function storeTenderUpload(file: Express.Multer.File, aiDirection?: string): Promise<ParsedTenderUpload> {
  const stored = storePublicUpload({
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });

  const extractedText = extractLooseText(file.buffer);
  const analysis = await tenderIntelligence.analyzeDocument({
    fileName: file.originalname,
    mimeType: file.mimetype,
    extractedText,
    aiDirection,
  });
  const extractedMetadata = extractTenderProjectMetadata({
    fileName: file.originalname,
    mimeType: file.mimetype,
    extractedText,
  });

  return {
    upload: {
      fileName: stored.originalFilename,
      mimeType: stored.mimeType,
      url: stored.url,
      storagePath: stored.storagePath,
      size: stored.size,
      sha256: stored.sha256,
    },
    analysisSummary: analysis.summary,
    analysisStatus: analysis.status,
    providerLabel: analysis.provider,
    extractedMetadata,
  };
}

export async function uploadTenderBoq(opportunityId: string, file: Express.Multer.File, input: UploadTenderBoqInput) {
  const store = readTenderStore();
  const opportunity = store.opportunities.find((record) => record.id === opportunityId);
  if (!opportunity) {
    throw new Error(`Tender opportunity ${opportunityId} was not found.`);
  }

  const stored = storePublicUpload({
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  });

  const parsed = await parseTenderBoqLines(file.originalname, file.mimetype, file.buffer, input.parseMode, input.aiDirection);
  const now = new Date().toISOString();
  const extractedMetadata = extractTenderProjectMetadata({
    fileName: file.originalname,
    mimeType: file.mimetype,
    extractedText: extractLooseText(file.buffer),
    fallbackTitle: opportunity.title,
    fallbackReference: opportunity.sourceReference ?? null,
    fallbackContactName: opportunity.contactName ?? null,
    fallbackContactEmail: opportunity.contactEmail ?? null,
    fallbackContactPhone: opportunity.contactPhone ?? null,
    fallbackLocation: opportunity.location,
  });

  const document: TenderDocumentRecord = {
    id: createKey('TDOC'),
    opportunityId: opportunity.id,
    kind: 'BOQ',
    fileName: file.originalname,
    mimeType: file.mimetype,
    url: stored.url,
    uploadedAt: now,
    analysisSummary: parsed.analysis.summary,
    analysisStatus: parsed.analysis.status,
    providerLabel: parsed.analysis.provider,
    extractedMetadata,
  };

  const boq = createTenderBoqRecord({
    opportunity,
    fileName: file.originalname,
    parseMode: input.parseMode,
    parsed,
    uploadedAt: now,
    sourceDocumentId: document.id,
    sourceDocumentKind: document.kind,
  });

  opportunity.documents.unshift(document);
  applyMetadataToOpportunity(opportunity, extractedMetadata);
  opportunity.updatedAt = now;
  store.boqs.unshift(boq);
  syncOpportunityFromBoqs(opportunity, store.boqs);
  writeTenderStore(store);

  return buildSnapshot();
}

export async function updateTenderBoqLine(boqId: string, lineId: string, input: UpdateTenderBoqLineInput) {
  const store = readTenderStore();
  const boq = store.boqs.find((record) => record.id === boqId);
  if (!boq) {
    throw new Error(`BOQ ${boqId} was not found.`);
  }

  const products = await listProductsForMatching();
  const product = products.find((record) => record.referenceId === input.productId);
  if (!product) {
    throw new Error(`Product ${input.productId} was not found.`);
  }

  const line = boq.lines.find((record) => record.id === lineId);
  if (!line) {
    throw new Error(`BOQ line ${lineId} was not found.`);
  }

  line.suggestedProductId = product.referenceId;
  line.suggestedProductName = product.name;
  line.matchStatus = 'Mapped';
  line.confidenceScore = Math.max(line.confidenceScore ?? 0.5, 0.72);
  recalculateBoqState(boq);

  const opportunity = store.opportunities.find((record) => record.id === boq.opportunityId);
  if (opportunity) {
    syncOpportunityFromBoqs(opportunity, store.boqs);
  }

  writeTenderStore(store);
  return buildSnapshot();
}

export async function createTenderQuoteDraft(input: CreateTenderQuoteDraftInput) {
  const store = readTenderStore();
  const opportunity = store.opportunities.find((record) => record.id === input.tenderId);
  if (!opportunity) {
    throw new Error(`Tender opportunity ${input.tenderId} was not found.`);
  }
  const boq = store.boqs.find((record) => record.id === input.boqId);
  if (!boq) {
    throw new Error(`BOQ ${input.boqId} was not found.`);
  }

  const mappedLines = boq.lines.filter((line) => line.matchStatus === 'Mapped' && line.suggestedProductId);
  if (mappedLines.length === 0) {
    throw new Error('At least one mapped BOQ line is required before a quote can be drafted.');
  }

  const products = await listProductsForMatching();
  const discountPct = Math.max(0, input.discountPct ?? 0);
  const markupPct = Math.max(0, input.markupPct ?? 25);
  const rateMultiplier = Math.max(0, (1 + markupPct / 100) * (1 - discountPct / 100));
  const pricedLines = mappedLines.map((line) => {
    const product = products.find((record) => record.referenceId === line.suggestedProductId);
    if (!product) {
      throw new Error(`Mapped product ${line.suggestedProductId} could not be resolved.`);
    }
    const defaultSupplier = product.productSuppliers.find((record) => record.isDefault) ?? product.productSuppliers[0];
    if (!defaultSupplier) {
      throw new Error(`Product ${product.name} has no supplier linkage and cannot be quoted.`);
    }
    const baseUnitRateZar = toNumber(product.sellPriceZar);
    const unitRateZar = round(baseUnitRateZar * rateMultiplier, 2);
    const unitCostZar = toNumber(defaultSupplier.unitCostZar);
    return {
      line,
      product,
      unitRateZar,
      unitCostZar,
      totalZar: round(unitRateZar * line.quantity),
      totalCostZar: round(unitCostZar * line.quantity),
    };
  });

  const valueZar = round(pricedLines.reduce((sum, item) => sum + item.totalZar, 0));
  const costZar = round(pricedLines.reduce((sum, item) => sum + item.totalCostZar, 0));
  const marginPct = valueZar > 0 ? round(((valueZar - costZar) / valueZar) * 100, 2) : 0;

  const customerKey = opportunity.linkedCustomerId;
  if (!customerKey) {
    throw new Error('This tender is not linked to a CRM customer profile yet.');
  }

  const businessQuote = await createCustomerQuoteDocument(customerKey, {
    title: `Tender Quote · ${opportunity.title}`,
    summary: `Draft quote created from tender ${opportunity.id} and BOQ ${boq.id}.`,
    notes: input.notes ? [input.notes] : [],
    dueAt: opportunity.closeDate,
    lineItems: pricedLines.map((item) => ({
      productId: item.product.referenceId,
      quantity: item.line.quantity,
      unitPriceZar: item.unitRateZar,
    })),
  });

  const quote: TenderQuoteRecord = {
    id: createKey('QT'),
    opportunityId: opportunity.id,
    tenderTitle: opportunity.title,
    status: boq.status === 'Mapped' ? 'Ready for Review' : 'Draft',
    boqId: boq.id,
    valueZar,
    costZar,
    marginPct,
    discountPct,
    markupPct,
    lastUpdated: new Date().toISOString(),
    exclusions: input.exclusions,
    notes: input.notes ?? null,
    mappedItems: pricedLines.map((item) => ({
      boqLineId: item.line.id,
      boqDescription: item.line.description,
      productId: item.product.referenceId,
      productName: item.product.name,
      quantity: item.line.quantity,
      quantityLabel: item.line.quantityLabel,
      unitRateZar: item.unitRateZar,
      lineTotalZar: item.totalZar,
    })),
    businessDocumentKey: businessQuote.primaryDocument.key,
    pdfUrl: businessQuote.primaryDocument.pdfUrl,
  };

  store.quotes.unshift(quote);
  opportunity.stage = quote.status === 'Ready for Review' ? 'Submission Ready' : 'Quoting';
  opportunity.valueZar = valueZar;
  opportunity.updatedAt = quote.lastUpdated;
  writeTenderStore(store);
  return buildSnapshot();
}

export async function createTenderSubmission(input: CreateTenderSubmissionInput) {
  const store = readTenderStore();
  const opportunity = store.opportunities.find((record) => record.id === input.tenderId);
  if (!opportunity) {
    throw new Error(`Tender opportunity ${input.tenderId} was not found.`);
  }
  const quote = store.quotes.find((record) => record.id === input.quoteId);
  if (!quote) {
    throw new Error(`Tender quote ${input.quoteId} was not found.`);
  }
  if (quote.opportunityId !== opportunity.id) {
    throw new Error('Selected quote does not belong to the selected tender.');
  }
  if (quote.status === 'Draft') {
    throw new Error('Only submission-ready tender quotes can move into the submission workflow.');
  }

  const existingSubmission = store.submissions.find((record) => record.quoteId === quote.id);
  const previousResponseExpected = existingSubmission?.responseExpected ?? null;
  const submittedAt = new Date().toISOString().slice(0, 10);
  const attachments = input.attachments ?? [];

  if (existingSubmission) {
    existingSubmission.channel = input.channel;
    existingSubmission.responseExpected = input.responseExpected;
    existingSubmission.submittedAt = submittedAt;
    existingSubmission.quoteValueZar = quote.valueZar;
    existingSubmission.quoteBusinessDocumentKey = quote.businessDocumentKey ?? null;
    existingSubmission.attachments = attachments;
  } else {
    const submission = {
      id: createKey('SUB'),
      opportunityId: opportunity.id,
      tenderTitle: opportunity.title,
      status: 'Submitted' as const,
      submittedAt,
      responseExpected: input.responseExpected,
      channel: input.channel,
      quoteId: quote.id,
      quoteValueZar: quote.valueZar,
      quoteBusinessDocumentKey: quote.businessDocumentKey ?? null,
      attachments,
    };
    store.submissions.unshift(submission);
  }
  quote.status = 'Submitted';
  quote.lastUpdated = new Date().toISOString();
  opportunity.stage = 'Submitted';
  opportunity.updatedAt = quote.lastUpdated;

  if (quote.businessDocumentKey) {
    const quoteDocument = await prisma.businessDocument.findUnique({
      where: { documentKey: quote.businessDocumentKey },
      include: { customer: true },
    });

    if (quoteDocument && quoteDocument.documentType === 'CUSTOMER_QUOTE') {
      const snapshot =
        quoteDocument.snapshot && typeof quoteDocument.snapshot === 'object' && !Array.isArray(quoteDocument.snapshot)
          ? { ...(quoteDocument.snapshot as Record<string, unknown>) }
          : {};
      const currentNotes = Array.isArray(snapshot.notes)
        ? snapshot.notes.filter((note): note is string => typeof note === 'string')
        : [];
      const nextNotes = Array.from(new Set([
        ...currentNotes,
        `Tender submission recorded via ${input.channel}.`,
        `Response expected by ${input.responseExpected}.`,
        ...(attachments.length ? [`${attachments.length} submission attachment${attachments.length === 1 ? '' : 's'} linked.`] : []),
      ]));

      await prisma.businessDocument.update({
        where: { id: quoteDocument.id },
        data: {
          status: 'SENT',
          snapshot: {
            ...snapshot,
            notes: nextNotes,
            tenderSubmission: {
              tenderId: opportunity.id,
              submissionChannel: input.channel,
              responseExpected: input.responseExpected,
              attachmentCount: attachments.length,
              submittedAt,
            },
          } satisfies Prisma.InputJsonValue,
        },
      });

      if (quoteDocument.customerId) {
        await prisma.customerProfile.update({
          where: { id: quoteDocument.customerId },
          data: {
            stage: 'Awaiting Response',
          },
        });
      }
    }
  }

  const shouldCreateFollowUpReminder = !existingSubmission || previousResponseExpected !== input.responseExpected;
  const responseDate = new Date(`${input.responseExpected}T09:00:00+02:00`);
  if (shouldCreateFollowUpReminder && !Number.isNaN(responseDate.getTime())) {
    await createMarketingCalendarEntry({
      entryType: 'Reminder',
      title: `Tender Follow-up · ${opportunity.title}`,
      description: [
        `Track tender submission response for ${opportunity.client}.`,
        `Quote: ${quote.businessDocumentKey ?? quote.id}.`,
        `Channel: ${input.channel}.`,
        attachments.length ? `Attachments linked: ${attachments.length}.` : null,
      ].filter(Boolean).join(' '),
      scheduledFor: responseDate.toISOString(),
    });
  }

  writeTenderStore(store);
  return buildSnapshot();
}
