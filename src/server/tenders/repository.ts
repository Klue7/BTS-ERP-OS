import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TenderBoqLine, TenderMemberResponseStatus, TenderMemberRole, TenderProjectMetadata } from '../../tenders/contracts.ts';
export type { TenderBoqLine } from '../../tenders/contracts.ts';

export interface TenderOpportunityRecord {
  id: string;
  source: 'Direct' | 'Leads2Business' | 'GovProcure' | 'Municipal Feed';
  type: 'Commercial' | 'Residential' | 'Public / Infrastructure';
  client: string;
  title: string;
  description?: string | null;
  location: string;
  closeDate: string;
  tenderStartDate?: string | null;
  boqStatus: 'Missing' | 'Parsed' | 'Pending Review' | 'Mapped';
  owner: string;
  stage: 'Intake' | 'BOQ Review' | 'Quoting' | 'Submission Ready' | 'Submitted' | 'Awarded' | 'Lost';
  valueZar: number | null;
  procurementCategory?: string | null;
  sourceStatus?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  sourceReference?: string | null;
  sourceUrl?: string | null;
  linkedCustomerId?: string | null;
  linkedCustomerName?: string | null;
  projectMetadata?: TenderProjectMetadata | null;
  createdAt: string;
  updatedAt: string;
  documents: TenderDocumentRecord[];
}

export interface TenderDocumentRecord {
  id: string;
  opportunityId: string;
  kind: 'BOQ' | 'RFQ' | 'Tender Document' | 'Architectural Drawing' | 'Supporting Document';
  fileName: string;
  mimeType: string;
  url: string;
  sourceUrl?: string | null;
  importedAssetUrl?: string | null;
  importedAt?: string | null;
  uploadedAt: string;
  analysisSummary?: string | null;
  analysisStatus: 'Queued' | 'Parsed' | 'Review Needed';
  providerLabel?: string | null;
  extractedMetadata?: TenderProjectMetadata | null;
}

export interface TenderBoqRecord {
  id: string;
  opportunityId: string;
  tenderTitle: string;
  sourceDocumentId?: string | null;
  sourceDocumentKind?: TenderDocumentRecord['kind'] | null;
  status: 'Mapped' | 'Review Needed';
  uploadedAt: string;
  fileName: string;
  parseMode: 'AI Assisted' | 'Manual Mapping';
  reviewNote?: string | null;
  lines: TenderBoqLine[];
}

export interface TenderQuoteRecord {
  id: string;
  opportunityId: string;
  tenderTitle: string;
  status: 'Draft' | 'Ready for Review' | 'Submitted';
  boqId?: string | null;
  valueZar: number;
  costZar: number;
  marginPct: number;
  discountPct?: number | null;
  markupPct?: number | null;
  lastUpdated: string;
  exclusions: string[];
  notes?: string | null;
  mappedItems: Array<{
    boqLineId: string;
    boqDescription: string;
    productId: string;
    productName: string;
    quantity: number;
    quantityLabel: string;
    unitRateZar: number;
    lineTotalZar: number;
  }>;
  businessDocumentKey?: string | null;
  pdfUrl?: string | null;
}

export interface TenderSubmissionRecord {
  id: string;
  opportunityId: string;
  tenderTitle: string;
  status: 'Submitted' | 'Clarification Requested' | 'Awarded' | 'Lost';
  submittedAt: string;
  responseExpected: string;
  channel: 'Direct Email' | 'Portal Upload';
  quoteId: string;
  quoteValueZar?: number | null;
  quoteBusinessDocumentKey?: string | null;
  attachments: Array<{
    fileName: string;
    mimeType: string;
    url: string;
    storagePath: string;
    size: number;
    sha256: string;
  }>;
}

export interface TenderMemberResponseRecord {
  id: string;
  opportunityId: string;
  tenderTitle: string;
  memberName: string;
  memberRole: TenderMemberRole;
  companyName?: string | null;
  email: string;
  phone?: string | null;
  scopeNote?: string | null;
  status: TenderMemberResponseStatus;
  createdAt: string;
}

export interface TenderStore {
  opportunities: TenderOpportunityRecord[];
  boqs: TenderBoqRecord[];
  quotes: TenderQuoteRecord[];
  submissions: TenderSubmissionRecord[];
  memberResponses: TenderMemberResponseRecord[];
}

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(serverDirectory, '../..');
const tenderStorageDirectory = path.join(repoRoot, 'storage', 'tenders');
const tenderStorePath = path.join(tenderStorageDirectory, 'store.json');

function ensureTenderStorageDirectory() {
  fs.mkdirSync(tenderStorageDirectory, { recursive: true });
}

function seedStore(): TenderStore {
  const now = new Date().toISOString();
  return {
    opportunities: [
      {
        id: 'TND-001',
        source: 'Leads2Business',
        type: 'Commercial',
        client: 'Apex Developments SA',
        title: 'Sandton Office Park Phase 2',
        description: 'Commercial fit-out and facade package for phase two office expansion.',
        location: 'Sandton, Gauteng',
        closeDate: '2026-04-30',
        tenderStartDate: '2026-04-04',
        boqStatus: 'Parsed',
        owner: 'Sarah J.',
        stage: 'Quoting',
        valueZar: 2485000,
        procurementCategory: 'Construction Works',
        sourceStatus: 'active',
        contactName: 'Commercial Desk',
        contactEmail: null,
        contactPhone: null,
        sourceReference: null,
        sourceUrl: null,
        linkedCustomerId: 'CUST_TENDER_APEX',
        linkedCustomerName: 'Apex Developments SA',
        createdAt: now,
        updatedAt: now,
        documents: [],
      },
      {
        id: 'TND-002',
        source: 'Direct',
        type: 'Residential',
        client: 'Oakridge Homes',
        title: 'Greenfields Estate 50 Units',
        description: 'RFQ for brick, paving, and capping products across phased residential delivery.',
        location: 'Centurion, Gauteng',
        closeDate: '2026-04-24',
        tenderStartDate: '2026-04-01',
        boqStatus: 'Pending Review',
        owner: 'Mike R.',
        stage: 'BOQ Review',
        valueZar: 1850000,
        procurementCategory: 'Residential Development',
        sourceStatus: 'active',
        contactName: 'Mike R.',
        contactEmail: null,
        contactPhone: null,
        sourceReference: null,
        sourceUrl: null,
        linkedCustomerId: 'CUST_TENDER_OAKRIDGE',
        linkedCustomerName: 'Oakridge Homes',
        createdAt: now,
        updatedAt: now,
        documents: [],
      },
      {
        id: 'TND-003',
        source: 'GovProcure',
        type: 'Public / Infrastructure',
        client: 'City of Tshwane',
        title: 'Community Centre Refurbishment',
        description: 'Community centre refurbishment and materials package.',
        location: 'Pretoria, Gauteng',
        closeDate: '2026-05-18',
        tenderStartDate: '2026-04-10',
        boqStatus: 'Missing',
        owner: 'Unassigned',
        stage: 'Intake',
        valueZar: null,
        procurementCategory: 'Infrastructure',
        sourceStatus: 'active',
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        sourceReference: 'ocds-9t57fa-demo-001',
        sourceUrl: 'https://www.etenders.gov.za/',
        linkedCustomerId: 'CUST_TENDER_TSHWANE',
        linkedCustomerName: 'City of Tshwane',
        createdAt: now,
        updatedAt: now,
        documents: [],
      },
    ],
    boqs: [
      {
        id: 'BOQ-001',
        opportunityId: 'TND-001',
        tenderTitle: 'Sandton Office Park Phase 2',
        status: 'Mapped',
        uploadedAt: now,
        fileName: 'sandton-office-park-boq.xlsx',
        parseMode: 'AI Assisted',
        reviewNote: 'Most masonry items mapped deterministically. Five lines need estimator review.',
        lines: [
          {
            id: 'BOQ-001-L1',
            reference: '2.1',
            description: 'Face brick, red rustic, 222 x 106 x 73mm',
            quantityLabel: '12,500 pcs',
            quantity: 12500,
            unit: 'pcs',
            matchStatus: 'Mapped',
            suggestedProductId: 'PRD_882',
            suggestedProductName: 'Slate Grey Tile',
            confidenceScore: 0.62,
          },
          {
            id: 'BOQ-001-L2',
            reference: '2.2',
            description: 'Exterior cladding tile, charcoal matte',
            quantityLabel: '420 m2',
            quantity: 420,
            unit: 'm2',
            matchStatus: 'Mapped',
            suggestedProductId: 'PRD_883',
            suggestedProductName: 'Carbon Cladding Panel',
            confidenceScore: 0.91,
          },
          {
            id: 'BOQ-001-L3',
            reference: '2.3',
            description: 'Feature glazed tile, cobalt accent',
            quantityLabel: '50 m2',
            quantity: 50,
            unit: 'm2',
            matchStatus: 'Ambiguous',
            suggestedProductId: null,
            suggestedProductName: null,
            confidenceScore: 0.18,
          },
        ],
      },
      {
        id: 'BOQ-002',
        opportunityId: 'TND-002',
        tenderTitle: 'Greenfields Estate 50 Units',
        status: 'Review Needed',
        uploadedAt: now,
        fileName: 'greenfields-estate-rfq.pdf',
        parseMode: 'Manual Mapping',
        reviewNote: 'RFQ document uploaded. AI summary captured, but quantity mapping still requires operator review.',
        lines: [
          {
            id: 'BOQ-002-L1',
            reference: 'A1',
            description: 'Stock brick, heritage blend',
            quantityLabel: '8,000 pcs',
            quantity: 8000,
            unit: 'pcs',
            matchStatus: 'Mapped',
            suggestedProductId: 'PRD_882',
            suggestedProductName: 'Slate Grey Tile',
            confidenceScore: 0.31,
          },
          {
            id: 'BOQ-002-L2',
            reference: 'A2',
            description: 'Wall capping tile - unspecified finish',
            quantityLabel: '120 lm',
            quantity: 120,
            unit: 'lm',
            matchStatus: 'Ambiguous',
            suggestedProductId: null,
            suggestedProductName: null,
            confidenceScore: 0.12,
          },
        ],
      },
    ],
    quotes: [
      {
        id: 'QT-9001',
        opportunityId: 'TND-001',
        tenderTitle: 'Sandton Office Park Phase 2',
        status: 'Draft',
        boqId: 'BOQ-001',
        valueZar: 2684000,
        costZar: 1839000,
        marginPct: 31.48,
        discountPct: 0,
        markupPct: 25,
        lastUpdated: now,
        exclusions: ['Delivery to site included (standard access)', 'Offloading by others', 'Valid for 30 days'],
        notes: 'Initial commercial tender draft generated from mapped BOQ lines.',
        mappedItems: [],
        businessDocumentKey: null,
        pdfUrl: null,
      },
    ],
    submissions: [
      {
        id: 'SUB-001',
        opportunityId: 'TND-001',
        tenderTitle: 'Sandton Office Park Phase 2',
        status: 'Submitted',
        submittedAt: '2026-03-20',
        responseExpected: '2026-04-30',
        channel: 'Direct Email',
        quoteId: 'QT-9001',
        quoteValueZar: 2684000,
        quoteBusinessDocumentKey: null,
        attachments: [],
      },
    ],
    memberResponses: [],
  };
}

export function readTenderStore() {
  ensureTenderStorageDirectory();
  if (!fs.existsSync(tenderStorePath)) {
    const seeded = seedStore();
    fs.writeFileSync(tenderStorePath, JSON.stringify(seeded, null, 2));
    return seeded;
  }

  const raw = fs.readFileSync(tenderStorePath, 'utf8');
  const parsed = JSON.parse(raw) as Partial<TenderStore>;
  return {
    opportunities: parsed.opportunities ?? [],
    boqs: parsed.boqs ?? [],
    quotes: parsed.quotes ?? [],
    submissions: parsed.submissions ?? [],
    memberResponses: parsed.memberResponses ?? [],
  };
}

export function writeTenderStore(store: TenderStore) {
  ensureTenderStorageDirectory();
  fs.writeFileSync(tenderStorePath, JSON.stringify(store, null, 2));
}
