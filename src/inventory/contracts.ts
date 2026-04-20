export const inventoryCategoryOptions = ['Cladding', 'Bricks', 'Paving', 'Blocks'] as const;
export type InventoryCategory = (typeof inventoryCategoryOptions)[number];

export const inventoryProductTypeOptionsByCategory = {
  Cladding: ['Classic', 'Modern', 'Natural', 'Premium'],
  Bricks: ['NFP', 'NFX', 'FBA', 'FBS', 'FBX', 'Maxi'],
  Paving: ['Bevel', 'Split-Bevel', 'Interlocking'],
  Blocks: ['Cement', 'Breeze', 'Clay'],
} as const satisfies Record<InventoryCategory, readonly string[]>;

export type InventoryProductType =
  | (typeof inventoryProductTypeOptionsByCategory.Cladding)[number]
  | (typeof inventoryProductTypeOptionsByCategory.Bricks)[number]
  | (typeof inventoryProductTypeOptionsByCategory.Paving)[number]
  | (typeof inventoryProductTypeOptionsByCategory.Blocks)[number];

export const inventoryFinishOptions = ['Travertine', 'Ribbed', 'Smooth', 'Satin', 'Rustic', 'Variation'] as const;
export type InventoryFinish = (typeof inventoryFinishOptions)[number];

export const pricingUnitOptions = ['m2', 'piece', 'pallet'] as const;
export type InventoryPricingUnit = (typeof pricingUnitOptions)[number];

export const coverageOrientationOptions = ['Length x Width', 'Length x Height', 'Width x Height'] as const;
export type CoverageOrientation = (typeof coverageOrientationOptions)[number];

export const inventoryProductTestResultTypeOptions = [
  'Compressive Strength (MPa)',
  'Water Absorption (%)',
  'Tested Length (mm)',
  'Tested Width (mm)',
  'Tested Height (mm)',
  'Dry Mass (kg)',
  'Wet Mass (kg)',
  'Breaking Load (kN)',
] as const;
export type InventoryProductTestResultType = (typeof inventoryProductTestResultTypeOptions)[number];
export type InventoryProductTestResultStatus = 'Draft' | 'Approved' | 'Superseded' | 'Archived';

export const inventoryAssetSourceOptions = [
  'Direct Upload',
  'Asset Library',
  'Marketing Tool',
  'Community Submission',
  'Studio Published',
] as const;
export type InventoryAssetSource = (typeof inventoryAssetSourceOptions)[number];

export type InventoryLifecycleStatus = 'Active' | 'Draft' | 'Archived' | 'Out of Stock';
export type InventoryPublishStatus = 'Not Ready' | 'Ready' | 'Published';
export const productDistributionChannelOptions = [
  'Internal Storefront',
  'Meta Catalog',
  'WhatsApp Catalog',
  'Google Merchant Center',
  'TikTok Shop',
] as const;
export type ProductDistributionChannel = (typeof productDistributionChannelOptions)[number];
export type ProductDistributionChannelType = 'Storefront' | 'Catalog' | 'Marketplace' | 'Messaging';
export type ProductDistributionConnectionStatus = 'Not Connected' | 'Connected' | 'Degraded' | 'Error';
export type ProductDistributionPublicationStatus = 'Not Posted' | 'Queued' | 'Syncing' | 'Live' | 'Paused' | 'Failed' | 'Archived';
export type ProductDistributionSyncMode = 'Manual' | 'API';
export type InventoryAssetStatus = 'Draft' | 'Review' | 'Approved' | 'Archived' | 'Restricted';
export type InventoryAssetType = 'Image' | 'Video' | '2.5D Asset' | '3D Asset' | '3D Render' | 'Model';
export type InventoryAssetProtectionLevel = 'Protected Original' | 'Managed Variant' | 'Publishable Variant';
export type InventoryAvailabilityStatus = 'Ready to Procure' | 'Supplier Delayed' | 'Supplier Onboarding' | 'Missing Supplier';
export type InventoryProcurementTrigger = 'Quote Paid';
export type InventoryAssetRole =
  | 'primary_image'
  | 'gallery_image'
  | 'face_image'
  | 'hero_image'
  | 'asset_2_5d'
  | 'asset_3d'
  | 'project_image'
  | 'generated_image'
  | 'gallery_extra'
  | 'installation'
  | 'detail'
  | 'campaign';

export interface ReadinessChecklist {
  primaryImage: boolean;
  galleryImage: boolean;
  faceImage: boolean;
  heroImage: boolean;
  calculatorData: boolean;
  supplierLinkage: boolean;
  pricing: boolean;
  asset2_5d: boolean;
  asset3d: boolean;
}

export interface ReadinessSnapshot {
  catalogHealth: number;
  assetReadiness: number;
  threedReadiness: number;
  marketingReadiness: number;
  publishReadiness: number;
  blockers: string[];
  checklist: ReadinessChecklist;
}

export interface SupplierLocationSummary {
  id: string;
  label: string;
  type: 'Supplier Origin' | 'Warehouse' | 'Customer Destination';
  streetAddress?: string | null;
  postalCode?: string | null;
  country: string;
  region: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  mapsUrl?: string | null;
}

export type SupplierVendorRole = 'Product Supplier' | 'Transport Partner';
export type VendorPreferredChannel = 'Email' | 'Phone' | 'WhatsApp' | 'Portal';
export type VendorDocumentType =
  | 'Agreement'
  | 'Test Result'
  | 'Plan'
  | 'Certification'
  | 'Purchase Order'
  | 'Delivery Note'
  | 'Invoice'
  | 'Other';

export interface SupplierContactSummary {
  id: string;
  department: string;
  roleTitle?: string;
  name: string;
  email: string;
  phone?: string;
  preferredChannel?: VendorPreferredChannel;
  notes?: string;
  isPrimary: boolean;
}

export interface SupplierDocumentSummary {
  id: string;
  name: string;
  type: VendorDocumentType;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  uploadedBy?: string | null;
  uploadedAt: string;
  downloadUrl: string;
}

export interface SupplierCommercialAccountSummary {
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  minimumOrderValueZar?: number | null;
  standardDiscountPct?: number | null;
  moq?: string | null;
  currency: string;
  incoterms?: string | null;
  creditLimitZar?: number | null;
  currentCreditBalanceZar: number;
  vatRegistered: boolean;
  vatNumber?: string | null;
  standardVatRatePct: number;
}

export interface SupplierPortalUserSummary {
  id: string;
  email: string;
  fullName: string;
  roleLabel: string;
  isActive: boolean;
  lastLoginAt?: string | null;
}

export interface SupplierSummary {
  id: string;
  registeredName?: string | null;
  tradingName?: string | null;
  name: string;
  logo: string;
  status: 'Active' | 'Onboarding' | 'Delayed' | 'Restocking' | 'Inactive';
  type: 'Manufacturer' | 'Distributor' | 'Wholesaler' | 'Transport Partner';
  vendorRoles: SupplierVendorRole[];
  capabilities: string[];
  region: string;
  leadTime: string;
  productCount: number;
  rating: number;
  blocker?: string;
  defaultCurrency: string;
  vatRegistered: boolean;
  vatNumber?: string | null;
  providesProducts: boolean;
  providesTransport: boolean;
  notes?: string | null;
  locations: SupplierLocationSummary[];
  contacts: SupplierContactSummary[];
  documents: SupplierDocumentSummary[];
  terms: {
    payment: string;
    delivery: string;
    moq: string;
    currency: string;
    incoterms: string;
  };
  commercialAccount: SupplierCommercialAccountSummary;
  performance: {
    onTimeDelivery: number;
    qualityScore: number;
    returnRate: number;
    priceCompetitiveness: number;
  };
  workflowMilestones: {
    onboarded: boolean;
    linkedToProducts: boolean;
    poIssued: boolean;
    dispatchReady: boolean;
    claimsVerified: boolean;
  };
  orders: {
    id: string;
    date: string;
    status: 'Draft' | 'Sent' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
    amount: number;
    type: 'PO' | 'POD';
  }[];
  history: {
    date: string;
    action: string;
    user: string;
    details?: string;
  }[];
  documentHistory: BusinessDocumentSummary[];
  portalUsers: SupplierPortalUserSummary[];
}

export interface CustomerDocumentHistory {
  id: string;
  name: string;
  type?: string | null;
  stage?: string | null;
  email?: string | null;
  phone?: string | null;
  documents: BusinessDocumentSummary[];
}

export interface CustomerWorkflowLineItemInput {
  productId: string;
  quantity: number;
  unitPriceZar?: number;
}

export interface CreateCustomerQuoteInput {
  title?: string;
  summary?: string;
  notes?: string[];
  dueAt?: string;
  sourceConversationId?: string;
  lineItems: CustomerWorkflowLineItemInput[];
}

export interface CompleteCustomerOrderInput {
  fulfilmentMode?: 'Delivery' | 'Collection';
  note?: string;
}

export interface CustomerWorkflowProgressResult {
  customer: CustomerDocumentHistory;
  primaryDocument: BusinessDocumentSummary;
  relatedDocuments: BusinessDocumentSummary[];
}

export interface InventoryAssetSummary {
  id: string;
  name: string;
  type: InventoryAssetType;
  role: InventoryAssetRole;
  source: InventoryAssetSource;
  protectionLevel: InventoryAssetProtectionLevel;
  size: string;
  status: InventoryAssetStatus;
  usage: string[];
  img: string;
  parentId?: string;
  productId?: string;
  productName?: string;
  linkedProductIds?: string[];
  linkedCampaignIds?: string[];
  completeness?: number;
  is3DReady?: boolean;
  campaignId?: string;
  campaignName?: string;
  tags: string[];
  workflowNode?: string;
  pipeline?: {
    sourceUploaded: boolean;
    textureReady: boolean;
    previewAttached: boolean;
    modelReferenceAttached: boolean;
    conversionStatus: 'Pending' | 'Processing' | 'Complete' | 'Failed';
  };
  watermarkProfile?: string;
  backgroundTransparent?: boolean;
  storage?: {
    originalFilename?: string | null;
    storedFilename?: string | null;
    storagePath?: string | null;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    sha256?: string | null;
  };
}

export interface ProductDimensions {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  weightKg: number;
  coverageOrientation: CoverageOrientation;
  faceAreaM2: number;
  unitsPerM2: number;
}

export interface ProductPackaging {
  piecesPerPallet: number;
  boxesPerPallet: number;
  palletsPerTruck: number;
  piecesPerBox: number;
  sqmPerBox: number;
  boxesPerTruck: number;
  piecesPerTruck: number;
  sqmPerPallet: number;
  sqmPerTruck: number;
  weightPerPalletKg: number;
  weightPerTruckKg: number;
}

export interface StockPosition {
  productId: string;
  mode: 'Dropship';
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  lowStock: boolean;
  lastMovementAt?: string | null;
  availabilityStatus: InventoryAvailabilityStatus;
  linkedSupplierName?: string;
  leadTimeLabel?: string;
  procurementTrigger: InventoryProcurementTrigger;
}

export interface RequiredMediaSnapshot {
  primaryImageUrl?: string | null;
  galleryImageUrl?: string | null;
  faceImageUrl?: string | null;
  heroImageUrl?: string | null;
}

export interface ProductTestResultSnapshot {
  type: InventoryProductTestResultType;
  value: number;
  unit: string;
  notes?: string;
}

export interface ProductLatestTestReport {
  url?: string | null;
  name?: string | null;
  laboratoryName?: string | null;
  methodStandard?: string | null;
  reportReference?: string | null;
  testedAt?: string | null;
  issuedAt?: string | null;
}

export interface ProductDistributionPresence {
  channel: ProductDistributionChannel;
  type: ProductDistributionChannelType;
  connectionStatus: ProductDistributionConnectionStatus;
  publicationStatus: ProductDistributionPublicationStatus;
  syncMode: ProductDistributionSyncMode;
  isInternal: boolean;
  externalCatalogId?: string;
  externalListingId?: string;
  externalUrl?: string;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
}

export const businessDocumentTypeOptions = [
  'Customer Quote',
  'Customer Order',
  'Customer Invoice',
  'Purchase Order',
  'Goods Receipt',
  'Delivery Note',
  'Proof of Delivery',
  'Supplier Invoice',
  'Credit Note',
] as const;
export type BusinessDocumentType = (typeof businessDocumentTypeOptions)[number];

export const businessDocumentStatusOptions = [
  'Draft',
  'Pending',
  'Issued',
  'Sent',
  'Confirmed',
  'Partial',
  'Overdue',
  'Paid',
  'Received',
  'Delivered',
  'Cancelled',
  'Expired',
  'Flagged',
] as const;
export type BusinessDocumentStatus = (typeof businessDocumentStatusOptions)[number];

export interface BusinessDocumentSummary {
  id: string;
  key: string;
  title: string;
  type: BusinessDocumentType;
  status: BusinessDocumentStatus;
  issuedAt: string;
  dueAt?: string | null;
  totalAmount: number;
  balanceAmount?: number | null;
  currency: string;
  customerName?: string | null;
  supplierName?: string | null;
  productId?: string | null;
  productName?: string | null;
  productSku?: string | null;
  purchaseOrderKey?: string | null;
  goodsReceiptKey?: string | null;
  parentDocumentKey?: string | null;
  summary?: string | null;
  pdfUrl: string;
}

export interface InventoryProductSummary {
  id: string;
  recordId: string;
  publicSku: string;
  name: string;
  category: InventoryCategory;
  productType: InventoryProductType;
  finish: InventoryFinish | null;
  collection: string | null;
  status: InventoryLifecycleStatus;
  publishStatus: InventoryPublishStatus;
  stockPosition: StockPosition;
  sellPriceZar: number;
  costPriceZar: number;
  marginPercent: number;
  pricingUnit: InventoryPricingUnit;
  primaryImageUrl: string;
  readiness: ReadinessSnapshot;
  supplierCount: number;
  tags: string[];
}

export interface InventoryProductDetail extends InventoryProductSummary {
  description: string;
  marketingCopy: string;
  specifications: Record<string, string>;
  dimensions: ProductDimensions;
  packaging: ProductPackaging;
  testResults: ProductTestResultSnapshot[];
  latestTestReport: ProductLatestTestReport;
  requiredMedia: RequiredMediaSnapshot;
  media: InventoryAssetSummary[];
  suppliers: SupplierSummary[];
  history: {
    id: string;
    date: string;
    action: string;
    user: string;
    details?: string;
  }[];
  documentHistory: BusinessDocumentSummary[];
  pricing: {
    unit: InventoryPricingUnit;
    sellPriceZar: number;
    costPriceZar: number;
    marginPercent: number;
    currency: 'ZAR';
  };
  logistics: {
    defaultSupplierId?: string;
    defaultSupplierName?: string;
    defaultOriginLocation?: string;
    defaultOriginRegion?: string;
    defaultOriginCity?: string;
    costPricePerKm?: number;
    sellPricePerKm?: number;
    fixedFee?: number;
    minimumCharge?: number;
    currency: 'ZAR';
  };
  distributionChannels: ProductDistributionPresence[];
}

export interface InventoryDashboardSnapshot {
  generatedAt: string;
  latestActivityAt?: string | null;
  summary: {
    totalProducts: number;
    supplierAlertCount: number;
    globalCatalogHealth: number;
    globalAssetReadiness: number;
    globalThreedReadiness: number;
    globalMarketingReadiness: number;
    globalPublishReadiness: number;
  };
  availabilityAlerts: {
    id: string;
    name: string;
    supplierName?: string;
    leadTime?: string;
    status: Exclude<InventoryAvailabilityStatus, 'Ready to Procure'>;
    message: string;
    severity: 'Critical' | 'Warning';
  }[];
  assetCoverage: {
    id: string;
    name: string;
    images: number;
    campaigns: number;
    model3D: boolean;
    renders: number;
    health: 'Excellent' | 'Good' | 'Needs Assets' | 'Missing All';
  }[];
  procurementSeries: {
    label: string;
    current: number;
    predicted: number;
    currentValueZar: number;
    predictedValueZar: number;
  }[];
  categoryDistribution: {
    label: string;
    value: number;
  }[];
  assetRoi: {
    threedPublishLift: number;
    communityCoverage: number;
  };
  procurementFocus: {
    productId: string;
    productName: string;
    severity: 'Critical' | 'Warning' | 'Healthy';
    reason: string;
    actionLabel: string;
  } | null;
  topPerformers: InventoryProductSummary[];
}

export interface PriceListImportRowInput {
  publicSku: string;
  name: string;
  category: InventoryCategory | string;
  productType: string;
  finish?: InventoryFinish | string | null;
  collection?: string;
  description?: string;
  sellPriceZar?: number;
  unitCostZar?: number;
  linkedSupplierId?: string;
  pricingUnit?: InventoryPricingUnit | string;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  weightKg?: number;
  piecesPerPallet?: number;
  boxesPerPallet?: number;
  palletsPerTruck?: number;
  primaryImageUrl?: string;
  galleryImageUrl?: string;
  faceImageUrl?: string;
  heroImageUrl?: string;
  tags?: string[];
}

export interface PriceListImportResult {
  batchId: string;
  fileName: string;
  sourceType: 'csv' | 'xlsx' | 'json' | 'manual';
  status: 'Staged' | 'Applied' | 'Failed';
  rowCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface LogisticsQuote {
  id: string;
  productId: string;
  supplierId: string;
  supplierName: string;
  originLocationId: string;
  originLocationLabel: string;
  destinationLabel: string;
  distanceKm: number;
  distanceSource: 'live' | 'fallback';
  costPerKm: number;
  sellPricePerKm: number;
  fixedFee: number;
  minimumCharge: number;
  logisticsCost: number;
  logisticsSellPrice: number;
  currency: 'ZAR';
  createdAt: string;
}

export interface AssetSlotInput {
  assetId?: string;
  url: string;
  source?: InventoryAssetSource;
  name?: string;
  originalFilename?: string;
  storedFilename?: string;
  storagePath?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  sha256?: string;
}

export interface ProductTestResultInput {
  type: InventoryProductTestResultType;
  value: number;
  unit: string;
  notes?: string;
}

export interface CreateInventoryProductInput {
  name: string;
  publicSku: string;
  category: InventoryCategory;
  productType: InventoryProductType;
  finish?: InventoryFinish | null;
  collection?: string | null;
  description: string;
  linkedSupplierId: string;
  unitCostZar: number;
  sellPriceZar?: number;
  pricingUnit?: InventoryPricingUnit;
  tags?: string[];
  dimensions: {
    lengthMm: number;
    widthMm: number;
    heightMm: number;
    weightKg: number;
    coverageOrientation: CoverageOrientation;
  };
  packaging: {
    piecesPerPallet: number;
    boxesPerPallet?: number;
    palletsPerTruck: number;
  };
  testResults?: ProductTestResultInput[];
  latestTestReport?: AssetSlotInput | null;
  latestTestLaboratoryName?: string | null;
  latestTestMethodStandard?: string | null;
  latestTestReportReference?: string | null;
  latestTestedAt?: string | null;
  latestTestIssuedAt?: string | null;
  primaryImage: AssetSlotInput;
  galleryImage: AssetSlotInput;
  faceImage: AssetSlotInput;
  heroImage?: AssetSlotInput;
  asset2_5d?: AssetSlotInput;
  asset3d?: AssetSlotInput;
  projectImages?: AssetSlotInput[];
  generatedImages?: AssetSlotInput[];
  galleryImages?: AssetSlotInput[];
}

export interface UpdateInventoryProductInput {
  publicSku?: string;
  name?: string;
  category?: InventoryCategory;
  productType?: InventoryProductType;
  finish?: InventoryFinish | null;
  collection?: string | null;
  description?: string;
  marketingCopy?: string;
  unitCostZar?: number | null;
  sellPriceZar?: number | null;
  pricingUnit?: InventoryPricingUnit;
  publishStatus?: InventoryPublishStatus;
  status?: InventoryLifecycleStatus;
  linkedSupplierId?: string;
  primaryImage?: AssetSlotInput | null;
  galleryImage?: AssetSlotInput | null;
  faceImage?: AssetSlotInput | null;
  heroImage?: AssetSlotInput | null;
  asset2_5d?: AssetSlotInput | null;
  asset3d?: AssetSlotInput | null;
  projectImages?: AssetSlotInput[];
  generatedImages?: AssetSlotInput[];
  galleryImages?: AssetSlotInput[];
  specifications?: Record<string, string>;
  dimensions?: Partial<CreateInventoryProductInput['dimensions']>;
  packaging?: Partial<CreateInventoryProductInput['packaging']>;
  testResults?: ProductTestResultInput[];
  latestTestReport?: AssetSlotInput | null;
  latestTestLaboratoryName?: string | null;
  latestTestMethodStandard?: string | null;
  latestTestReportReference?: string | null;
  latestTestedAt?: string | null;
  latestTestIssuedAt?: string | null;
}

export interface CreateInventoryAssetInput {
  name: string;
  productId?: string;
  type: InventoryAssetType;
  role: InventoryAssetRole;
  imageUrl: string;
  source?: InventoryAssetSource;
  status?: InventoryAssetStatus;
  protectionLevel?: InventoryAssetProtectionLevel;
  linkedCampaignIds?: string[];
  originalFilename?: string;
  storedFilename?: string;
  storagePath?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  sha256?: string;
}

export interface CreateSupplierInput {
  name: string;
  registeredName?: string;
  tradingName?: string;
  logoUrl?: string;
  type: 'Manufacturer' | 'Distributor' | 'Wholesaler' | 'Transport Partner';
  status?: 'Active' | 'Onboarding' | 'Delayed' | 'Restocking' | 'Inactive';
  vendorRoles?: SupplierVendorRole[];
  capabilities?: string[];
  region?: string;
  leadTime?: string;
  currency?: string;
  vatRegistered?: boolean;
  vatNumber?: string;
  providesProducts?: boolean;
  providesTransport?: boolean;
  notes?: string;
  location?: {
    label: string;
    streetAddress?: string;
    postalCode?: string;
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  contacts?: Array<{
    department: string;
    roleTitle?: string;
    name: string;
    email: string;
    phone?: string;
    preferredChannel?: VendorPreferredChannel;
    notes?: string;
    isPrimary?: boolean;
  }>;
  documents?: Array<{
    name: string;
    type: VendorDocumentType;
    storagePath: string;
    storedFileName: string;
    mimeType?: string;
    uploadedBy?: string;
    fileSizeBytes?: number;
  }>;
  commercialAccount?: {
    paymentTerms?: string;
    deliveryTerms?: string;
    minimumOrderValueZar?: number;
    standardDiscountPct?: number;
    moq?: string;
    currency?: string;
    incoterms?: string;
    creditLimitZar?: number;
    currentCreditBalanceZar?: number;
    vatRegistered?: boolean;
    vatNumber?: string;
  };
  linkedProductIds?: string[];
  portalUser?: {
    email: string;
    fullName: string;
    roleLabel?: string;
    password: string;
  };
}

export interface UpdateSupplierInput {
  registeredName?: string;
  tradingName?: string;
  name?: string;
  logoUrl?: string | null;
  type?: CreateSupplierInput['type'];
  status?: CreateSupplierInput['status'];
  vendorRoles?: SupplierVendorRole[];
  capabilities?: string[];
  region?: string;
  leadTime?: string;
  currency?: string;
  vatRegistered?: boolean;
  vatNumber?: string | null;
  providesProducts?: boolean;
  providesTransport?: boolean;
  notes?: string | null;
  location?: CreateSupplierInput['location'];
  commercialAccount?: CreateSupplierInput['commercialAccount'];
}

export type CreateSupplierContactInput = NonNullable<CreateSupplierInput['contacts']>[number];

export type CreateSupplierDocumentInput = NonNullable<CreateSupplierInput['documents']>[number];

export interface LinkSupplierProductsInput {
  productIds: string[];
  replace?: boolean;
}

export interface DeleteSupplierResult {
  ok: true;
  id: string;
  disposition: 'deleted' | 'archived';
  supplier?: SupplierSummary;
}

export interface SupplierPortalSession {
  ok: true;
  vendor: SupplierSummary;
  user: SupplierPortalUserSummary;
}

export interface CreateStockMovementInput {
  productId: string;
  type: 'Receipt' | 'Reservation' | 'Release' | 'Issue' | 'Return' | 'Adjustment' | 'Cancellation';
  quantity: number;
  note?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface CreatePriceListImportInput {
  fileName: string;
  sourceType: 'csv' | 'xlsx' | 'json' | 'manual';
  rows: PriceListImportRowInput[];
}

export interface CreateLogisticsQuoteInput {
  productId: string;
  distanceKm?: number;
  destinationLabel: string;
  destinationRegion?: string;
  destinationCity?: string;
  supplierId?: string;
}
