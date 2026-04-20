import type {
  CreateTenderOpportunityInput,
  CreateTenderMemberResponseInput,
  PromoteTenderDocumentToBoqInput,
  CreateTenderQuoteDraftInput,
  CreateTenderSubmissionInput,
  ImportTenderSourcePackResult,
  ParsedTenderUpload,
  SyncEtendersInput,
  TenderDeskSnapshot,
  TenderLineMatchStatus,
  TenderMemberAccessSummary,
  TenderMemberOpportunitySummary,
  TenderMemberPortalFilters,
  TenderMemberPortalSnapshot,
  TenderMemberResponseSummary,
  TenderMemberRole,
  TenderOpportunitySummary,
  TenderSyncResult,
  UpdateTenderBoqLineInput,
  UploadTenderBoqInput,
} from './contracts';

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const headers = new Headers(init?.headers ?? undefined);

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    headers,
    ...init,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiRequestError(payload?.error ?? `Request failed with status ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

export function fetchTenderDeskSnapshot() {
  return request<TenderDeskSnapshot>('/api/tenders');
}

const memberRoles: TenderMemberRole[] = ['Architect', 'Interior Designer', 'Quantity Surveyor', 'Contractor'];

function normalize(value?: string | null) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function deriveMaterialTags(opportunity: TenderOpportunitySummary, desk: TenderDeskSnapshot) {
  const relatedBoqs = desk.boqs.filter((boq) => boq.tenderId === opportunity.id);
  const text = [
    opportunity.title,
    opportunity.description ?? '',
    opportunity.procurementCategory ?? '',
    opportunity.projectMetadata?.scopeSummary ?? '',
    ...(opportunity.projectMetadata?.detectedMaterials ?? []),
    ...desk.documents
      .filter((document) => document.opportunityId === opportunity.id)
      .flatMap((document) => [document.fileName, document.kind, document.analysisSummary ?? '', ...(document.extractedMetadata?.detectedMaterials ?? [])]),
    ...relatedBoqs.flatMap((boq) => boq.lines.map((line) => line.description)),
  ].join(' ');
  const candidates: Array<[string, RegExp]> = [
    ['Cladding', /cladd|facade|façade|tile/i],
    ['Brickwork', /brick|masonry|wall/i],
    ['Paving', /pav|driveway|walkway|road/i],
    ['Blocks', /block|screen|breeze/i],
    ['Capping', /capping|coping|lintel/i],
    ['Drawing Review', /drawing|plan|architect|dwg|cad/i],
    ['BOQ Review', /\bboq\b|bill of quantities|rfq|quotation/i],
  ];
  return Array.from(new Set([
    ...(opportunity.projectMetadata?.detectedMaterials ?? []),
    ...candidates.filter(([, pattern]) => pattern.test(text)).map(([label]) => label),
  ])).slice(0, 8);
}

function deriveGapLines(opportunity: TenderOpportunitySummary, desk: TenderDeskSnapshot): TenderMemberAccessSummary['gapLines'] {
  const relatedBoqs = desk.boqs.filter((boq) => boq.tenderId === opportunity.id);
  const gapLines = relatedBoqs.flatMap((boq) => boq.lines
    .filter((line) => line.matchStatus !== 'Mapped' || !line.suggestedProductId)
    .map((line) => ({
      id: line.id,
      reference: line.reference,
      description: line.description,
      quantityLabel: line.quantityLabel,
      status: line.matchStatus as TenderLineMatchStatus,
    })));

  if (gapLines.length) {
    return gapLines.slice(0, 8);
  }

  if (opportunity.boqStatus === 'Missing') {
    return [{
      id: `${opportunity.id}-scope-review`,
      reference: opportunity.sourceReference ?? opportunity.id,
      description: opportunity.projectMetadata?.scopeSummary ?? opportunity.description ?? 'Source pack requires member review before products can be matched.',
      quantityLabel: 'Scope review',
      status: 'Scope Review',
    }];
  }

  return [];
}

function deriveRequiredRoles(opportunity: TenderOpportunitySummary, materialTags: string[], gapLines: TenderMemberAccessSummary['gapLines']) {
  const text = normalize([
    opportunity.title,
    opportunity.description ?? '',
    opportunity.procurementCategory ?? '',
    opportunity.type,
    opportunity.projectMetadata?.scopeSummary ?? '',
    materialTags.join(' '),
    gapLines.map((line) => line.description).join(' '),
  ].join(' '));
  const roles = new Set<TenderMemberRole>();

  if (/architect|drawing|plan|facade|refurbishment|building/.test(text)) roles.add('Architect');
  if (/interior|hospitality|fit out|fitout|feature wall|finish/.test(text)) roles.add('Interior Designer');
  if (/boq|quantity|rfq|rate|quote|pricing|bill/.test(text) || gapLines.length > 0) roles.add('Quantity Surveyor');
  if (/construction|contractor|masonry|civil|maintenance|installation|completion/.test(text)) roles.add('Contractor');
  if (gapLines.length > 0 || /supply|material|tile|brick|paving|cladding|block|capping/.test(text)) {
    roles.add('Quantity Surveyor');
    roles.add('Contractor');
  }

  return roles.size ? Array.from(roles) : ['Architect', 'Quantity Surveyor'] satisfies TenderMemberRole[];
}

function deriveMemberAccess(opportunity: TenderOpportunitySummary, desk: TenderDeskSnapshot): TenderMemberAccessSummary {
  const existingAccess = (opportunity as TenderOpportunitySummary & { memberAccess?: TenderMemberAccessSummary }).memberAccess;
  if (existingAccess) {
    return existingAccess;
  }

  const gapLines = deriveGapLines(opportunity, desk);
  const materialTags = deriveMaterialTags(opportunity, desk);
  const documents = desk.documents
    .filter((document) => document.opportunityId === opportunity.id)
    .filter((document) => document.kind === 'BOQ' || document.kind === 'RFQ' || document.kind === 'Tender Document' || document.kind === 'Architectural Drawing')
    .map((document) => ({
      id: document.id,
      kind: document.kind,
      fileName: document.fileName,
      url: document.importedAssetUrl ?? document.sourceUrl ?? document.url,
      importStatus: document.importStatus,
    }))
    .slice(0, 6);

  return {
    isOpen: opportunity.stage !== 'Awarded' && opportunity.stage !== 'Lost' && Date.parse(opportunity.closeDate) >= Date.now() - 24 * 60 * 60 * 1000,
    accessLabel: gapLines.length > 0 ? 'Partner quote needed' : 'Open for member review',
    requiredRoles: deriveRequiredRoles(opportunity, materialTags, gapLines),
    materialTags,
    gapLines,
    documents,
    responseCount: 0,
  };
}

function opportunityMatchesMemberFilters(opportunity: TenderMemberOpportunitySummary, filters: TenderMemberPortalFilters) {
  if (filters.role && filters.role !== 'All' && !opportunity.memberAccess.requiredRoles.includes(filters.role)) {
    return false;
  }
  if (filters.material?.trim() && !opportunity.memberAccess.materialTags.some((tag) => normalize(tag).includes(normalize(filters.material)))) {
    return false;
  }
  if (filters.location?.trim() && !normalize(opportunity.location).includes(normalize(filters.location))) {
    return false;
  }
  if (!filters.query?.trim()) {
    return true;
  }

  const query = normalize(filters.query);
  const searchable = normalize([
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

function deriveMemberPortalSnapshotFromDesk(desk: TenderDeskSnapshot, filters: TenderMemberPortalFilters = {}): TenderMemberPortalSnapshot {
  const responses = ((desk as TenderDeskSnapshot & { memberResponses?: TenderMemberResponseSummary[] }).memberResponses ?? [])
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const allOpportunities = desk.opportunities
    .map((opportunity) => ({
      id: opportunity.id,
      source: opportunity.source,
      type: opportunity.type,
      client: opportunity.client,
      title: opportunity.title,
      description: opportunity.description ?? null,
      location: opportunity.location,
      closeDate: opportunity.closeDate,
      valueZar: opportunity.valueZar,
      stage: opportunity.stage,
      sourceReference: opportunity.sourceReference ?? null,
      sourceUrl: opportunity.sourceUrl ?? null,
      projectMetadata: opportunity.projectMetadata ?? null,
      memberAccess: deriveMemberAccess(opportunity, desk),
    }))
    .filter((opportunity) => opportunity.memberAccess.isOpen)
    .sort((left, right) => left.closeDate.localeCompare(right.closeDate));
  const materialSet = new Set<string>();
  const locationSet = new Set<string>();

  for (const opportunity of allOpportunities) {
    opportunity.memberAccess.materialTags.forEach((tag) => materialSet.add(tag));
    if (opportunity.location.trim()) locationSet.add(opportunity.location.trim());
  }

  return {
    opportunities: allOpportunities.filter((opportunity) => opportunityMatchesMemberFilters(opportunity, filters)),
    responses,
    filters: {
      roles: memberRoles,
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

function toTenderMemberQuery(filters: TenderMemberPortalFilters = {}) {
  const params = new URLSearchParams();
  if (filters.role && filters.role !== 'All') params.set('role', filters.role);
  if (filters.material?.trim()) params.set('material', filters.material.trim());
  if (filters.location?.trim()) params.set('location', filters.location.trim());
  if (filters.query?.trim()) params.set('query', filters.query.trim());
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchTenderMemberPortalSnapshot(filters: TenderMemberPortalFilters = {}) {
  try {
    return await request<TenderMemberPortalSnapshot>(`/api/tenders/member-opportunities${toTenderMemberQuery(filters)}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      const desk = await fetchTenderDeskSnapshot();
      return deriveMemberPortalSnapshotFromDesk(desk, filters);
    }
    throw error;
  }
}

export function createTenderMemberResponse(tenderId: string, input: CreateTenderMemberResponseInput) {
  return request<TenderMemberPortalSnapshot>(`/api/tenders/member-opportunities/${tenderId}/responses`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createTenderOpportunity(input: CreateTenderOpportunityInput) {
  return request<TenderOpportunitySummary>('/api/tenders/opportunities', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function uploadTenderDocument(file: File, aiDirection?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (aiDirection?.trim()) {
    formData.append('aiDirection', aiDirection.trim());
  }

  return request<ParsedTenderUpload>('/api/tenders/uploads', {
    method: 'POST',
    body: formData,
  });
}

export function uploadTenderBoq(opportunityId: string, file: File, input: UploadTenderBoqInput) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('parseMode', input.parseMode);
  if (input.aiDirection?.trim()) {
    formData.append('aiDirection', input.aiDirection.trim());
  }

  return request<TenderDeskSnapshot>(`/api/tenders/opportunities/${opportunityId}/boqs/upload`, {
    method: 'POST',
    body: formData,
  });
}

export function updateTenderBoqLine(boqId: string, lineId: string, input: UpdateTenderBoqLineInput) {
  return request<TenderDeskSnapshot>(`/api/tenders/boqs/${boqId}/lines/${lineId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function promoteTenderDocumentToBoq(opportunityId: string, input: PromoteTenderDocumentToBoqInput) {
  return request<TenderDeskSnapshot>(`/api/tenders/opportunities/${opportunityId}/boqs/promote-source-document`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createTenderQuoteDraft(input: CreateTenderQuoteDraftInput) {
  return request<TenderDeskSnapshot>('/api/tenders/quotes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createTenderSubmission(input: CreateTenderSubmissionInput) {
  return request<TenderDeskSnapshot>('/api/tenders/submissions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function syncEtenders(input: SyncEtendersInput = {}) {
  return request<TenderSyncResult>('/api/tenders/sync/etenders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function importTenderSourcePack(tenderId: string) {
  return request<ImportTenderSourcePackResult>(`/api/tenders/${tenderId}/import-source-pack`, {
    method: 'POST',
  });
}
