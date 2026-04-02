export type InventoryLifecycleStatus = 'Active' | 'Draft' | 'Archived' | 'Out of Stock';
export type InventoryPublishStatus = 'Not Ready' | 'Ready' | 'Published';
export type InventoryAssetStatus = 'Draft' | 'Review' | 'Approved' | 'Archived' | 'Restricted';
export type InventoryAssetType = 'Image' | 'Video' | '3D Asset' | '3D Render' | 'Model';
export type InventoryAssetProtectionLevel = 'Protected Original' | 'Managed Variant' | 'Publishable Variant';
export type InventoryAssetRole =
  | 'hero'
  | 'gallery'
  | 'installation'
  | 'detail'
  | 'campaign'
  | '3d_ready'
  | 'model'
  | 'publishable_variant'
  | 'face_texture'
  | 'detail_texture'
  | 'quote_render'
  | 'marketing_variant'
  | 'model_reference'
  | 'render'
  | 'pbr_texture';

export interface ReadinessChecklist {
  heroImage: boolean;
  technicalSpecs: boolean;
  threeDModel: boolean;
  marketingCopy: boolean;
  installationGallery: boolean;
  supplierLinkage: boolean;
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

export interface StockPosition {
  productId: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  lowStock: boolean;
  lastMovementAt?: string | null;
}

export interface InventoryProductSummary {
  id: string;
  recordId: string;
  sku: string;
  name: string;
  productType: string;
  commercialCategory: string;
  collection: string | null;
  status: InventoryLifecycleStatus;
  stockPosition: StockPosition;
  sellPrice: number;
  costPrice: number;
  marginPercent: number;
  primaryImageUrl: string;
  readiness: ReadinessSnapshot;
  supplierCount: number;
  tags: string[];
}

export interface InventoryProductDetail extends InventoryProductSummary {
  description: string;
  marketingCopy: string;
  specifications: Record<string, string>;
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
    unit: string;
    sellPrice: number;
    costPrice: number;
    marginPercent: number;
    currency: string;
  };
  logistics: {
    defaultSupplierId?: string;
    defaultSupplierName?: string;
    defaultOriginLocation?: string;
    sellPricePerKm?: number;
    fixedFee?: number;
    minimumCharge?: number;
    currency: string;
  };
}

export interface InventoryDashboardSnapshot {
  summary: {
    totalProducts: number;
    lowStockCount: number;
    globalCatalogHealth: number;
    globalAssetReadiness: number;
    globalThreedReadiness: number;
    globalMarketingReadiness: number;
    globalPublishReadiness: number;
  };
  lowStockAlerts: {
    id: string;
    name: string;
    stock: number;
    min: number;
    status: 'Critical' | 'Low';
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
  velocitySeries: {
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
  sku: string;
  name: string;
  productType: string;
  commercialCategory: string;
  collection?: string;
  description?: string;
  sellPrice?: number;
  unitCost?: number;
  currency?: string;
  unit?: string;
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
  currency: string;
  createdAt: string;
}

export interface CreateInventoryProductInput {
  name: string;
  sku: string;
  productType: string;
  commercialCategory: string;
  description: string;
  sellPrice?: number;
  unit?: string;
  dimensions?: string;
  weightKg?: number;
  reorderPoint?: number;
  initialStock?: number;
  supplierId?: string;
}

export interface UpdateInventoryProductInput {
  name?: string;
  commercialCategory?: string;
  collection?: string | null;
  description?: string;
  marketingCopy?: string;
  sellPrice?: number;
  publishStatus?: InventoryPublishStatus;
  status?: InventoryLifecycleStatus;
  reorderPoint?: number;
  specifications?: Record<string, string>;
}

export interface CreateInventoryAssetInput {
  name: string;
  productId?: string;
  type: InventoryAssetType;
  role: InventoryAssetRole;
  imageUrl: string;
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
