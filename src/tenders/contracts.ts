export type TenderSource = 'Direct' | 'Leads2Business' | 'GovProcure' | 'Municipal Feed';
export type TenderProjectType = 'Commercial' | 'Residential' | 'Public / Infrastructure';
export type TenderStage = 'Intake' | 'BOQ Review' | 'Quoting' | 'Submission Ready' | 'Submitted' | 'Awarded' | 'Lost';
export type TenderBoqStatus = 'Missing' | 'Parsed' | 'Pending Review' | 'Mapped';
export type TenderBoqParseMode = 'AI Assisted' | 'Manual Mapping';
export type TenderLineMatchStatus = 'Mapped' | 'Ambiguous' | 'Unmapped';
export type TenderQuoteStatus = 'Draft' | 'Ready for Review' | 'Submitted';
export type TenderSubmissionStatus = 'Submitted' | 'Clarification Requested' | 'Awarded' | 'Lost';
export type TenderDocumentKind = 'BOQ' | 'RFQ' | 'Tender Document' | 'Architectural Drawing' | 'Supporting Document';
export type TenderMemberRole = 'Architect' | 'Interior Designer' | 'Quantity Surveyor' | 'Contractor';
export type TenderMemberResponseStatus = 'Interest Logged' | 'Quote Pack Requested' | 'Submitted';

export interface TenderProjectMetadata {
  projectName?: string | null;
  tenderNumber?: string | null;
  siteAddress?: string | null;
  deliveryAddress?: string | null;
  briefingDate?: string | null;
  briefingLocation?: string | null;
  scopeSummary?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  drawingReferences: string[];
  detectedMaterials: string[];
}

export interface TenderOpportunitySummary {
  id: string;
  source: TenderSource;
  type: TenderProjectType;
  client: string;
  title: string;
  description?: string | null;
  location: string;
  closeDate: string;
  tenderStartDate?: string | null;
  boqStatus: TenderBoqStatus;
  owner: string;
  stage: TenderStage;
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
  memberAccess: TenderMemberAccessSummary;
  documentsCount: number;
  lastUpdatedAt: string;
}

export interface TenderDocumentSummary {
  id: string;
  opportunityId: string;
  kind: TenderDocumentKind;
  fileName: string;
  mimeType: string;
  url: string;
  sourceUrl?: string | null;
  importedAssetUrl?: string | null;
  importedAt?: string | null;
  importStatus?: 'Source Linked' | 'Imported';
  uploadedAt: string;
  analysisSummary?: string | null;
  analysisStatus: 'Queued' | 'Parsed' | 'Review Needed';
  providerLabel?: string | null;
  extractedMetadata?: TenderProjectMetadata | null;
}

export interface TenderMemberAccessDocument {
  id: string;
  kind: TenderDocumentKind;
  fileName: string;
  url: string;
  importStatus?: 'Source Linked' | 'Imported';
}

export interface TenderMemberAccessGapLine {
  id: string;
  reference: string;
  description: string;
  quantityLabel: string;
  status: TenderLineMatchStatus | 'Scope Review';
}

export interface TenderMemberAccessSummary {
  isOpen: boolean;
  accessLabel: string;
  requiredRoles: TenderMemberRole[];
  materialTags: string[];
  gapLines: TenderMemberAccessGapLine[];
  documents: TenderMemberAccessDocument[];
  responseCount: number;
}

export interface TenderMemberResponseSummary {
  id: string;
  tenderId: string;
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

export interface TenderBoqLine {
  id: string;
  reference: string;
  description: string;
  quantityLabel: string;
  quantity: number;
  unit?: string | null;
  matchStatus: TenderLineMatchStatus;
  suggestedProductId?: string | null;
  suggestedProductName?: string | null;
  confidenceScore?: number | null;
}

export interface TenderBoqSummary {
  id: string;
  tenderId: string;
  tenderTitle: string;
  sourceDocumentId?: string | null;
  sourceDocumentKind?: TenderDocumentKind | null;
  status: 'Mapped' | 'Review Needed';
  totalLines: number;
  mappedLines: number;
  unmappedLines: number;
  ambiguousLines: number;
  uploadedAt: string;
  fileName: string;
  parseMode: TenderBoqParseMode;
  reviewNote?: string | null;
  lines: TenderBoqLine[];
}

export interface TenderQuoteLineSummary {
  boqLineId: string;
  boqDescription: string;
  productId: string;
  productName: string;
  quantity: number;
  quantityLabel: string;
  unitRateZar: number;
  lineTotalZar: number;
}

export interface TenderQuoteSummary {
  id: string;
  tenderId: string;
  tenderTitle: string;
  status: TenderQuoteStatus;
  boqId?: string | null;
  valueZar: number;
  costZar: number;
  marginPct: number;
  discountPct?: number | null;
  markupPct?: number | null;
  lastUpdated: string;
  exclusions: string[];
  notes?: string | null;
  mappedItems: TenderQuoteLineSummary[];
  businessDocumentKey?: string | null;
  pdfUrl?: string | null;
}

export interface TenderSubmissionSummary {
  id: string;
  tenderId: string;
  tenderTitle: string;
  status: TenderSubmissionStatus;
  submittedAt: string;
  responseExpected: string;
  channel: 'Direct Email' | 'Portal Upload';
  quoteId: string;
  quoteValueZar?: number | null;
  quoteBusinessDocumentKey?: string | null;
  attachments: UploadedTenderFile[];
}

export interface TenderDeskSnapshot {
  opportunities: TenderOpportunitySummary[];
  documents: TenderDocumentSummary[];
  boqs: TenderBoqSummary[];
  quotes: TenderQuoteSummary[];
  submissions: TenderSubmissionSummary[];
  memberResponses: TenderMemberResponseSummary[];
  metrics: {
    activeTenders: number;
    boqsToReview: number;
    draftQuotes: number;
    submissionsDueSoon: number;
  };
}

export interface TenderMemberOpportunitySummary {
  id: string;
  source: TenderSource;
  type: TenderProjectType;
  client: string;
  title: string;
  description?: string | null;
  location: string;
  closeDate: string;
  valueZar: number | null;
  stage: TenderStage;
  sourceReference?: string | null;
  sourceUrl?: string | null;
  projectMetadata?: TenderProjectMetadata | null;
  memberAccess: TenderMemberAccessSummary;
}

export interface TenderMemberPortalSnapshot {
  opportunities: TenderMemberOpportunitySummary[];
  responses: TenderMemberResponseSummary[];
  filters: {
    roles: TenderMemberRole[];
    materials: string[];
    locations: string[];
  };
  metrics: {
    openTenders: number;
    gapLines: number;
    quotePackRequests: number;
  };
}

export interface TenderMemberPortalFilters {
  role?: TenderMemberRole | 'All';
  material?: string;
  location?: string;
  query?: string;
}

export interface CreateTenderOpportunityInput {
  source: TenderSource;
  type: TenderProjectType;
  title: string;
  client: string;
  location: string;
  closeDate: string;
  owner: string;
  valueZar?: number | null;
  email?: string;
  phone?: string;
  documents?: Array<{
    kind: TenderDocumentKind;
    fileName: string;
    mimeType: string;
    url: string;
    analysisSummary?: string | null;
    analysisStatus?: 'Queued' | 'Parsed' | 'Review Needed';
    providerLabel?: string | null;
    extractedMetadata?: TenderProjectMetadata | null;
  }>;
}

export interface UploadedTenderFile {
  fileName: string;
  mimeType: string;
  url: string;
  storagePath: string;
  size: number;
  sha256: string;
}

export interface ParsedTenderUpload {
  upload: UploadedTenderFile;
  analysisSummary?: string | null;
  analysisStatus: 'Queued' | 'Parsed' | 'Review Needed';
  providerLabel?: string | null;
  extractedMetadata?: TenderProjectMetadata | null;
}

export interface UploadTenderBoqInput {
  parseMode: TenderBoqParseMode;
  aiDirection?: string;
}

export interface UpdateTenderBoqLineInput {
  productId: string;
}

export interface PromoteTenderDocumentToBoqInput {
  documentId: string;
  parseMode: TenderBoqParseMode;
  aiDirection?: string;
}

export interface CreateTenderQuoteDraftInput {
  tenderId: string;
  boqId: string;
  discountPct?: number;
  markupPct?: number;
  exclusions: string[];
  notes?: string;
}

export interface CreateTenderSubmissionInput {
  tenderId: string;
  quoteId: string;
  channel: 'Direct Email' | 'Portal Upload';
  responseExpected: string;
  attachments?: UploadedTenderFile[];
}

export interface CreateTenderMemberResponseInput {
  memberName: string;
  memberRole: TenderMemberRole;
  companyName?: string;
  email: string;
  phone?: string;
  scopeNote?: string;
  status?: TenderMemberResponseStatus;
}

export interface SyncEtendersInput {
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
  maxPages?: number;
  keywords?: string[];
}

export interface TenderSyncResult {
  imported: number;
  updated: number;
  skipped: number;
  source: 'GovProcure';
  snapshot: TenderDeskSnapshot;
}

export interface ImportTenderSourcePackResult {
  imported: number;
  skipped: number;
  failed: number;
  autoPromotedBoqs: number;
  snapshot: TenderDeskSnapshot;
}
