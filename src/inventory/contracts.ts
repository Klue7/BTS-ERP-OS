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
  country: string;
  region: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface SupplierSummary {
  id: string;
  name: string;
  logo: string;
  status: 'Active' | 'Onboarding' | 'Delayed' | 'Restocking' | 'Inactive';
  type: 'Manufacturer' | 'Distributor' | 'Wholesaler';
  capabilities: string[];
  region: string;
  leadTime: string;
  productCount: number;
  rating: number;
  blocker?: string;
  locations: SupplierLocationSummary[];
  contacts: {
    department: string;
    name: string;
    email: string;
    phone: string;
    preferredChannel?: 'Email' | 'Phone' | 'WhatsApp' | 'Portal';
    notes?: string;
  }[];
  terms: {
    payment: string;
    delivery: string;
    moq: string;
    currency: string;
    incoterms: string;
  };
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
    sellPricePerKm?: number;
    fixedFee?: number;
    minimumCharge?: number;
    currency: 'ZAR';
  };
}

export interface InventoryDashboardSnapshot {
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
  }[];
  categoryDistribution: {
    label: string;
    value: number;
  }[];
  assetRoi: {
    conversionLift: number;
    sampleRequestRate: number;
  };
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
  url: string;
  source?: InventoryAssetSource;
  name?: string;
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
  name?: string;
  category?: InventoryCategory;
  productType?: InventoryProductType;
  finish?: InventoryFinish | null;
  collection?: string | null;
  description?: string;
  marketingCopy?: string;
  sellPriceZar?: number | null;
  publishStatus?: InventoryPublishStatus;
  status?: InventoryLifecycleStatus;
  linkedSupplierId?: string;
  specifications?: Record<string, string>;
  dimensions?: Partial<CreateInventoryProductInput['dimensions']>;
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
}

export interface CreateSupplierInput {
  name: string;
  type: 'Manufacturer' | 'Distributor' | 'Wholesaler';
  status?: 'Active' | 'Onboarding' | 'Delayed' | 'Restocking' | 'Inactive';
  capabilities?: string[];
  region?: string;
  leadTime?: string;
  currency?: string;
  location?: {
    label: string;
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
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
  distanceKm: number;
  destinationLabel: string;
  supplierId?: string;
}
