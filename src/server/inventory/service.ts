import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../../prisma/client.ts';
import {
  coverageOrientationOptions,
  inventoryAssetSourceOptions,
  inventoryCategoryOptions,
  inventoryFinishOptions,
  inventoryProductTypeOptionsByCategory,
  pricingUnitOptions,
} from '../../inventory/contracts';
import { resolveTransportDistance, type ProductQuoteModel, type QuoteCategoryKey } from '../../pricing/quoteEngine';
import { enqueueDomainEvent } from './domain-events.ts';
import { createSignedDocumentToken, hashPassword } from '../vendor-auth.ts';
import { recordWorkflowEvent } from '../workflows/ledger.ts';
import type {
  AssetSlotInput,
  BusinessDocumentSummary,
  CompleteCustomerOrderInput,
  CoverageOrientation,
  CustomerDocumentHistory,
  CustomerWorkflowProgressResult,
  CreateCustomerQuoteInput,
  CreateInventoryAssetInput,
  CreateInventoryProductInput,
  CreateLogisticsQuoteInput,
  CreatePriceListImportInput,
  CreateSupplierContactInput,
  CreateSupplierDocumentInput,
  CreateStockMovementInput,
  CreateSupplierInput,
  InventoryAssetRole,
  InventoryAssetSource,
  InventoryCategory,
  InventoryDashboardSnapshot,
  InventoryFinish,
  InventoryProductDetail,
  InventoryProductTestResultType,
  InventoryProductSummary,
  InventoryProductType,
  InventoryPricingUnit,
  LogisticsQuote,
  PriceListImportResult,
  ReadinessSnapshot,
  LinkSupplierProductsInput,
  StockPosition,
  SupplierSummary,
  UpdateSupplierInput,
  UpdateInventoryProductInput,
} from '../../inventory/contracts';

const PLACEHOLDER_IMAGE = 'https://picsum.photos/seed/btsinventoryplaceholder/800/800';
type DbClient = Prisma.TransactionClient | typeof prisma;

const businessDocumentArgs = {
  include: {
    customer: true,
    supplier: true,
    product: true,
    purchaseOrder: true,
    goodsReceipt: true,
    parentDocument: true,
  },
} satisfies Prisma.BusinessDocumentDefaultArgs;

const supplierDetailArgs = {
  include: {
    productSuppliers: true,
    locations: true,
    vendorContacts: {
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    },
    documents: {
      orderBy: { createdAt: 'desc' },
    },
    commercialAccount: true,
    vendorUsers: {
      orderBy: { createdAt: 'asc' },
    },
    workflowEvents: {
      orderBy: { occurredAt: 'desc' },
    },
    businessDocuments: {
      include: businessDocumentArgs.include,
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
    },
  },
} satisfies Prisma.SupplierDefaultArgs;

const productDetailArgs = {
  include: {
    productSuppliers: {
      include: {
        supplier: {
          include: {
            ...supplierDetailArgs.include,
            rateCards: true,
          },
        },
        originLocation: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    },
    stockMovements: {
      orderBy: { occurredAt: 'asc' },
    },
    assets: {
      include: {
        links: true,
      },
      orderBy: [{ createdAt: 'asc' }],
    },
    distributionPublications: {
      orderBy: [{ channel: 'asc' }],
    },
    testResults: {
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    },
    historyEvents: {
      orderBy: { occurredAt: 'desc' },
    },
    businessDocuments: {
      include: businessDocumentArgs.include,
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
    },
  },
} satisfies Prisma.ProductDefaultArgs;

const customerDocumentHistoryArgs = {
  include: {
    documents: {
      include: businessDocumentArgs.include,
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
    },
  },
} satisfies Prisma.CustomerProfileDefaultArgs;

const workflowProductArgs = {
  include: {
    productSuppliers: {
      include: {
        supplier: true,
        originLocation: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    },
  },
} satisfies Prisma.ProductDefaultArgs;

type ProductRecord = Prisma.ProductGetPayload<typeof productDetailArgs>;
type SupplierRecord = Prisma.SupplierGetPayload<typeof supplierDetailArgs>;
type BusinessDocumentRecord = Prisma.BusinessDocumentGetPayload<typeof businessDocumentArgs>;
type WorkflowProductRecord = Prisma.ProductGetPayload<typeof workflowProductArgs>;
type AssetStorageRecord = {
  originalFileName?: string | null;
  storedFileName?: string | null;
  storagePath?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  sha256?: string | null;
};
type CustomerDocumentRecord = Prisma.CustomerProfileGetPayload<typeof customerDocumentHistoryArgs>;
type WorkflowResolvedLineItem = {
  product: WorkflowProductRecord;
  supplierLink: WorkflowProductRecord['productSuppliers'][number];
  quantity: number;
  unitPriceZar: number;
  totalPriceZar: number;
  unitCostZar: number;
  totalCostZar: number;
};

const lifecycleStatusMap = {
  Active: 'ACTIVE',
  Draft: 'DRAFT',
  Archived: 'ARCHIVED',
  'Out of Stock': 'OUT_OF_STOCK',
} as const;

const publishStatusMap = {
  'Not Ready': 'NOT_READY',
  Ready: 'READY',
  Published: 'PUBLISHED',
} as const;

const lifecycleStatusLabels = {
  ACTIVE: 'Active',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived',
  OUT_OF_STOCK: 'Out of Stock',
} as const;

const publishStatusLabels = {
  NOT_READY: 'Not Ready',
  READY: 'Ready',
  PUBLISHED: 'Published',
} as const;

const productTestResultTypeLabels = {
  COMPRESSIVE_STRENGTH_MPA: 'Compressive Strength (MPa)',
  WATER_ABSORPTION_PERCENT: 'Water Absorption (%)',
  LENGTH_MM_TESTED: 'Tested Length (mm)',
  WIDTH_MM_TESTED: 'Tested Width (mm)',
  HEIGHT_MM_TESTED: 'Tested Height (mm)',
  DRY_MASS_KG: 'Dry Mass (kg)',
  WET_MASS_KG: 'Wet Mass (kg)',
  BREAKING_LOAD_KN: 'Breaking Load (kN)',
} as const;

const productTestResultTypeKeys = {
  'Compressive Strength (MPa)': 'COMPRESSIVE_STRENGTH_MPA',
  'Water Absorption (%)': 'WATER_ABSORPTION_PERCENT',
  'Tested Length (mm)': 'LENGTH_MM_TESTED',
  'Tested Width (mm)': 'WIDTH_MM_TESTED',
  'Tested Height (mm)': 'HEIGHT_MM_TESTED',
  'Dry Mass (kg)': 'DRY_MASS_KG',
  'Wet Mass (kg)': 'WET_MASS_KG',
  'Breaking Load (kN)': 'BREAKING_LOAD_KN',
} as const;

const distributionChannelLabels = {
  META_CATALOG: 'Meta Catalog',
  WHATSAPP_CATALOG: 'WhatsApp Catalog',
  GOOGLE_MERCHANT_CENTER: 'Google Merchant Center',
  TIKTOK_SHOP: 'TikTok Shop',
} as const;

const distributionChannelTypeLabels = {
  CATALOG: 'Catalog',
  MARKETPLACE: 'Marketplace',
  MESSAGING: 'Messaging',
} as const;

const distributionConnectionStatusLabels = {
  NOT_CONNECTED: 'Not Connected',
  CONNECTED: 'Connected',
  DEGRADED: 'Degraded',
  ERROR: 'Error',
} as const;

const distributionPublicationStatusLabels = {
  NOT_POSTED: 'Not Posted',
  QUEUED: 'Queued',
  SYNCING: 'Syncing',
  LIVE: 'Live',
  PAUSED: 'Paused',
  FAILED: 'Failed',
  ARCHIVED: 'Archived',
} as const;

const distributionSyncModeLabels = {
  MANUAL: 'Manual',
  API: 'API',
} as const;

const supplierStatusKeys = {
  Active: 'ACTIVE',
  Onboarding: 'ONBOARDING',
  Delayed: 'DELAYED',
  Restocking: 'RESTOCKING',
  Inactive: 'INACTIVE',
} as const;

const supplierStatusLabels = {
  ACTIVE: 'Active',
  ONBOARDING: 'Onboarding',
  DELAYED: 'Delayed',
  RESTOCKING: 'Restocking',
  INACTIVE: 'Inactive',
} as const;

const supplierTypeKeys = {
  Manufacturer: 'MANUFACTURER',
  Distributor: 'DISTRIBUTOR',
  Wholesaler: 'WHOLESALER',
  'Transport Partner': 'TRANSPORT_PARTNER',
} as const;

const supplierTypeLabels = {
  MANUFACTURER: 'Manufacturer',
  DISTRIBUTOR: 'Distributor',
  WHOLESALER: 'Wholesaler',
  TRANSPORT_PARTNER: 'Transport Partner',
} as const;

const supplierVendorRoleKeys = {
  'Product Supplier': 'PRODUCT_SUPPLIER',
  'Transport Partner': 'TRANSPORT_PARTNER',
} as const;

const supplierVendorRoleLabels = {
  PRODUCT_SUPPLIER: 'Product Supplier',
  TRANSPORT_PARTNER: 'Transport Partner',
} as const;

const preferredChannelKeys = {
  Email: 'EMAIL',
  Phone: 'PHONE',
  WhatsApp: 'WHATSAPP',
  Portal: 'PORTAL',
} as const;

const preferredChannelLabels = {
  EMAIL: 'Email',
  PHONE: 'Phone',
  WHATSAPP: 'WhatsApp',
  PORTAL: 'Portal',
} as const;

const vendorDocumentTypeKeys = {
  Agreement: 'AGREEMENT',
  'Test Result': 'TEST_RESULT',
  Plan: 'PLAN',
  Certification: 'CERTIFICATION',
  'Purchase Order': 'PURCHASE_ORDER',
  'Delivery Note': 'DELIVERY_NOTE',
  Invoice: 'INVOICE',
  Other: 'OTHER',
} as const;

const vendorDocumentTypeLabels = {
  AGREEMENT: 'Agreement',
  TEST_RESULT: 'Test Result',
  PLAN: 'Plan',
  CERTIFICATION: 'Certification',
  PURCHASE_ORDER: 'Purchase Order',
  DELIVERY_NOTE: 'Delivery Note',
  INVOICE: 'Invoice',
  OTHER: 'Other',
} as const;

const businessDocumentTypeLabels = {
  CUSTOMER_QUOTE: 'Customer Quote',
  CUSTOMER_ORDER: 'Customer Order',
  CUSTOMER_INVOICE: 'Customer Invoice',
  PURCHASE_ORDER: 'Purchase Order',
  GOODS_RECEIPT: 'Goods Receipt',
  DELIVERY_NOTE: 'Delivery Note',
  PROOF_OF_DELIVERY: 'Proof of Delivery',
  SUPPLIER_INVOICE: 'Supplier Invoice',
  CREDIT_NOTE: 'Credit Note',
} as const;

const businessDocumentStatusLabels = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  ISSUED: 'Issued',
  SENT: 'Sent',
  CONFIRMED: 'Confirmed',
  PARTIAL: 'Partial',
  OVERDUE: 'Overdue',
  PAID: 'Paid',
  RECEIVED: 'Received',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  FLAGGED: 'Flagged',
} as const;

const vendorWorkflowEventTypeKeys = {
  'vendor.created': 'VENDOR_CREATED',
  'vendor.updated': 'VENDOR_UPDATED',
  'vendor.document_uploaded': 'VENDOR_DOCUMENT_UPLOADED',
  'product.vendor_linked': 'PRODUCT_VENDOR_LINKED',
  'purchase_order.created': 'PURCHASE_ORDER_CREATED',
  'purchase_order.sent': 'PURCHASE_ORDER_SENT',
  'delivery_note.created': 'DELIVERY_NOTE_CREATED',
  'transport_job.created': 'TRANSPORT_JOB_CREATED',
  'dispatch.confirmed': 'DISPATCH_CONFIRMED',
  'pod.received': 'POD_RECEIVED',
  'supplier_invoice.received': 'SUPPLIER_INVOICE_RECEIVED',
  'payment.applied': 'PAYMENT_APPLIED',
} as const;

const locationTypeLabels = {
  SUPPLIER_ORIGIN: 'Supplier Origin',
  WAREHOUSE: 'Warehouse',
  CUSTOMER_DESTINATION: 'Customer Destination',
} as const;

const assetTypeLabels = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  TWO_POINT_FIVE_D_ASSET: '2.5D Asset',
  THREE_D_ASSET: '3D Asset',
  THREE_D_RENDER: '3D Render',
  MODEL: 'Model',
} as const;

const assetTypeKeys = {
  Image: 'IMAGE',
  Video: 'VIDEO',
  '2.5D Asset': 'TWO_POINT_FIVE_D_ASSET',
  '3D Asset': 'THREE_D_ASSET',
  '3D Render': 'THREE_D_RENDER',
  Model: 'MODEL',
} as const;

const assetProtectionLabels = {
  PROTECTED_ORIGINAL: 'Protected Original',
  MANAGED_VARIANT: 'Managed Variant',
  PUBLISHABLE_VARIANT: 'Publishable Variant',
} as const;

const assetProtectionKeys = {
  'Protected Original': 'PROTECTED_ORIGINAL',
  'Managed Variant': 'MANAGED_VARIANT',
  'Publishable Variant': 'PUBLISHABLE_VARIANT',
} as const;

const assetStatusLabels = {
  DRAFT: 'Draft',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
  RESTRICTED: 'Restricted',
} as const;

const assetStatusKeys = {
  Draft: 'DRAFT',
  Review: 'REVIEW',
  Approved: 'APPROVED',
  Archived: 'ARCHIVED',
  Restricted: 'RESTRICTED',
} as const;

const assetSourceLabels = {
  DIRECT_UPLOAD: 'Direct Upload',
  ASSET_LIBRARY: 'Asset Library',
  MARKETING_TOOL: 'Marketing Tool',
  COMMUNITY_SUBMISSION: 'Community Submission',
  STUDIO_PUBLISHED: 'Studio Published',
} as const;

const assetSourceKeys = {
  'Direct Upload': 'DIRECT_UPLOAD',
  'Asset Library': 'ASSET_LIBRARY',
  'Marketing Tool': 'MARKETING_TOOL',
  'Community Submission': 'COMMUNITY_SUBMISSION',
  'Studio Published': 'STUDIO_PUBLISHED',
} as const;

const categoryKeys = {
  Cladding: 'CLADDING',
  Bricks: 'BRICKS',
  Paving: 'PAVING',
  Blocks: 'BLOCKS',
} as const;

const categoryLabels = {
  CLADDING: 'Cladding',
  BRICKS: 'Bricks',
  PAVING: 'Paving',
  BLOCKS: 'Blocks',
} as const;

const productTypeKeys = {
  Classic: 'CLASSIC',
  Modern: 'MODERN',
  Natural: 'NATURAL',
  Premium: 'PREMIUM',
  NFP: 'NFP',
  NFX: 'NFX',
  FBA: 'FBA',
  FBS: 'FBS',
  FBX: 'FBX',
  Maxi: 'MAXI',
  Bevel: 'BEVEL',
  'Split-Bevel': 'SPLIT_BEVEL',
  Interlocking: 'INTERLOCKING',
  Cement: 'CEMENT',
  Breeze: 'BREEZE',
  Clay: 'CLAY',
} as const;

const productTypeLabels = {
  CLASSIC: 'Classic',
  MODERN: 'Modern',
  NATURAL: 'Natural',
  PREMIUM: 'Premium',
  NFP: 'NFP',
  NFX: 'NFX',
  FBA: 'FBA',
  FBS: 'FBS',
  FBX: 'FBX',
  MAXI: 'Maxi',
  BEVEL: 'Bevel',
  SPLIT_BEVEL: 'Split-Bevel',
  INTERLOCKING: 'Interlocking',
  CEMENT: 'Cement',
  BREEZE: 'Breeze',
  CLAY: 'Clay',
} as const;

const finishKeys = {
  Travertine: 'TRAVERTINE',
  Ribbed: 'RIBBED',
  Smooth: 'SMOOTH',
  Satin: 'SATIN',
  Rustic: 'RUSTIC',
  Variation: 'VARIATION',
} as const;

const finishLabels = {
  TRAVERTINE: 'Travertine',
  RIBBED: 'Ribbed',
  SMOOTH: 'Smooth',
  SATIN: 'Satin',
  RUSTIC: 'Rustic',
  VARIATION: 'Variation',
} as const;

const pricingUnitKeys = {
  m2: 'M2',
  piece: 'PIECE',
  pallet: 'PALLET',
} as const;

const pricingUnitLabels = {
  M2: 'm2',
  PIECE: 'piece',
  PALLET: 'pallet',
} as const;

const coverageOrientationKeys = {
  'Length x Width': 'LENGTH_X_WIDTH',
  'Length x Height': 'LENGTH_X_HEIGHT',
  'Width x Height': 'WIDTH_X_HEIGHT',
} as const;

const coverageOrientationLabels = {
  LENGTH_X_WIDTH: 'Length x Width',
  LENGTH_X_HEIGHT: 'Length x Height',
  WIDTH_X_HEIGHT: 'Width x Height',
} as const;

const quoteDefaultsByCategory: Record<
  InventoryCategory,
  {
    pricingUnit: InventoryPricingUnit;
    unitsPerM2: number;
    piecesPerPallet: number;
    boxesPerPallet: number;
    palletsPerTruck: number;
  }
> = {
  Cladding: {
    pricingUnit: 'm2',
    unitsPerM2: 50,
    piecesPerPallet: 2000,
    boxesPerPallet: 40,
    palletsPerTruck: 24,
  },
  Bricks: {
    pricingUnit: 'piece',
    unitsPerM2: 55,
    piecesPerPallet: 500,
    boxesPerPallet: 0,
    palletsPerTruck: 24,
  },
  Paving: {
    pricingUnit: 'piece',
    unitsPerM2: 50,
    piecesPerPallet: 360,
    boxesPerPallet: 0,
    palletsPerTruck: 24,
  },
  Blocks: {
    pricingUnit: 'piece',
    unitsPerM2: 12.5,
    piecesPerPallet: 100,
    boxesPerPallet: 0,
    palletsPerTruck: 24,
  },
};

const quoteCategoryByInventoryCategory: Record<InventoryCategory, QuoteCategoryKey> = {
  Cladding: 'cladding-tiles',
  Bricks: 'bricks',
  Paving: 'paving',
  Blocks: 'breeze-blocks',
};

const routeRegionCoordinates: Record<string, { latitude: number; longitude: number }> = {
  gauteng: { latitude: -26.2708, longitude: 28.1123 },
  'north west': { latitude: -26.6639, longitude: 25.2838 },
  limpopo: { latitude: -23.4013, longitude: 29.4179 },
  mpumalanga: { latitude: -25.5653, longitude: 30.5279 },
  'free state': { latitude: -28.4541, longitude: 26.7968 },
  kzn: { latitude: -28.5305, longitude: 30.8958 },
  'kwazulu-natal': { latitude: -28.5305, longitude: 30.8958 },
  'northern cape': { latitude: -29.0467, longitude: 21.8569 },
  'eastern cape': { latitude: -32.2968, longitude: 26.4194 },
  'western cape': { latitude: -33.2278, longitude: 21.8569 },
  'cape town': { latitude: -33.9249, longitude: 18.4241 },
  kimberley: { latitude: -28.7282, longitude: 24.7499 },
  johannesburg: { latitude: -26.2041, longitude: 28.0473 },
  durban: { latitude: -29.8587, longitude: 31.0218 },
  pretoria: { latitude: -25.7479, longitude: 28.2293 },
};

const assetRoleKeys = {
  primary_image: 'PRIMARY_IMAGE',
  gallery_image: 'GALLERY_IMAGE',
  face_image: 'FACE_IMAGE',
  hero_image: 'HERO_IMAGE',
  asset_2_5d: 'ASSET_2_5D',
  asset_3d: 'ASSET_3D',
  project_image: 'PROJECT_IMAGE',
  generated_image: 'GENERATED_IMAGE',
  gallery_extra: 'GALLERY_EXTRA',
  installation: 'INSTALLATION',
  detail: 'DETAIL',
  campaign: 'CAMPAIGN',
} as const;

const assetRoleLabels = {
  PRIMARY_IMAGE: 'primary_image',
  GALLERY_IMAGE: 'gallery_image',
  FACE_IMAGE: 'face_image',
  HERO_IMAGE: 'hero_image',
  ASSET_2_5D: 'asset_2_5d',
  ASSET_3D: 'asset_3d',
  PROJECT_IMAGE: 'project_image',
  GENERATED_IMAGE: 'generated_image',
  GALLERY_EXTRA: 'gallery_extra',
  INSTALLATION: 'installation',
  DETAIL: 'detail',
  CAMPAIGN: 'campaign',
} as const;

const stockMovementTypeKeys = {
  Receipt: 'RECEIPT',
  Reservation: 'RESERVATION',
  Release: 'RELEASE',
  Issue: 'ISSUE',
  Return: 'RETURN',
  Adjustment: 'ADJUSTMENT',
  Cancellation: 'CANCELLATION',
} as const;

const stockMovementEffects = {
  RECEIPT: { onHand: 1, reserved: 0 },
  RETURN: { onHand: 1, reserved: 0 },
  ADJUSTMENT: { onHand: 1, reserved: 0 },
  ISSUE: { onHand: -1, reserved: 0 },
  RESERVATION: { onHand: 0, reserved: 1 },
  RELEASE: { onHand: 0, reserved: -1 },
  CANCELLATION: { onHand: 0, reserved: -1 },
} as const;

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === 'number' ? value : Number(value);
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function startOfUtcMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function addUtcMonths(value: Date, months: number) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1));
}

function monthBucketKey(value: Date) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthBucketLabel(value: Date) {
  return value.toLocaleString('en-ZA', { month: 'short', timeZone: 'UTC' }).toUpperCase();
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function businessWorkflowKey(prefix: 'QT' | 'SO' | 'INV' | 'DN' | 'POD' | 'PO') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function customerStageFromDocuments(documents: Array<{ documentType: string; status: string }>, fallback?: string | null) {
  const hasPaidInvoice = documents.some((document) => document.documentType === 'CUSTOMER_INVOICE' && document.status === 'PAID');
  const hasFulfilment = documents.some((document) => document.documentType === 'DELIVERY_NOTE' || document.documentType === 'PROOF_OF_DELIVERY');
  const hasOrder = documents.some((document) => document.documentType === 'CUSTOMER_ORDER');
  const hasActiveQuote = documents.some((document) => document.documentType === 'CUSTOMER_QUOTE' && ['ISSUED', 'SENT', 'PARTIAL', 'PAID', 'CONFIRMED'].includes(document.status));
  const hasExpiredQuote = documents.some((document) => document.documentType === 'CUSTOMER_QUOTE' && ['EXPIRED', 'CANCELLED'].includes(document.status));

  if (hasPaidInvoice || hasFulfilment || hasOrder) {
    return 'Won';
  }
  if (hasActiveQuote) {
    return 'Quote Sent';
  }
  if (hasExpiredQuote) {
    return 'Follow-up';
  }
  return fallback?.trim() || 'Lead';
}

async function resolveWorkflowLineItems(client: DbClient, lineItems: CreateCustomerQuoteInput['lineItems']): Promise<WorkflowResolvedLineItem[]> {
  if (lineItems.length === 0) {
    throw new Error('At least one quote line item is required.');
  }

  const products = await client.product.findMany({
    where: {
      referenceId: {
        in: Array.from(new Set(lineItems.map((item) => item.productId))),
      },
    },
    ...workflowProductArgs,
  });

  return lineItems.map((item) => {
    ensurePositiveNumber(item.quantity, 'Quote quantity');
    const product = products.find((record) => record.referenceId === item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} was not found.`);
    }

    const supplierLink = product.productSuppliers.find((link) => link.isDefault) ?? product.productSuppliers[0];
    if (!supplierLink) {
      throw new Error(`No supplier linkage found for ${product.name}.`);
    }

    const baseUnitPriceZar = round(toNumber(product.sellPriceZar), 2);
    const unitPriceZar = item.unitPriceZar !== undefined ? round(item.unitPriceZar, 2) : baseUnitPriceZar;
    ensurePositiveNumber(unitPriceZar, 'Quote unit price');
    const unitCostZar = round(toNumber(supplierLink.unitCostZar), 2);
    return {
      product,
      supplierLink,
      quantity: item.quantity,
      unitPriceZar,
      totalPriceZar: round(unitPriceZar * item.quantity, 2),
      unitCostZar,
      totalCostZar: round(unitCostZar * item.quantity, 2),
    };
  });
}

function buildWorkflowSnapshot(input: {
  summary: string;
  notes?: string[];
  lineItems: WorkflowResolvedLineItem[];
  sourceConversationId?: string;
  fulfilmentMode?: 'Delivery' | 'Collection';
  workflowId?: string;
  linkedDocumentKeys?: string[];
}) {
  return {
    summary: input.summary,
    notes: input.notes ?? [],
    workflowId: input.workflowId ?? null,
    linkedDocumentKeys: input.linkedDocumentKeys ?? [],
    sourceConversationId: input.sourceConversationId ?? null,
    fulfilmentMode: input.fulfilmentMode ?? null,
    lineItems: input.lineItems.map((item) => ({
      productId: item.product.referenceId,
      sku: item.product.publicSku,
      name: item.product.name,
      quantity: item.quantity,
      unit: 'units',
      unitPriceZar: item.unitPriceZar,
      totalPriceZar: item.totalPriceZar,
      unitCostZar: item.unitCostZar,
      totalCostZar: item.totalCostZar,
      supplierKey: item.supplierLink.supplier.supplierKey,
      supplierName: item.supplierLink.supplier.name,
      originLocationLabel: item.supplierLink.originLocation.label,
    })),
  } satisfies Prisma.InputJsonValue;
}

function humanizeRole(role: keyof typeof assetRoleLabels) {
  return assetRoleLabels[role].replace(/_/g, ' ');
}

function ensurePositiveNumber(value: number, field: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive number.`);
  }
}

function defaultCoverageOrientation(category: InventoryCategory): CoverageOrientation {
  return category === 'Paving' ? 'Length x Width' : 'Length x Height';
}

function normalizeCategory(value: string): InventoryCategory {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'cladding') return 'Cladding';
  if (normalized === 'bricks' || normalized === 'brick') return 'Bricks';
  if (normalized === 'paving' || normalized === 'paver' || normalized === 'pavers') return 'Paving';
  if (normalized === 'blocks' || normalized === 'block') return 'Blocks';

  throw new Error(`Unsupported category "${value}".`);
}

function normalizeProductType(category: InventoryCategory, value: string): InventoryProductType {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/_/g, '-');

  const canonical = (() => {
    switch (normalized) {
      case 'classic':
        return 'Classic';
      case 'modern':
        return 'Modern';
      case 'natural':
        return 'Natural';
      case 'premium':
        return 'Premium';
      case 'nfp':
        return 'NFP';
      case 'nfx':
        return 'NFX';
      case 'fba':
        return 'FBA';
      case 'fbs':
        return 'FBS';
      case 'fbx':
        return 'FBX';
      case 'maxi':
        return 'Maxi';
      case 'bevel':
        return 'Bevel';
      case 'split-bevel':
      case 'split bevel':
        return 'Split-Bevel';
      case 'interlocking':
      case 'interlocing':
        return 'Interlocking';
      case 'cement':
        return 'Cement';
      case 'breeze':
        return 'Breeze';
      case 'clay':
        return 'Clay';
      default:
        return null;
    }
  })();

  if (!canonical) {
    throw new Error(`Unsupported type "${value}".`);
  }

  if (!(inventoryProductTypeOptionsByCategory[category] as readonly string[]).includes(canonical)) {
    throw new Error(`Type "${canonical}" is not valid for ${category}.`);
  }

  return canonical as InventoryProductType;
}

function normalizeFinish(category: InventoryCategory, value?: string | null): InventoryFinish | null {
  if (!value) {
    return null;
  }

  if (!['Cladding', 'Bricks'].includes(category)) {
    throw new Error(`Finish is only supported for Cladding and Bricks products.`);
  }

  const normalized = value.trim().toLowerCase();
  const canonical = inventoryFinishOptions.find((option) => option.toLowerCase() === normalized);

  if (!canonical) {
    throw new Error(`Unsupported finish "${value}".`);
  }

  return canonical;
}

function normalizePricingUnit(category: InventoryCategory, value?: string | null): InventoryPricingUnit {
  const categoryDefault = quoteDefaultsByCategory[category].pricingUnit;
  if (!value) {
    return categoryDefault;
  }

  const normalized = value.trim().toLowerCase();
  const canonical = pricingUnitOptions.find((option) => option === normalized);

  if (!canonical) {
    throw new Error(`Unsupported pricing unit "${value}".`);
  }

  if ((category === 'Bricks' && canonical !== 'piece') || (category === 'Cladding' && canonical !== 'm2')) {
    return categoryDefault;
  }

  return canonical;
}

function normalizeCoverageOrientation(value: string | undefined, category: InventoryCategory): CoverageOrientation {
  if (!value) {
    return defaultCoverageOrientation(category);
  }

  const canonical = coverageOrientationOptions.find((option) => option.toLowerCase() === value.trim().toLowerCase());
  if (!canonical) {
    throw new Error(`Unsupported coverage orientation "${value}".`);
  }

  return canonical;
}

function normalizeAssetSource(value?: string | null): InventoryAssetSource {
  if (!value) {
    return 'Direct Upload';
  }

  const canonical = inventoryAssetSourceOptions.find((option) => option.toLowerCase() === value.trim().toLowerCase());
  if (!canonical) {
    throw new Error(`Unsupported asset source "${value}".`);
  }

  return canonical;
}

function normalizeProductTestResultType(value: string): InventoryProductTestResultType {
  const canonical = Object.keys(productTestResultTypeKeys).find((option) => option.toLowerCase() === value.trim().toLowerCase());
  if (!canonical) {
    throw new Error(`Unsupported product test result type "${value}".`);
  }

  return canonical as InventoryProductTestResultType;
}

function normalizeTestResults(input?: CreateInventoryProductInput['testResults'] | UpdateInventoryProductInput['testResults']) {
  return (input ?? [])
    .filter((result) => Number.isFinite(result.value))
    .map((result, index) => ({
      resultType: productTestResultTypeKeys[normalizeProductTestResultType(result.type)],
      resultValue: Number(result.value),
      resultUnit: result.unit.trim(),
      notes: result.notes?.trim() || null,
      sortOrder: index,
    }));
}

function computeCoverageMetrics(input: {
  category: InventoryCategory;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  coverageOrientation: CoverageOrientation;
  piecesPerPallet?: number;
  boxesPerPallet?: number;
}) {
  const { lengthMm, widthMm, heightMm, coverageOrientation } = input;
  let coverageFace = lengthMm * widthMm;

  if (coverageOrientation === 'Length x Height') {
    coverageFace = lengthMm * heightMm;
  } else if (coverageOrientation === 'Width x Height') {
    coverageFace = widthMm * heightMm;
  }

  const faceAreaM2 = coverageFace / 1_000_000;
  const defaultConfig = quoteDefaultsByCategory[input.category];
  const unitsPerM2 =
    input.category === 'Cladding'
      ? round(
          Math.max(
            1,
            (input.piecesPerPallet && input.boxesPerPallet ? input.piecesPerPallet / input.boxesPerPallet : defaultConfig.unitsPerM2),
          ),
          4,
        )
      : input.category === 'Bricks'
        ? defaultConfig.unitsPerM2
        : faceAreaM2 > 0
          ? 1 / faceAreaM2
          : defaultConfig.unitsPerM2;

  return {
    faceAreaM2: round(faceAreaM2, 4),
    unitsPerM2: round(unitsPerM2, 4),
  };
}

function computePackagingMetrics(record: {
  category: InventoryCategory;
  piecesPerPallet: number;
  boxesPerPallet?: number | null;
  palletsPerTruck: number;
  unitsPerM2: Prisma.Decimal | number | null;
  weightKg: Prisma.Decimal | number | null;
}) {
  const defaults = quoteDefaultsByCategory[record.category];
  const piecesPerPallet = Math.max(1, record.piecesPerPallet || defaults.piecesPerPallet);
  const palletsPerTruck = Math.max(1, record.palletsPerTruck || defaults.palletsPerTruck);
  const boxesPerPallet =
    record.category === 'Cladding'
      ? Math.max(1, Number(record.boxesPerPallet ?? defaults.boxesPerPallet))
      : Math.max(0, Number(record.boxesPerPallet ?? defaults.boxesPerPallet));
  const unitsPerM2 = toNumber(record.unitsPerM2);
  const weightPerPieceKg = toNumber(record.weightKg);
  const sqmPerBox = record.category === 'Cladding' ? 1 : boxesPerPallet > 0 && unitsPerM2 > 0 ? (piecesPerPallet / unitsPerM2) / boxesPerPallet : 0;
  const piecesPerBox = sqmPerBox > 0 && unitsPerM2 > 0 ? sqmPerBox * unitsPerM2 : 0;
  const sqmPerPallet = unitsPerM2 > 0 ? round(piecesPerPallet / unitsPerM2, 4) : 0;
  const boxesPerTruck = boxesPerPallet * palletsPerTruck;
  const piecesPerTruck = piecesPerPallet * palletsPerTruck;
  const sqmPerTruck = unitsPerM2 > 0 ? round(piecesPerTruck / unitsPerM2, 4) : 0;
  const weightPerPalletKg = round(piecesPerPallet * weightPerPieceKg, 3);
  const weightPerTruckKg = round(piecesPerTruck * weightPerPieceKg, 3);

  return {
    piecesPerPallet,
    boxesPerPallet,
    palletsPerTruck,
    piecesPerBox: round(piecesPerBox, 4),
    sqmPerBox: round(sqmPerBox, 4),
    boxesPerTruck,
    piecesPerTruck,
    sqmPerPallet,
    sqmPerTruck,
    weightPerPalletKg,
    weightPerTruckKg,
  };
}

function findRouteCoordinates(value?: string | null) {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (routeRegionCoordinates[normalized]) {
    return routeRegionCoordinates[normalized];
  }

  for (const [key, coordinates] of Object.entries(routeRegionCoordinates)) {
    if (normalized.includes(key)) {
      return coordinates;
    }
  }

  return null;
}

async function resolveLiveDistanceKm(input: {
  originLatitude?: number | null;
  originLongitude?: number | null;
  destinationRegion?: string;
}) {
  const apiKey = process.env.OPENROUTE_API_KEY;
  if (!apiKey || !input.originLatitude || !input.originLongitude) {
    return null;
  }

  const destination = findRouteCoordinates(input.destinationRegion);
  if (!destination) {
    return null;
  }

  const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/json', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates: [
        [input.originLongitude, input.originLatitude],
        [destination.longitude, destination.latitude],
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Live routing failed with status ${response.status}.`);
  }

  const payload = await response.json() as { routes?: Array<{ summary?: { distance?: number } }> };
  const distanceMeters = payload.routes?.[0]?.summary?.distance;
  if (!distanceMeters) {
    return null;
  }

  return round(distanceMeters / 1000, 2);
}

function resolveAvailabilityStatus(productSupplier?: ProductRecord['productSuppliers'][number]): StockPosition['availabilityStatus'] {
  if (!productSupplier) {
    return 'Missing Supplier';
  }

  switch (productSupplier.supplier.status) {
    case 'ACTIVE':
      return 'Ready to Procure';
    case 'ONBOARDING':
      return 'Supplier Onboarding';
    case 'DELAYED':
    case 'RESTOCKING':
      return 'Supplier Delayed';
    default:
      return 'Missing Supplier';
  }
}

function buildStockPosition(record: ProductRecord): StockPosition {
  let onHand = 0;
  let reserved = 0;

  for (const movement of record.stockMovements) {
    const effect = stockMovementEffects[movement.movementType];
    onHand += effect.onHand * movement.quantity;
    reserved = Math.max(0, reserved + (effect.reserved * movement.quantity));
  }

  const defaultSupplier = record.productSuppliers.find((link) => link.isDefault) ?? record.productSuppliers[0];
  const lastMovementAt = record.stockMovements.at(-1)?.occurredAt?.toISOString() ?? null;

  return {
    productId: record.referenceId,
    mode: 'Dropship',
    onHand,
    reserved,
    available: Math.max(0, onHand - reserved),
    reorderPoint: record.reorderPoint,
    lowStock: false,
    lastMovementAt,
    availabilityStatus: resolveAvailabilityStatus(defaultSupplier),
    linkedSupplierName: defaultSupplier?.supplier.name,
    leadTimeLabel: defaultSupplier?.supplier.leadTimeLabel ?? undefined,
    procurementTrigger: 'Quote Paid',
  };
}

function buildAssetSummary(asset: ProductRecord['assets'][number]): InventoryProductDetail['media'][number] {
  const storage = asset as ProductRecord['assets'][number] & AssetStorageRecord;
  return {
    id: asset.assetKey,
    name: asset.name,
    type: assetTypeLabels[asset.assetType],
    role: assetRoleLabels[asset.usageRoles[0] ?? 'GALLERY_EXTRA'] as InventoryAssetRole,
    source: assetSourceLabels[asset.assetSource],
    protectionLevel: assetProtectionLabels[asset.protectionLevel],
    size: asset.sizeLabel,
    status: assetStatusLabels[asset.approvalStatus],
    usage: asset.usageRoles.map((role) => humanizeRole(role)),
    img: asset.imageUrl,
    parentId: asset.parentAssetId ?? undefined,
    productId: asset.primaryProductId ?? undefined,
    linkedProductIds: asset.links
      .filter((link) => link.linkType === 'PRODUCT' && link.productId)
      .map((link) => link.productId!)
      .filter(Boolean),
    linkedCampaignIds: asset.links
      .filter((link) => link.linkType === 'CAMPAIGN' && link.campaignKey)
      .map((link) => link.campaignKey!)
      .filter(Boolean),
    completeness: asset.completeness ?? undefined,
    is3DReady: asset.isThreeDReady,
    tags: asset.tags,
    workflowNode: asset.workflowNode ?? undefined,
    pipeline: asset.pipeline ? (asset.pipeline as InventoryProductDetail['media'][number]['pipeline']) : undefined,
    watermarkProfile: asset.watermarkProfile ?? undefined,
    backgroundTransparent: asset.backgroundTransparent ?? undefined,
    storage: {
      originalFilename: storage.originalFileName ?? undefined,
      storedFilename: storage.storedFileName ?? undefined,
      storagePath: storage.storagePath ?? undefined,
      mimeType: storage.mimeType ?? undefined,
      fileSizeBytes: storage.fileSizeBytes ?? undefined,
      sha256: storage.sha256 ?? undefined,
    },
  };
}

function deriveAssetStoragePayload(slot: {
  originalFilename?: string;
  name?: string;
  storedFilename?: string;
  storagePath?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  sha256?: string;
} | undefined | null) {
  return {
    originalFileName: slot?.originalFilename ?? slot?.name ?? null,
    storedFileName: slot?.storedFilename ?? null,
    storagePath: slot?.storagePath ?? null,
    mimeType: slot?.mimeType ?? null,
    fileSizeBytes: slot?.fileSizeBytes ?? null,
    sha256: slot?.sha256 ?? null,
  };
}

function parseSpecs(record: ProductRecord): Record<string, string> {
  const raw = (record.technicalSpecifications ?? {}) as Record<string, unknown>;
  const entries = Object.entries(raw).map(([key, value]) => [key, String(value)]);

  entries.push(['Length', `${record.lengthMm ?? 0}mm`]);
  entries.push(['Width', `${record.widthMm ?? 0}mm`]);
  entries.push(['Height', `${record.heightMm ?? 0}mm`]);
  entries.push(['Coverage Face', coverageOrientationLabels[record.coverageOrientation ?? 'LENGTH_X_HEIGHT']]);
  entries.push(['Face Area', `${toNumber(record.faceAreaM2).toFixed(4)}m²`]);
  entries.push(['Units / m²', `${toNumber(record.unitsPerM2).toFixed(2)}`]);
  entries.push(['Pricing Unit', pricingUnitLabels[record.pricingUnit]]);
  entries.push(['Pieces / Pallet', `${record.piecesPerPallet}`]);
  if ((record as any).boxesPerPallet) {
    entries.push(['Boxes / Pallet', `${(record as any).boxesPerPallet}`]);
  }
  entries.push(['Pallets / Truck', `${record.palletsPerTruck}`]);
  entries.push(['Weight', `${toNumber(record.weightKg).toFixed(2)}kg`]);
  for (const result of record.testResults) {
    entries.push([
      productTestResultTypeLabels[result.resultType],
      `${toNumber(result.resultValue).toFixed(result.resultUnit === '%' ? 1 : 2)} ${result.resultUnit}`.trim(),
    ]);
  }
  if (record.latestTestLaboratoryName) {
    entries.push(['Testing Laboratory', record.latestTestLaboratoryName]);
  }
  if (record.latestTestMethodStandard) {
    entries.push(['Test Standard', record.latestTestMethodStandard]);
  }
  if (record.latestTestReportReference) {
    entries.push(['Report Reference', record.latestTestReportReference]);
  }

  return Object.fromEntries(entries);
}

function buildTestResultSnapshots(record: ProductRecord): InventoryProductDetail['testResults'] {
  return record.testResults.map((result) => ({
    type: productTestResultTypeLabels[result.resultType],
    value: toNumber(result.resultValue),
    unit: result.resultUnit,
    notes: result.notes ?? undefined,
  }));
}

function buildMapsUrl(location: {
  streetAddress?: string | null;
  city: string;
  region: string;
  country: string;
  postalCode?: string | null;
}) {
  const query = [location.streetAddress, location.city, location.region, location.postalCode, location.country]
    .filter(Boolean)
    .join(', ');

  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

function createSignedVendorDocumentUrl(supplierKey: string, documentId: string) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
  const token = createSignedDocumentToken(documentId, expiresAt);
  return `/api/inventory/suppliers/${supplierKey}/documents/${documentId}/download?token=${encodeURIComponent(token)}`;
}

function createBusinessDocumentPdfUrl(documentKey: string) {
  return `/api/inventory/documents/${documentKey}/pdf`;
}

function buildBusinessDocumentSummary(record: BusinessDocumentRecord): BusinessDocumentSummary {
  const snapshot =
    record.snapshot && typeof record.snapshot === 'object' && !Array.isArray(record.snapshot)
      ? (record.snapshot as Record<string, unknown>)
      : null;

  return {
    id: record.id,
    key: record.documentKey,
    title: record.title,
    type: businessDocumentTypeLabels[record.documentType],
    status: businessDocumentStatusLabels[record.status],
    issuedAt: record.issuedAt.toISOString(),
    dueAt: record.dueAt?.toISOString() ?? null,
    totalAmount: toNumber(record.totalAmount),
    balanceAmount: record.balanceAmount !== null && record.balanceAmount !== undefined ? toNumber(record.balanceAmount) : null,
    currency: record.currency,
    customerName: record.customer?.name ?? null,
    supplierName: record.supplier?.name ?? null,
    productId: record.product?.referenceId ?? null,
    productName: record.product?.name ?? null,
    productSku: record.product?.publicSku ?? null,
    purchaseOrderKey: record.purchaseOrder?.orderKey ?? null,
    goodsReceiptKey: record.goodsReceipt?.receiptKey ?? null,
    parentDocumentKey: record.parentDocument?.documentKey ?? null,
    summary: typeof snapshot?.summary === 'string' ? snapshot.summary : null,
    pdfUrl: createBusinessDocumentPdfUrl(record.documentKey),
  };
}

function buildSupplierWorkflowMilestones(record: SupplierRecord): SupplierSummary['workflowMilestones'] {
  const hasOrigin = record.locations.length > 0;
  const hasContacts = record.vendorContacts.length > 0;
  const hasCommercialTerms = Boolean(
    record.commercialAccount?.paymentTerms ||
      record.commercialAccount?.deliveryTerms ||
      record.commercialAccount?.moq ||
      record.commercialAccount?.incoterms,
  );
  const dispatchContactExists = record.vendorContacts.some((contact) =>
    /dispatch|warehouse|logistics/i.test(`${contact.department} ${contact.roleTitle ?? ''}`),
  );
  const claimsContactExists = record.vendorContacts.some((contact) =>
    /claim|pod/i.test(`${contact.department} ${contact.roleTitle ?? ''}`),
  );

  return {
    onboarded: Boolean(record.name?.trim()) && hasOrigin && hasContacts && hasCommercialTerms,
    linkedToProducts: record.productSuppliers.length > 0,
    poIssued: record.businessDocuments.some((document) => document.documentType === 'PURCHASE_ORDER'),
    dispatchReady: hasOrigin && dispatchContactExists,
    claimsVerified:
      claimsContactExists ||
      record.documents.some((document) => ['TEST_RESULT', 'CERTIFICATION'].includes(document.documentType)),
  };
}

function buildSupplierOrders(record: SupplierRecord): SupplierSummary['orders'] {
  return record.businessDocuments
    .filter((document) => ['PURCHASE_ORDER', 'PROOF_OF_DELIVERY', 'DELIVERY_NOTE'].includes(document.documentType))
    .sort((left, right) => right.issuedAt.getTime() - left.issuedAt.getTime())
    .map((document) => ({
      id: document.documentKey,
      date: formatDate(document.issuedAt),
      status:
        document.status === 'DELIVERED'
          ? 'Delivered'
          : document.status === 'CANCELLED'
            ? 'Cancelled'
            : document.status === 'SENT'
              ? 'Sent'
              : document.status === 'CONFIRMED'
                ? 'Confirmed'
                : document.documentType === 'PURCHASE_ORDER'
                  ? 'Draft'
                  : 'Shipped',
      amount: toNumber(document.totalAmount),
      type: document.documentType === 'PURCHASE_ORDER' ? 'PO' : 'POD',
    }));
}

function buildSupplierHistory(record: SupplierRecord): SupplierSummary['history'] {
  return record.workflowEvents.map((event) => ({
    date: formatDate(event.occurredAt),
    action: event.eventType
      .split('_')
      .map((segment) => `${segment.charAt(0)}${segment.slice(1).toLowerCase()}`)
      .join(' '),
    user: event.actorLabel ?? 'Workflow Engine',
    details:
      event.payload && typeof event.payload === 'object'
        ? JSON.stringify(event.payload)
        : undefined,
  }));
}

function buildSupplierSummary(record: SupplierRecord): SupplierSummary {
  const commercialAccount = record.commercialAccount;
  const terms: SupplierSummary['terms'] = {
    payment: commercialAccount?.paymentTerms ?? 'TBD',
    delivery: commercialAccount?.deliveryTerms ?? 'TBD',
    moq: commercialAccount?.moq ?? 'TBD',
    currency: commercialAccount?.currency ?? record.defaultCurrency,
    incoterms: commercialAccount?.incoterms ?? 'TBD',
  };

  return {
    id: record.supplierKey,
    registeredName: record.registeredName ?? null,
    tradingName: record.tradingName ?? null,
    name: record.name,
    logo: record.logoUrl ?? '',
    status: supplierStatusLabels[record.status],
    type: supplierTypeLabels[record.supplierType],
    vendorRoles: record.vendorRoles.map((role) => supplierVendorRoleLabels[role]),
    capabilities: record.capabilities,
    region: record.regionLabel,
    leadTime: record.leadTimeLabel ?? 'TBD',
    productCount: record.productSuppliers.length,
    rating: toNumber(record.rating),
    blocker: record.blocker ?? undefined,
    defaultCurrency: record.defaultCurrency,
    vatRegistered: record.vatRegistered,
    vatNumber: record.vatNumber ?? null,
    providesProducts: record.providesProducts,
    providesTransport: record.providesTransport,
    notes: record.notes ?? null,
    locations: record.locations.map((location) => ({
      id: location.locationKey,
      label: location.label,
      type: locationTypeLabels[location.type],
      streetAddress: location.streetAddress ?? null,
      postalCode: location.postalCode ?? null,
      country: location.country,
      region: location.region,
      city: location.city,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      mapsUrl: buildMapsUrl(location),
    })),
    contacts:
      record.vendorContacts.length > 0
        ? record.vendorContacts.map((contact) => ({
            id: contact.id,
            department: contact.department,
            roleTitle: contact.roleTitle ?? undefined,
            name: contact.name,
            email: contact.email,
            phone: contact.phone ?? undefined,
            preferredChannel: preferredChannelLabels[contact.preferredChannel],
            notes: contact.notes ?? undefined,
            isPrimary: contact.isPrimary,
          }))
        : (((record.contacts as unknown as SupplierSummary['contacts'] | null) ?? []).map((contact, index) => ({
            ...contact,
            id: `${record.supplierKey}_contact_${index}`,
            isPrimary: index === 0,
          }))),
    documents: record.documents.map((document) => ({
      id: document.id,
      name: document.name,
      type: vendorDocumentTypeLabels[document.documentType],
      mimeType: document.mimeType ?? null,
      fileSizeBytes: document.fileSizeBytes ?? null,
      uploadedBy: document.uploadedBy ?? null,
      uploadedAt: document.createdAt.toISOString(),
      downloadUrl: createSignedVendorDocumentUrl(record.supplierKey, document.id),
    })),
    terms,
    commercialAccount: {
      paymentTerms: commercialAccount?.paymentTerms ?? null,
      deliveryTerms: commercialAccount?.deliveryTerms ?? null,
      minimumOrderValueZar: commercialAccount ? toNumber(commercialAccount.minimumOrderValueZar) : null,
      standardDiscountPct: commercialAccount ? toNumber(commercialAccount.standardDiscountPct) : null,
      moq: commercialAccount?.moq ?? null,
      currency: commercialAccount?.currency ?? record.defaultCurrency,
      incoterms: commercialAccount?.incoterms ?? null,
      creditLimitZar: commercialAccount ? toNumber(commercialAccount.creditLimitZar) : null,
      currentCreditBalanceZar: commercialAccount ? toNumber(commercialAccount.currentCreditBalanceZar) : 0,
      vatRegistered: commercialAccount?.vatRegistered ?? record.vatRegistered,
      vatNumber: commercialAccount?.vatNumber ?? record.vatNumber ?? null,
      standardVatRatePct: commercialAccount ? toNumber(commercialAccount.standardVatRatePct) : 15,
    },
    performance: {
      onTimeDelivery: 0,
      qualityScore: record.documents.some((document) => document.documentType === 'TEST_RESULT') ? 100 : 0,
      returnRate: 0,
      priceCompetitiveness: 0,
    },
    workflowMilestones: buildSupplierWorkflowMilestones(record),
    orders: buildSupplierOrders(record),
    history: buildSupplierHistory(record),
    documentHistory: record.businessDocuments.map((document) => buildBusinessDocumentSummary(document)),
    portalUsers: record.vendorUsers.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roleLabel: user.roleLabel,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    })),
  };
}

function buildReadiness(record: ProductRecord, stockPosition: StockPosition): ReadinessSnapshot {
  const assets = record.assets;
  const hasPrimaryImage = Boolean(record.primaryImageUrl);
  const hasGalleryImage = Boolean(record.galleryImageUrl);
  const hasFaceImage = Boolean(record.faceImageUrl);
  const hasHeroImage = Boolean(record.heroImageUrl ?? record.primaryImageUrl);
  const hasCalculatorData = Boolean(
    record.lengthMm &&
      record.widthMm &&
      record.heightMm &&
      record.weightKg &&
      record.faceAreaM2 &&
      record.unitsPerM2 &&
      record.coverageOrientation,
  );
  const hasSupplierLinkage = record.productSuppliers.length > 0;
  const hasPricing = toNumber(record.sellPriceZar) > 0 && toNumber(record.productSuppliers.find((link) => link.isDefault)?.unitCostZar ?? 0) > 0;
  const has2_5d = assets.some((asset) => asset.usageRoles.includes('ASSET_2_5D') && asset.approvalStatus === 'APPROVED');
  const has3d = assets.some((asset) => asset.usageRoles.includes('ASSET_3D') && asset.approvalStatus === 'APPROVED');
  const hasProjectImages = assets.some((asset) => asset.usageRoles.includes('PROJECT_IMAGE') && asset.approvalStatus === 'APPROVED');
  const hasGeneratedImages = assets.some((asset) => asset.usageRoles.includes('GENERATED_IMAGE') && ['APPROVED', 'REVIEW'].includes(asset.approvalStatus));
  const hasMarketingCopy = Boolean(record.marketingCopy?.trim());

  const assetSignals = [
    hasPrimaryImage,
    hasGalleryImage,
    hasFaceImage,
    hasHeroImage,
    hasProjectImages,
    hasGeneratedImages,
  ].filter(Boolean).length;

  const assetReadiness = Math.min(100, round((assetSignals / 6) * 100));
  const threedReadiness = (has2_5d ? 50 : 0) + (has3d ? 50 : 0);
  const marketingReadiness = Math.min(100, round(((hasHeroImage ? 25 : 0) + (hasProjectImages ? 25 : 0) + (hasGeneratedImages ? 20 : 0) + (hasMarketingCopy ? 15 : 0) + (hasPricing ? 15 : 0))));
  const publishReadiness = Math.min(
    100,
    round(
      (hasPrimaryImage ? 10 : 0) +
        (hasGalleryImage ? 10 : 0) +
        (hasFaceImage ? 10 : 0) +
        (hasCalculatorData ? 20 : 0) +
        (hasSupplierLinkage ? 15 : 0) +
        (hasPricing ? 15 : 0) +
        (hasHeroImage ? 10 : 0) +
        (has2_5d ? 5 : 0) +
        (has3d ? 5 : 0),
    ),
  );
  const catalogHealth = Math.min(100, round((assetReadiness * 0.3) + (threedReadiness * 0.2) + (marketingReadiness * 0.2) + (publishReadiness * 0.3)));

  const blockers = new Set<string>();
  if (!hasPrimaryImage) blockers.add('Missing primary image');
  if (!hasGalleryImage) blockers.add('Missing gallery image');
  if (!hasFaceImage) blockers.add('Missing face image');
  if (!hasCalculatorData) blockers.add('Missing calculator dimensions');
  if (!hasSupplierLinkage) blockers.add('Missing supplier linkage');
  if (!hasPricing) blockers.add('Missing sell price or unit cost');
  if (stockPosition.availabilityStatus === 'Supplier Delayed') blockers.add('Supplier delayed');
  if (stockPosition.availabilityStatus === 'Supplier Onboarding') blockers.add('Supplier onboarding');
  if (stockPosition.availabilityStatus === 'Missing Supplier') blockers.add('Supplier not linked');
  if (!has3d) blockers.add('Missing 3D asset');

  return {
    catalogHealth,
    assetReadiness,
    threedReadiness,
    marketingReadiness,
    publishReadiness,
    blockers: Array.from(blockers),
    checklist: {
      primaryImage: hasPrimaryImage,
      galleryImage: hasGalleryImage,
      faceImage: hasFaceImage,
      heroImage: hasHeroImage,
      calculatorData: hasCalculatorData,
      supplierLinkage: hasSupplierLinkage,
      pricing: hasPricing,
      asset2_5d: has2_5d,
      asset3d: has3d,
    },
  };
}

function buildProductSummary(record: ProductRecord): InventoryProductSummary {
  const stockPosition = buildStockPosition(record);
  const defaultSupplier = record.productSuppliers.find((link) => link.isDefault) ?? record.productSuppliers[0];
  const costPriceZar = toNumber(defaultSupplier?.unitCostZar);
  const sellPriceZar = toNumber(record.sellPriceZar);
  const marginPercent = sellPriceZar > 0 ? round(((sellPriceZar - costPriceZar) / sellPriceZar) * 100, 1) : 0;
  const readiness = buildReadiness(record, stockPosition);

  return {
    id: record.referenceId,
    recordId: record.id,
    publicSku: record.publicSku,
    name: record.name,
    category: categoryLabels[record.category],
    productType: productTypeLabels[record.productType] as InventoryProductType,
    finish: record.finish ? finishLabels[record.finish] : null,
    collection: record.collectionName ?? null,
    status: lifecycleStatusLabels[record.lifecycleStatus],
    publishStatus: publishStatusLabels[record.publishStatus],
    stockPosition,
    sellPriceZar,
    costPriceZar,
    marginPercent,
    pricingUnit: pricingUnitLabels[record.pricingUnit] as InventoryPricingUnit,
    primaryImageUrl: record.primaryImageUrl ?? record.galleryImageUrl ?? record.faceImageUrl ?? PLACEHOLDER_IMAGE,
    readiness,
    supplierCount: record.productSuppliers.length,
    tags: record.presentationTags,
  };
}

function buildDistributionChannels(record: ProductRecord): InventoryProductDetail['distributionChannels'] {
  const internalStorefrontStatus =
    record.publishStatus === 'PUBLISHED'
      ? 'Live'
      : record.publishStatus === 'READY'
        ? 'Queued'
        : 'Not Posted';

  const internalStorefront: InventoryProductDetail['distributionChannels'][number] = {
    channel: 'Internal Storefront',
    type: 'Storefront',
    connectionStatus: 'Connected',
    publicationStatus: internalStorefrontStatus,
    syncMode: 'Manual',
    isInternal: true,
    externalCatalogId: 'bts-storefront',
    externalListingId: record.publicSku,
    externalUrl: record.publishStatus === 'PUBLISHED' ? `/products/${record.publicSku}` : undefined,
    lastSyncedAt: record.updatedAt.toISOString(),
    lastSyncError: null,
  };

  const externalChannels = record.distributionPublications.map((publication) => ({
    channel: distributionChannelLabels[publication.channel],
    type: distributionChannelTypeLabels[publication.channelType],
    connectionStatus: distributionConnectionStatusLabels[publication.connectionStatus],
    publicationStatus: distributionPublicationStatusLabels[publication.publicationStatus],
    syncMode: distributionSyncModeLabels[publication.syncMode],
    isInternal: false,
    externalCatalogId: publication.externalCatalogId ?? undefined,
    externalListingId: publication.externalListingId ?? undefined,
    externalUrl: publication.externalUrl ?? undefined,
    lastSyncedAt: publication.lastSyncedAt?.toISOString() ?? null,
    lastSyncError: publication.lastSyncError ?? null,
  }));

  return [internalStorefront, ...externalChannels];
}

function buildProductDetail(record: ProductRecord): InventoryProductDetail {
  const summary = buildProductSummary(record);
  const defaultSupplier = record.productSuppliers.find((link) => link.isDefault) ?? record.productSuppliers[0];
  const packaging = computePackagingMetrics({
    category: summary.category,
    piecesPerPallet: Number((record as any).piecesPerPallet ?? 1),
    boxesPerPallet: Number((record as any).boxesPerPallet ?? 0),
    palletsPerTruck: Number((record as any).palletsPerTruck ?? 24),
    unitsPerM2: record.unitsPerM2,
    weightKg: record.weightKg,
  });
  const rateCard = defaultSupplier
    ? defaultSupplier.supplier.rateCards.find((card) => card.originLocationId === defaultSupplier.originLocationId) ??
      defaultSupplier.supplier.rateCards[0]
    : undefined;

  return {
    ...summary,
    description: record.description,
    marketingCopy: record.marketingCopy ?? '',
    specifications: parseSpecs(record),
    dimensions: {
      lengthMm: record.lengthMm ?? 0,
      widthMm: record.widthMm ?? 0,
      heightMm: record.heightMm ?? 0,
      weightKg: toNumber(record.weightKg),
      coverageOrientation: coverageOrientationLabels[record.coverageOrientation ?? 'LENGTH_X_HEIGHT'],
      faceAreaM2: toNumber(record.faceAreaM2),
      unitsPerM2: toNumber(record.unitsPerM2),
    },
    packaging,
    testResults: buildTestResultSnapshots(record),
    latestTestReport: {
      url: record.latestTestReportUrl ?? null,
      name: record.latestTestReportName ?? null,
      laboratoryName: record.latestTestLaboratoryName ?? null,
      methodStandard: record.latestTestMethodStandard ?? null,
      reportReference: record.latestTestReportReference ?? null,
      testedAt: record.latestTestedAt?.toISOString() ?? null,
      issuedAt: record.latestTestIssuedAt?.toISOString() ?? null,
    },
    requiredMedia: {
      primaryImageUrl: record.primaryImageUrl,
      galleryImageUrl: record.galleryImageUrl,
      faceImageUrl: record.faceImageUrl,
      heroImageUrl: record.heroImageUrl ?? record.primaryImageUrl,
    },
    media: record.assets.map((asset) => buildAssetSummary(asset)),
    suppliers: record.productSuppliers.map((link) => buildSupplierSummary(link.supplier)),
    history: record.historyEvents.map((event) => ({
      id: event.id,
      date: formatDate(event.occurredAt),
      action: event.actionLabel,
      user: event.userName,
      details: event.details ?? undefined,
    })),
    documentHistory: record.businessDocuments.map((document) => buildBusinessDocumentSummary(document)),
    pricing: {
      unit: summary.pricingUnit,
      sellPriceZar: summary.sellPriceZar,
      costPriceZar: summary.costPriceZar,
      marginPercent: summary.marginPercent,
      currency: 'ZAR',
    },
    logistics: {
      defaultSupplierId: defaultSupplier?.supplier.supplierKey,
      defaultSupplierName: defaultSupplier?.supplier.name,
      defaultOriginLocation: defaultSupplier?.originLocation.label,
      defaultOriginRegion: defaultSupplier?.originLocation.region,
      defaultOriginCity: defaultSupplier?.originLocation.city,
      costPricePerKm: rateCard ? toNumber(rateCard.costPerKm) : undefined,
      sellPricePerKm: rateCard ? toNumber(rateCard.sellPricePerKm) : undefined,
      fixedFee: rateCard ? toNumber(rateCard.fixedFee) : undefined,
      minimumCharge: rateCard ? toNumber(rateCard.minimumCharge) : undefined,
      currency: 'ZAR',
    },
    distributionChannels: buildDistributionChannels(record),
  };
}

function generateReferenceIdFromSku(publicSku: string) {
  let hash = 0;
  for (const character of publicSku) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1000;
  }
  return `PRD_${String(hash).padStart(3, '0')}`;
}

function validateCreatePayload(input: CreateInventoryProductInput) {
  const category = normalizeCategory(input.category);
  const productType = normalizeProductType(category, input.productType);
  const finish = normalizeFinish(category, input.finish);
  const pricingUnit = normalizePricingUnit(category, input.pricingUnit);
  const coverageOrientation = normalizeCoverageOrientation(input.dimensions.coverageOrientation, category);
  const categoryDefaults = quoteDefaultsByCategory[category];

  ensurePositiveNumber(input.unitCostZar, 'Unit cost (ZAR)');
  ensurePositiveNumber(input.dimensions.lengthMm, 'Length');
  ensurePositiveNumber(input.dimensions.widthMm, 'Width');
  ensurePositiveNumber(input.dimensions.heightMm, 'Height');
  ensurePositiveNumber(input.dimensions.weightKg, 'Weight');
  ensurePositiveNumber(input.packaging.piecesPerPallet || categoryDefaults.piecesPerPallet, 'Pieces per pallet');
  ensurePositiveNumber(input.packaging.palletsPerTruck || categoryDefaults.palletsPerTruck, 'Pallets per truck');
  if (category === 'Cladding') {
    ensurePositiveNumber(input.packaging.boxesPerPallet || categoryDefaults.boxesPerPallet, 'Boxes per pallet');
  }

  if (!input.name.trim()) {
    throw new Error('Product name is required.');
  }
  if (!input.publicSku.trim()) {
    throw new Error('Public SKU is required.');
  }
  if (!input.description.trim()) {
    throw new Error('Description is required.');
  }
  if (!input.linkedSupplierId.trim()) {
    throw new Error('Linked supplier is required.');
  }
  if (!input.primaryImage.url.trim() || !input.galleryImage.url.trim() || !input.faceImage.url.trim()) {
    throw new Error('Primary, gallery, and face images are required.');
  }

  return {
    category,
    productType,
    finish,
    pricingUnit,
    coverageOrientation,
    categoryDefaults,
  };
}

async function createProductAssets(
  tx: Prisma.TransactionClient,
  productId: string,
  input: {
    primaryImage: AssetSlotInput;
    galleryImage: AssetSlotInput;
    faceImage: AssetSlotInput;
    heroImage?: AssetSlotInput;
    asset2_5d?: AssetSlotInput;
    asset3d?: AssetSlotInput;
    projectImages?: AssetSlotInput[];
    generatedImages?: AssetSlotInput[];
    galleryImages?: AssetSlotInput[];
  },
) {
  async function assignExistingAssetToProductSlot(
    slot: AssetSlotInput,
    role: InventoryAssetRole,
    protection: keyof typeof assetProtectionKeys,
  ) {
    if (!slot.assetId) {
      return false;
    }

    const existingAsset = await tx.productAsset.findUnique({
      where: { id: slot.assetId },
      include: {
        links: true,
      },
    });

    if (!existingAsset) {
      return false;
    }

    const normalizedUsageRoles = [
      assetRoleKeys[role],
      ...existingAsset.usageRoles.filter((usageRole) => usageRole !== assetRoleKeys[role]),
    ];
    const normalizedTags = Array.from(new Set([role, ...existingAsset.tags]));

    if (existingAsset.primaryProductId && existingAsset.primaryProductId !== productId) {
      const clonedAsset = await tx.productAsset.create({
        data: {
          assetKey: `AST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          primaryProductId: productId,
          name: slot.name?.trim() || existingAsset.name,
          assetType: existingAsset.assetType,
          assetSource: existingAsset.assetSource,
          protectionLevel: existingAsset.protectionLevel ?? assetProtectionKeys[protection],
          approvalStatus: existingAsset.approvalStatus,
          sizeLabel: existingAsset.sizeLabel,
          imageUrl: existingAsset.imageUrl,
          originalFileName: existingAsset.originalFileName,
          storedFileName: existingAsset.storedFileName,
          storagePath: existingAsset.storagePath,
          mimeType: existingAsset.mimeType,
          fileSizeBytes: existingAsset.fileSizeBytes,
          sha256: existingAsset.sha256,
          usageRoles: normalizedUsageRoles,
          parentAssetId: existingAsset.parentAssetId ?? existingAsset.id,
          completeness: existingAsset.completeness,
          isThreeDReady: existingAsset.isThreeDReady || role === 'asset_2_5d' || role === 'asset_3d',
          watermarkProfile: existingAsset.watermarkProfile,
          backgroundTransparent: existingAsset.backgroundTransparent,
          workflowNode: 'inventory.asset_assigned',
          pipeline: existingAsset.pipeline ?? undefined,
          tags: normalizedTags,
        } as Prisma.ProductAssetUncheckedCreateInput,
      });

      await tx.assetLink.create({
        data: {
          assetId: clonedAsset.id,
          linkType: 'PRODUCT',
          productId,
        },
      });

      return true;
    }

    await tx.productAsset.update({
      where: { id: existingAsset.id },
      data: {
        primaryProductId: productId,
        name: slot.name?.trim() || existingAsset.name,
        usageRoles: normalizedUsageRoles,
        isThreeDReady: existingAsset.isThreeDReady || role === 'asset_2_5d' || role === 'asset_3d',
        workflowNode: 'inventory.asset_assigned',
        tags: normalizedTags,
      },
    });

    const hasProductLink = existingAsset.links.some((link) => link.linkType === 'PRODUCT' && link.productId === productId);
    if (!hasProductLink) {
      await tx.assetLink.create({
        data: {
          assetId: existingAsset.id,
          linkType: 'PRODUCT',
          productId,
        },
      });
    }

    return true;
  }

  const slots: Array<{ slot?: AssetSlotInput; role: InventoryAssetRole; type: keyof typeof assetTypeKeys; protection: keyof typeof assetProtectionKeys; approved?: boolean }> = [
    { slot: input.primaryImage, role: 'primary_image', type: 'Image', protection: 'Protected Original', approved: true },
    { slot: input.galleryImage, role: 'gallery_image', type: 'Image', protection: 'Managed Variant', approved: true },
    { slot: input.faceImage, role: 'face_image', type: 'Image', protection: 'Managed Variant', approved: true },
    { slot: input.heroImage, role: 'hero_image', type: 'Image', protection: 'Publishable Variant', approved: true },
    { slot: input.asset2_5d, role: 'asset_2_5d', type: '2.5D Asset', protection: 'Managed Variant', approved: false },
    { slot: input.asset3d, role: 'asset_3d', type: '3D Asset', protection: 'Protected Original', approved: false },
  ];

  for (const item of slots) {
    if (!item.slot?.url.trim()) continue;

    if (await assignExistingAssetToProductSlot(item.slot, item.role, item.protection)) {
      continue;
    }

    const asset = await tx.productAsset.create({
      data: {
        assetKey: `AST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        primaryProductId: productId,
        name: item.slot.name?.trim() || item.role.replace(/_/g, ' '),
        assetType: assetTypeKeys[item.type],
        assetSource: assetSourceKeys[normalizeAssetSource(item.slot.source)],
        protectionLevel: assetProtectionKeys[item.protection],
        approvalStatus: item.approved ? 'APPROVED' : 'REVIEW',
        sizeLabel: 'Pending',
        imageUrl: item.slot.url,
        ...deriveAssetStoragePayload(item.slot),
        usageRoles: [assetRoleKeys[item.role]],
        isThreeDReady: item.role === 'asset_2_5d' || item.role === 'asset_3d',
        tags: [item.role],
      },
    });

    await tx.assetLink.create({
      data: {
        assetId: asset.id,
        linkType: 'PRODUCT',
        productId,
      },
    });
  }

  const multiAssetBatches: Array<{ slots: AssetSlotInput[] | undefined; role: InventoryAssetRole; sourceProtection: keyof typeof assetProtectionKeys }> = [
    { slots: input.projectImages, role: 'project_image', sourceProtection: 'Publishable Variant' },
    { slots: input.generatedImages, role: 'generated_image', sourceProtection: 'Publishable Variant' },
    { slots: input.galleryImages, role: 'gallery_extra', sourceProtection: 'Managed Variant' },
  ];

  for (const batch of multiAssetBatches) {
    for (const slot of batch.slots ?? []) {
      if (!slot.url.trim()) continue;

      if (await assignExistingAssetToProductSlot(slot, batch.role, batch.sourceProtection)) {
        continue;
      }

      const asset = await tx.productAsset.create({
        data: {
          assetKey: `AST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          primaryProductId: productId,
          name: slot.name?.trim() || batch.role.replace(/_/g, ' '),
          assetType: 'IMAGE',
          assetSource: assetSourceKeys[normalizeAssetSource(slot.source)],
          protectionLevel: assetProtectionKeys[batch.sourceProtection],
          approvalStatus: batch.role === 'generated_image' ? 'REVIEW' : 'APPROVED',
          sizeLabel: 'Pending',
          imageUrl: slot.url,
          ...deriveAssetStoragePayload(slot),
          usageRoles: [assetRoleKeys[batch.role]],
          tags: [batch.role],
        },
      });

      await tx.assetLink.create({
        data: {
          assetId: asset.id,
          linkType: 'PRODUCT',
          productId,
        },
      });
    }
  }
}

async function syncProductAssets(
  tx: Prisma.TransactionClient,
  productId: string,
  input: Partial<{
    primaryImage: AssetSlotInput | null;
    galleryImage: AssetSlotInput | null;
    faceImage: AssetSlotInput | null;
    heroImage: AssetSlotInput | null;
    asset2_5d: AssetSlotInput | null;
    asset3d: AssetSlotInput | null;
    projectImages: AssetSlotInput[];
    generatedImages: AssetSlotInput[];
    galleryImages: AssetSlotInput[];
  }>,
) {
  async function assignExistingAssetToProductSlot(
    slot: AssetSlotInput,
    role: InventoryAssetRole,
    protection: keyof typeof assetProtectionKeys,
  ) {
    if (!slot.assetId) {
      return false;
    }

    const existingAsset = await tx.productAsset.findUnique({
      where: { id: slot.assetId },
      include: {
        links: true,
      },
    });

    if (!existingAsset) {
      return false;
    }

    const normalizedUsageRoles = [
      assetRoleKeys[role],
      ...existingAsset.usageRoles.filter((usageRole) => usageRole !== assetRoleKeys[role]),
    ];
    const normalizedTags = Array.from(new Set([role, ...existingAsset.tags]));

    if (existingAsset.primaryProductId && existingAsset.primaryProductId !== productId) {
      const clonedAsset = await tx.productAsset.create({
        data: {
          assetKey: `AST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          primaryProductId: productId,
          name: slot.name?.trim() || existingAsset.name,
          assetType: existingAsset.assetType,
          assetSource: existingAsset.assetSource,
          protectionLevel: existingAsset.protectionLevel ?? assetProtectionKeys[protection],
          approvalStatus: existingAsset.approvalStatus,
          sizeLabel: existingAsset.sizeLabel,
          imageUrl: existingAsset.imageUrl,
          originalFileName: existingAsset.originalFileName,
          storedFileName: existingAsset.storedFileName,
          storagePath: existingAsset.storagePath,
          mimeType: existingAsset.mimeType,
          fileSizeBytes: existingAsset.fileSizeBytes,
          sha256: existingAsset.sha256,
          usageRoles: normalizedUsageRoles,
          parentAssetId: existingAsset.parentAssetId ?? existingAsset.id,
          completeness: existingAsset.completeness,
          isThreeDReady: existingAsset.isThreeDReady || role === 'asset_2_5d' || role === 'asset_3d',
          watermarkProfile: existingAsset.watermarkProfile,
          backgroundTransparent: existingAsset.backgroundTransparent,
          workflowNode: 'inventory.asset_assigned',
          pipeline: existingAsset.pipeline ?? undefined,
          tags: normalizedTags,
        } as Prisma.ProductAssetUncheckedCreateInput,
      });

      await tx.assetLink.create({
        data: {
          assetId: clonedAsset.id,
          linkType: 'PRODUCT',
          productId,
        },
      });

      return true;
    }

    await tx.productAsset.update({
      where: { id: existingAsset.id },
      data: {
        primaryProductId: productId,
        name: slot.name?.trim() || existingAsset.name,
        usageRoles: normalizedUsageRoles,
        isThreeDReady: existingAsset.isThreeDReady || role === 'asset_2_5d' || role === 'asset_3d',
        workflowNode: 'inventory.asset_assigned',
        tags: normalizedTags,
      },
    });

    const hasProductLink = existingAsset.links.some((link) => link.linkType === 'PRODUCT' && link.productId === productId);
    if (!hasProductLink) {
      await tx.assetLink.create({
        data: {
          assetId: existingAsset.id,
          linkType: 'PRODUCT',
          productId,
        },
      });
    }

    return true;
  }

  const existingAssets = await tx.productAsset.findMany({
    where: { primaryProductId: productId },
    select: {
      imageUrl: true,
      usageRoles: true,
    },
  });

  const assetExists = (url: string, role: keyof typeof assetRoleKeys) =>
    existingAssets.some((asset) => asset.imageUrl === url && asset.usageRoles.includes(assetRoleKeys[role]));

  const singleSlots: Array<{
    key: keyof typeof input;
    role: InventoryAssetRole;
    type: keyof typeof assetTypeKeys;
    protection: keyof typeof assetProtectionKeys;
    approved?: boolean;
  }> = [
    { key: 'primaryImage', role: 'primary_image', type: 'Image', protection: 'Protected Original', approved: true },
    { key: 'galleryImage', role: 'gallery_image', type: 'Image', protection: 'Managed Variant', approved: true },
    { key: 'faceImage', role: 'face_image', type: 'Image', protection: 'Managed Variant', approved: true },
    { key: 'heroImage', role: 'hero_image', type: 'Image', protection: 'Publishable Variant', approved: true },
    { key: 'asset2_5d', role: 'asset_2_5d', type: '2.5D Asset', protection: 'Managed Variant', approved: false },
    { key: 'asset3d', role: 'asset_3d', type: '3D Asset', protection: 'Protected Original', approved: false },
  ];

  for (const slotConfig of singleSlots) {
    const slot = input[slotConfig.key] as AssetSlotInput | null | undefined;
    if (!slot?.url?.trim()) {
      continue;
    }

    if (await assignExistingAssetToProductSlot(slot, slotConfig.role, slotConfig.protection)) {
      continue;
    }

    if (assetExists(slot.url, slotConfig.role)) {
      continue;
    }

    const asset = await tx.productAsset.create({
      data: {
        assetKey: `AST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        primaryProductId: productId,
        name: slot.name?.trim() || slotConfig.role.replace(/_/g, ' '),
        assetType: assetTypeKeys[slotConfig.type],
        assetSource: assetSourceKeys[normalizeAssetSource(slot.source)],
        protectionLevel: assetProtectionKeys[slotConfig.protection],
        approvalStatus: slotConfig.approved ? 'APPROVED' : 'REVIEW',
        sizeLabel: 'Pending',
        imageUrl: slot.url,
        ...deriveAssetStoragePayload(slot),
        usageRoles: [assetRoleKeys[slotConfig.role]],
        isThreeDReady: slotConfig.role === 'asset_2_5d' || slotConfig.role === 'asset_3d',
        tags: [slotConfig.role],
      },
    });

    await tx.assetLink.create({
      data: {
        assetId: asset.id,
        linkType: 'PRODUCT',
        productId,
      },
    });
  }

  const batches: Array<{
    key: keyof typeof input;
    role: InventoryAssetRole;
    protection: keyof typeof assetProtectionKeys;
    approved: 'APPROVED' | 'REVIEW';
  }> = [
    { key: 'projectImages', role: 'project_image', protection: 'Publishable Variant', approved: 'APPROVED' },
    { key: 'generatedImages', role: 'generated_image', protection: 'Publishable Variant', approved: 'REVIEW' },
    { key: 'galleryImages', role: 'gallery_extra', protection: 'Managed Variant', approved: 'APPROVED' },
  ];

  for (const batch of batches) {
    const slots = (input[batch.key] as AssetSlotInput[] | undefined) ?? [];
    for (const slot of slots) {
      if (!slot.url.trim()) {
        continue;
      }

      if (await assignExistingAssetToProductSlot(slot, batch.role, batch.protection)) {
        continue;
      }

      if (assetExists(slot.url, batch.role)) {
        continue;
      }

      const asset = await tx.productAsset.create({
        data: {
          assetKey: `AST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          primaryProductId: productId,
          name: slot.name?.trim() || batch.role.replace(/_/g, ' '),
          assetType: 'IMAGE',
          assetSource: assetSourceKeys[normalizeAssetSource(slot.source)],
          protectionLevel: assetProtectionKeys[batch.protection],
          approvalStatus: batch.approved,
          sizeLabel: 'Pending',
          imageUrl: slot.url,
          ...deriveAssetStoragePayload(slot),
          usageRoles: [assetRoleKeys[batch.role]],
          tags: [batch.role],
        },
      });

      await tx.assetLink.create({
        data: {
          assetId: asset.id,
          linkType: 'PRODUCT',
          productId,
        },
      });
    }
  }
}

export async function listInventoryProducts() {
  const records = await prisma.product.findMany({
    ...productDetailArgs,
    orderBy: { name: 'asc' },
  });

  return records.map((record) => buildProductSummary(record));
}

export async function listInventoryProductDetails() {
  const records = await prisma.product.findMany({
    ...productDetailArgs,
    orderBy: { name: 'asc' },
  });

  return records.map((record) => buildProductDetail(record));
}

export async function getInventoryProduct(referenceId: string) {
  const record = await prisma.product.findUnique({
    where: { referenceId },
    ...productDetailArgs,
  });

  if (!record) {
    throw new Error(`Product ${referenceId} was not found.`);
  }

  return buildProductDetail(record);
}

export async function listInventorySuppliers() {
  const records = await prisma.supplier.findMany({
    ...supplierDetailArgs,
    orderBy: { name: 'asc' },
  });

  return records.map((record) => buildSupplierSummary(record));
}

export async function getInventorySupplier(referenceId: string) {
  const record = await prisma.supplier.findUnique({
    where: { supplierKey: referenceId },
    ...supplierDetailArgs,
  });

  if (!record) {
    throw new Error(`Supplier ${referenceId} was not found.`);
  }

  return buildSupplierSummary(record);
}

export async function getInventoryCustomerDocumentHistory(customerKey: string): Promise<CustomerDocumentHistory> {
  const record: CustomerDocumentRecord | null = await prisma.customerProfile.findUnique({
    where: { customerKey },
    ...customerDocumentHistoryArgs,
  });

  if (!record) {
    throw new Error(`Customer ${customerKey} was not found.`);
  }

  return {
    id: record.customerKey,
    name: record.name,
    type: record.customerType ?? null,
    stage: record.stage ?? null,
    email: record.email ?? null,
    phone: record.phone ?? null,
    documents: record.documents.map((document) => buildBusinessDocumentSummary(document)),
  };
}

export async function getInventoryBusinessDocument(documentKey: string) {
  const record = await prisma.businessDocument.findUnique({
    where: { documentKey },
    ...businessDocumentArgs,
  });

  if (!record) {
    throw new Error(`Business document ${documentKey} was not found.`);
  }

  return {
    summary: buildBusinessDocumentSummary(record),
    snapshot:
      record.snapshot && typeof record.snapshot === 'object' && !Array.isArray(record.snapshot)
        ? (record.snapshot as Record<string, unknown>)
        : {},
  };
}

async function buildCustomerWorkflowProgressResult(
  customerKey: string,
  primaryDocumentId: string,
  relatedDocumentIds: string[] = [],
): Promise<CustomerWorkflowProgressResult> {
  const [customer, documents] = await Promise.all([
    getInventoryCustomerDocumentHistory(customerKey),
    prisma.businessDocument.findMany({
      where: {
        id: {
          in: [primaryDocumentId, ...relatedDocumentIds],
        },
      },
      ...businessDocumentArgs,
    }),
  ]);

  const documentMap = new Map(documents.map((document) => [document.id, buildBusinessDocumentSummary(document)]));
  const primaryDocument = documentMap.get(primaryDocumentId);
  if (!primaryDocument) {
    throw new Error('Workflow document could not be resolved.');
  }

  return {
    customer,
    primaryDocument,
    relatedDocuments: relatedDocumentIds
      .map((id) => documentMap.get(id))
      .filter((document): document is BusinessDocumentSummary => Boolean(document)),
  };
}

export async function createCustomerQuoteDocument(customerKey: string, input: CreateCustomerQuoteInput): Promise<CustomerWorkflowProgressResult> {
  const customer = await prisma.customerProfile.findUnique({
    where: { customerKey },
  });

  if (!customer) {
    throw new Error(`Customer ${customerKey} was not found.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const resolvedLineItems = await resolveWorkflowLineItems(tx, input.lineItems);
    const totalAmount = round(resolvedLineItems.reduce((sum, item) => sum + item.totalPriceZar, 0), 2);
    const quoteTitle = input.title?.trim() || `Customer Quote · ${customer.name}`;
    const summary = input.summary?.trim() || `Quoted ${resolvedLineItems.length} item${resolvedLineItems.length === 1 ? '' : 's'} for ${customer.name}.`;
    const issuedAt = new Date();
    const dueAt = input.dueAt ? new Date(input.dueAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const quoteKey = businessWorkflowKey('QT');
    const workflowId = `quote:${quoteKey}`;

    const document = await tx.businessDocument.create({
      data: {
        documentKey: quoteKey,
        documentType: 'CUSTOMER_QUOTE',
        status: 'ISSUED',
        title: quoteTitle,
        customerId: customer.id,
        productId: resolvedLineItems.length === 1 ? resolvedLineItems[0].product.id : null,
        issuedAt,
        dueAt,
        totalAmount,
        balanceAmount: totalAmount,
        currency: 'ZAR',
        snapshot: buildWorkflowSnapshot({
          summary,
          notes: input.notes,
          lineItems: resolvedLineItems,
          sourceConversationId: input.sourceConversationId,
          workflowId,
        }),
      },
    });

    await tx.customerProfile.update({
      where: { id: customer.id },
      data: {
        stage: 'Quote Sent',
      },
    });

    if (input.sourceConversationId) {
      await tx.commsConversation.update({
        where: { id: input.sourceConversationId },
        data: {
          category: 'QUOTE',
          priority: 'HIGH',
          customerId: customer.id,
          customerName: customer.name,
        },
      });
      await tx.commsAction.create({
        data: {
          actionKey: `CACT_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          conversationId: input.sourceConversationId,
          actionType: 'CONVERT_QUOTE',
          status: 'COMPLETED',
          label: `Quote ${document.documentKey} created from conversation`,
          actorLabel: 'Workflow Engine',
          payload: {
            documentKey: document.documentKey,
            customerKey,
          },
        },
      });
    }

    await enqueueDomainEvent(tx, {
      type: 'quote.issued',
      aggregateType: 'SYSTEM',
      aggregateId: document.id,
      productId: resolvedLineItems.length === 1 ? resolvedLineItems[0].product.id : undefined,
      payload: {
        customerKey,
        documentKey: document.documentKey,
        totalAmount,
      },
    });
    await recordWorkflowEvent({
      eventKey: `${workflowId}:quote.issued:${document.documentKey}`,
      workflowId,
      type: 'quote.issued',
      label: `Quote ${document.documentKey} issued for ${customer.name}.`,
      sourceModule: 'CRM',
      occurredAt: issuedAt,
      subject: {
        conversationId: input.sourceConversationId ?? null,
        customerKey,
        quoteId: document.documentKey,
        productId: resolvedLineItems.length === 1 ? resolvedLineItems[0].product.referenceId : null,
      },
      amountZar: totalAmount,
      statusFrom: null,
      statusTo: 'ISSUED',
      sourceRecordId: document.documentKey,
      payload: {
        lineCount: resolvedLineItems.length,
      },
    }, tx);

    return {
      primaryDocumentId: document.id,
      relatedDocumentIds: [] as string[],
    };
  });

  return buildCustomerWorkflowProgressResult(customerKey, result.primaryDocumentId, result.relatedDocumentIds);
}

export async function markCustomerQuotePaid(documentKey: string): Promise<CustomerWorkflowProgressResult> {
  const quoteDocument = await prisma.businessDocument.findUnique({
    where: { documentKey },
    include: {
      customer: true,
      childDocuments: true,
    },
  });

  if (!quoteDocument || quoteDocument.documentType !== 'CUSTOMER_QUOTE') {
    throw new Error(`Customer quote ${documentKey} was not found.`);
  }
  if (!quoteDocument.customer) {
    throw new Error('This quote is not linked to a customer profile.');
  }

  const snapshot =
    quoteDocument.snapshot && typeof quoteDocument.snapshot === 'object' && !Array.isArray(quoteDocument.snapshot)
      ? (quoteDocument.snapshot as Record<string, unknown>)
      : null;
  const quoteLineItems = Array.isArray(snapshot?.lineItems) ? snapshot.lineItems : [];
  if (quoteLineItems.length === 0) {
    throw new Error('This quote has no line items and cannot be converted.');
  }
  const workflowId = typeof snapshot?.workflowId === 'string' ? snapshot.workflowId : `quote:${quoteDocument.documentKey}`;
  const sourceConversationId = typeof snapshot?.sourceConversationId === 'string' ? snapshot.sourceConversationId : undefined;

  const workflowItems = await resolveWorkflowLineItems(prisma, quoteLineItems.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return [];
    }
    const record = item as Record<string, unknown>;
    return [{
      productId: String(record.productId ?? ''),
      quantity: Number(record.quantity ?? 0),
    }];
  }));

  const result = await prisma.$transaction(async (tx) => {
    await tx.businessDocument.update({
      where: { id: quoteDocument.id },
      data: {
        status: 'PAID',
        balanceAmount: 0,
      },
    });

    const orderTotal = round(workflowItems.reduce((sum, item) => sum + item.totalPriceZar, 0), 2);
    const orderDocument = await tx.businessDocument.create({
      data: {
        documentKey: businessWorkflowKey('SO'),
        documentType: 'CUSTOMER_ORDER',
        status: 'CONFIRMED',
        title: `Sales Order · ${quoteDocument.customer.name}`,
        customerId: quoteDocument.customer.id,
        productId: workflowItems.length === 1 ? workflowItems[0].product.id : null,
        parentDocumentId: quoteDocument.id,
        issuedAt: new Date(),
        totalAmount: orderTotal,
        balanceAmount: 0,
        currency: 'ZAR',
        snapshot: buildWorkflowSnapshot({
          summary: `Sales order confirmed from paid quote ${quoteDocument.documentKey}.`,
          notes: [`Paid quote ${quoteDocument.documentKey} converted into a sales order.`],
          lineItems: workflowItems,
          sourceConversationId,
          workflowId,
          linkedDocumentKeys: [quoteDocument.documentKey],
        }),
      },
    });
    await recordWorkflowEvent({
      eventKey: `${workflowId}:quote.paid:${quoteDocument.documentKey}`,
      workflowId,
      type: 'quote.paid',
      label: `Quote ${quoteDocument.documentKey} paid and accepted by ${quoteDocument.customer.name}.`,
      sourceModule: 'Finance',
      occurredAt: new Date(),
      subject: {
        conversationId: sourceConversationId ?? null,
        customerKey: quoteDocument.customer.customerKey,
        quoteId: quoteDocument.documentKey,
        salesOrderId: orderDocument.documentKey,
        productId: workflowItems.length === 1 ? workflowItems[0].product.referenceId : null,
      },
      amountZar: toNumber(quoteDocument.totalAmount),
      statusFrom: 'ISSUED',
      statusTo: 'PAID',
      sourceRecordId: quoteDocument.documentKey,
    }, tx);
    await recordWorkflowEvent({
      eventKey: `${workflowId}:sales_order.created:${orderDocument.documentKey}`,
      workflowId,
      type: 'sales_order.created',
      label: `Sales order ${orderDocument.documentKey} created from paid quote ${quoteDocument.documentKey}.`,
      sourceModule: 'Inventory',
      occurredAt: new Date(),
      subject: {
        conversationId: sourceConversationId ?? null,
        customerKey: quoteDocument.customer.customerKey,
        quoteId: quoteDocument.documentKey,
        salesOrderId: orderDocument.documentKey,
        productId: workflowItems.length === 1 ? workflowItems[0].product.referenceId : null,
      },
      amountZar: orderTotal,
      statusFrom: null,
      statusTo: 'CONFIRMED',
      sourceRecordId: orderDocument.documentKey,
    }, tx);

    const poGroups = new Map<string, WorkflowResolvedLineItem[]>();
    for (const item of workflowItems) {
      const key = item.supplierLink.id;
      const existing = poGroups.get(key) ?? [];
      existing.push(item);
      poGroups.set(key, existing);
    }

    const poDocumentIds: string[] = [];
    for (const groupItems of poGroups.values()) {
      const firstItem = groupItems[0];
      const totalCost = round(groupItems.reduce((sum, item) => sum + item.totalCostZar, 0), 2);
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          orderKey: businessWorkflowKey('PO'),
          supplierId: firstItem.supplierLink.supplierId,
          originLocationId: firstItem.supplierLink.originLocationId,
          status: 'SENT',
          currency: 'ZAR',
          triggerSource: 'QUOTE_PAID',
          triggerReference: quoteDocument.documentKey,
          orderedAt: new Date(),
          totalAmount: totalCost,
          lines: {
            create: groupItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitCostZar: item.unitCostZar,
              totalCostZar: item.totalCostZar,
            })),
          },
        },
      });

      const poDocument = await tx.businessDocument.create({
        data: {
          documentKey: purchaseOrder.orderKey,
          documentType: 'PURCHASE_ORDER',
          status: 'SENT',
          title: `Purchase Order · ${firstItem.supplierLink.supplier.name}`,
          supplierId: firstItem.supplierLink.supplierId,
          productId: groupItems.length === 1 ? firstItem.product.id : null,
          purchaseOrderId: purchaseOrder.id,
          parentDocumentId: orderDocument.id,
          issuedAt: new Date(),
          totalAmount: totalCost,
          balanceAmount: totalCost,
          currency: 'ZAR',
          snapshot: buildWorkflowSnapshot({
            summary: `Purchase order sent to ${firstItem.supplierLink.supplier.name} from paid quote ${quoteDocument.documentKey}.`,
            notes: [
              `Trigger source: ${quoteDocument.documentKey}`,
              `Origin: ${firstItem.supplierLink.originLocation.label}`,
            ],
            lineItems: groupItems,
            workflowId,
            linkedDocumentKeys: [quoteDocument.documentKey, orderDocument.documentKey],
          }),
        },
      });

      poDocumentIds.push(poDocument.id);

      await enqueueDomainEvent(tx, {
        type: 'purchase_order.created',
        aggregateType: 'PURCHASE_ORDER',
        aggregateId: purchaseOrder.id,
        supplierId: firstItem.supplierLink.supplierId,
        productId: groupItems.length === 1 ? firstItem.product.id : undefined,
        payload: {
          orderKey: purchaseOrder.orderKey,
          customerKey: quoteDocument.customer?.customerKey,
        },
      });
      await enqueueDomainEvent(tx, {
        type: 'purchase_order.sent',
        aggregateType: 'PURCHASE_ORDER',
        aggregateId: purchaseOrder.id,
        supplierId: firstItem.supplierLink.supplierId,
        payload: {
          orderKey: purchaseOrder.orderKey,
        },
      });
      await recordWorkflowEvent({
        eventKey: `${workflowId}:purchase_order.created:${poDocument.documentKey}`,
        workflowId,
        type: 'purchase_order.created',
        label: `Purchase order ${poDocument.documentKey} sent to ${firstItem.supplierLink.supplier.name}.`,
        sourceModule: 'Suppliers',
        occurredAt: new Date(),
        subject: {
          conversationId: sourceConversationId ?? null,
          customerKey: quoteDocument.customer.customerKey,
          quoteId: quoteDocument.documentKey,
          salesOrderId: orderDocument.documentKey,
          purchaseOrderId: poDocument.documentKey,
          supplierKey: firstItem.supplierLink.supplier.supplierKey,
          productId: groupItems.length === 1 ? firstItem.product.referenceId : null,
        },
        amountZar: totalCost,
        statusFrom: null,
        statusTo: 'SENT',
        sourceRecordId: poDocument.documentKey,
        payload: {
          supplierName: firstItem.supplierLink.supplier.name,
          lineCount: groupItems.length,
        },
      }, tx);
    }

    await tx.customerProfile.update({
      where: { id: quoteDocument.customer.id },
      data: {
        stage: 'Won',
      },
    });

    await enqueueDomainEvent(tx, {
      type: 'quote.paid',
      aggregateType: 'PAYMENT',
      aggregateId: quoteDocument.id,
      payload: {
        documentKey: quoteDocument.documentKey,
        customerKey: quoteDocument.customer.customerKey,
      },
    });

    return {
      primaryDocumentId: orderDocument.id,
      relatedDocumentIds: [quoteDocument.id, ...poDocumentIds],
    };
  });

  return buildCustomerWorkflowProgressResult(quoteDocument.customer.customerKey, result.primaryDocumentId, result.relatedDocumentIds);
}

export async function completeCustomerOrderWorkflow(documentKey: string, input: CompleteCustomerOrderInput = {}): Promise<CustomerWorkflowProgressResult> {
  const orderDocument = await prisma.businessDocument.findUnique({
    where: { documentKey },
    include: {
      customer: true,
    },
  });

  if (!orderDocument || orderDocument.documentType !== 'CUSTOMER_ORDER') {
    throw new Error(`Sales order ${documentKey} was not found.`);
  }
  if (!orderDocument.customer) {
    throw new Error('This sales order is not linked to a customer profile.');
  }

  const snapshot =
    orderDocument.snapshot && typeof orderDocument.snapshot === 'object' && !Array.isArray(orderDocument.snapshot)
      ? (orderDocument.snapshot as Record<string, unknown>)
      : null;
  const workflowId = typeof snapshot?.workflowId === 'string' ? snapshot.workflowId : `order:${orderDocument.documentKey}`;
  const sourceConversationId = typeof snapshot?.sourceConversationId === 'string' ? snapshot.sourceConversationId : undefined;
  const linkedDocumentKeys = Array.isArray(snapshot?.linkedDocumentKeys)
    ? snapshot.linkedDocumentKeys.filter((value): value is string => typeof value === 'string')
    : [];
  const workflowItems = await resolveWorkflowLineItems(prisma, (Array.isArray(snapshot?.lineItems) ? snapshot.lineItems : []).flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return [];
    }
    const record = item as Record<string, unknown>;
    return [{
      productId: String(record.productId ?? ''),
      quantity: Number(record.quantity ?? 0),
    }];
  }));
  if (workflowItems.length === 0) {
    throw new Error('This sales order has no line items and cannot be fulfilled.');
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.businessDocument.update({
      where: { id: orderDocument.id },
      data: {
        status: 'DELIVERED',
      },
    });

    const deliverySummary = `${input.fulfilmentMode ?? 'Delivery'} completed for ${orderDocument.customer?.name}.`;
    const deliveryNote = await tx.businessDocument.create({
      data: {
        documentKey: businessWorkflowKey('DN'),
        documentType: 'DELIVERY_NOTE',
        status: 'DELIVERED',
        title: `Delivery Note · ${orderDocument.customer.name}`,
        customerId: orderDocument.customer.id,
        productId: workflowItems.length === 1 ? workflowItems[0].product.id : null,
        parentDocumentId: orderDocument.id,
        issuedAt: new Date(),
        totalAmount: orderDocument.totalAmount,
        balanceAmount: 0,
        currency: 'ZAR',
        snapshot: buildWorkflowSnapshot({
          summary: deliverySummary,
          notes: [input.note?.trim() || 'Customer delivery confirmed.'],
          lineItems: workflowItems,
          fulfilmentMode: input.fulfilmentMode,
          sourceConversationId,
          workflowId,
          linkedDocumentKeys: [...linkedDocumentKeys, orderDocument.documentKey],
        }),
      },
    });

    const pod = await tx.businessDocument.create({
      data: {
        documentKey: businessWorkflowKey('POD'),
        documentType: 'PROOF_OF_DELIVERY',
        status: 'RECEIVED',
        title: `Proof of Delivery · ${orderDocument.customer.name}`,
        customerId: orderDocument.customer.id,
        productId: workflowItems.length === 1 ? workflowItems[0].product.id : null,
        parentDocumentId: deliveryNote.id,
        issuedAt: new Date(),
        totalAmount: orderDocument.totalAmount,
        balanceAmount: 0,
        currency: 'ZAR',
        snapshot: buildWorkflowSnapshot({
          summary: `Proof of delivery received for ${orderDocument.documentKey}.`,
          notes: [input.note?.trim() || 'Delivery accepted by customer.'],
          lineItems: workflowItems,
          fulfilmentMode: input.fulfilmentMode,
          sourceConversationId,
          workflowId,
          linkedDocumentKeys: [...linkedDocumentKeys, orderDocument.documentKey, deliveryNote.documentKey],
        }),
      },
    });

    const invoice = await tx.businessDocument.create({
      data: {
        documentKey: businessWorkflowKey('INV'),
        documentType: 'CUSTOMER_INVOICE',
        status: 'PAID',
        title: `Customer Invoice · ${orderDocument.customer.name}`,
        customerId: orderDocument.customer.id,
        productId: workflowItems.length === 1 ? workflowItems[0].product.id : null,
        parentDocumentId: orderDocument.id,
        issuedAt: new Date(),
        dueAt: new Date(),
        totalAmount: orderDocument.totalAmount,
        balanceAmount: 0,
        currency: 'ZAR',
        snapshot: buildWorkflowSnapshot({
          summary: `Invoice closed out from delivered sales order ${orderDocument.documentKey}.`,
          notes: ['Sale completed and invoice settled.'],
          lineItems: workflowItems,
          fulfilmentMode: input.fulfilmentMode,
          sourceConversationId,
          workflowId,
          linkedDocumentKeys: [...linkedDocumentKeys, orderDocument.documentKey, deliveryNote.documentKey, pod.documentKey],
        }),
      },
    });

    await tx.customerProfile.update({
      where: { id: orderDocument.customer.id },
      data: {
        stage: 'Won',
      },
    });

    await enqueueDomainEvent(tx, {
      type: 'delivery_note.created',
      aggregateType: 'SYSTEM',
      aggregateId: deliveryNote.id,
      productId: workflowItems.length === 1 ? workflowItems[0].product.id : undefined,
      payload: {
        customerKey: orderDocument.customer.customerKey,
        documentKey: deliveryNote.documentKey,
      },
    });
    await recordWorkflowEvent({
      eventKey: `${workflowId}:delivery.in_progress:${deliveryNote.documentKey}`,
      workflowId,
      type: 'delivery.in_progress',
      label: `${input.fulfilmentMode ?? 'Delivery'} completed for sales order ${orderDocument.documentKey}.`,
      sourceModule: 'Logistics',
      occurredAt: new Date(),
      subject: {
        conversationId: sourceConversationId ?? null,
        customerKey: orderDocument.customer.customerKey,
        salesOrderId: orderDocument.documentKey,
        logisticsId: deliveryNote.documentKey,
        productId: workflowItems.length === 1 ? workflowItems[0].product.referenceId : null,
      },
      amountZar: toNumber(orderDocument.totalAmount),
      statusFrom: 'CONFIRMED',
      statusTo: 'DELIVERED',
      sourceRecordId: deliveryNote.documentKey,
    }, tx);
    await recordWorkflowEvent({
      eventKey: `${workflowId}:pod.received:${pod.documentKey}`,
      workflowId,
      type: 'pod.received',
      label: `Proof of delivery ${pod.documentKey} received for ${orderDocument.customer.name}.`,
      sourceModule: 'Logistics',
      occurredAt: new Date(),
      subject: {
        conversationId: sourceConversationId ?? null,
        customerKey: orderDocument.customer.customerKey,
        salesOrderId: orderDocument.documentKey,
        logisticsId: deliveryNote.documentKey,
        productId: workflowItems.length === 1 ? workflowItems[0].product.referenceId : null,
      },
      amountZar: toNumber(orderDocument.totalAmount),
      statusFrom: null,
      statusTo: 'RECEIVED',
      sourceRecordId: pod.documentKey,
    }, tx);
    await recordWorkflowEvent({
      eventKey: `${workflowId}:invoice.issued:${invoice.documentKey}`,
      workflowId,
      type: 'invoice.issued',
      label: `Invoice ${invoice.documentKey} issued from delivered order ${orderDocument.documentKey}.`,
      sourceModule: 'Finance',
      occurredAt: new Date(),
      subject: {
        conversationId: sourceConversationId ?? null,
        customerKey: orderDocument.customer.customerKey,
        salesOrderId: orderDocument.documentKey,
        logisticsId: deliveryNote.documentKey,
        invoiceId: invoice.documentKey,
        productId: workflowItems.length === 1 ? workflowItems[0].product.referenceId : null,
      },
      amountZar: toNumber(orderDocument.totalAmount),
      statusFrom: null,
      statusTo: 'PAID',
      sourceRecordId: invoice.documentKey,
    }, tx);
    await enqueueDomainEvent(tx, {
      type: 'payment.applied',
      aggregateType: 'PAYMENT',
      aggregateId: invoice.id,
      payload: {
        customerKey: orderDocument.customer.customerKey,
        documentKey: invoice.documentKey,
      },
    });
    await recordWorkflowEvent({
      eventKey: `${workflowId}:payment.applied:${invoice.documentKey}`,
      workflowId,
      type: 'payment.applied',
      label: `Payment applied and invoice ${invoice.documentKey} closed.`,
      sourceModule: 'Finance',
      occurredAt: new Date(),
      subject: {
        conversationId: sourceConversationId ?? null,
        customerKey: orderDocument.customer.customerKey,
        salesOrderId: orderDocument.documentKey,
        invoiceId: invoice.documentKey,
        productId: workflowItems.length === 1 ? workflowItems[0].product.referenceId : null,
      },
      amountZar: toNumber(orderDocument.totalAmount),
      statusFrom: 'ISSUED',
      statusTo: 'PAID',
      sourceRecordId: invoice.documentKey,
    }, tx);

    return {
      primaryDocumentId: invoice.id,
      relatedDocumentIds: [orderDocument.id, deliveryNote.id, pod.id],
    };
  });

  return buildCustomerWorkflowProgressResult(orderDocument.customer.customerKey, result.primaryDocumentId, result.relatedDocumentIds);
}

export async function createInventoryProduct(input: CreateInventoryProductInput) {
  const { category, productType, finish, pricingUnit, coverageOrientation, categoryDefaults } = validateCreatePayload(input);
  const supplier = await prisma.supplier.findUnique({
    where: { supplierKey: input.linkedSupplierId },
    include: { locations: true },
  });

  if (!supplier) {
    throw new Error(`Supplier ${input.linkedSupplierId} was not found.`);
  }

  if (!supplier.locations[0]) {
    throw new Error(`Supplier ${input.linkedSupplierId} has no origin location configured.`);
  }

  const coverage = computeCoverageMetrics({
    category,
    lengthMm: input.dimensions.lengthMm,
    widthMm: input.dimensions.widthMm,
    heightMm: input.dimensions.heightMm,
    coverageOrientation,
    piecesPerPallet: input.packaging.piecesPerPallet || categoryDefaults.piecesPerPallet,
    boxesPerPallet: input.packaging.boxesPerPallet || categoryDefaults.boxesPerPallet,
  });
  const piecesPerPallet = Math.round(input.packaging.piecesPerPallet || categoryDefaults.piecesPerPallet);
  const boxesPerPallet =
    category === 'Cladding'
      ? Math.round(input.packaging.boxesPerPallet || categoryDefaults.boxesPerPallet)
      : Math.max(0, Math.round(input.packaging.boxesPerPallet || 0));
  const palletsPerTruck = Math.round(input.packaging.palletsPerTruck || categoryDefaults.palletsPerTruck);
  const normalizedTestResults = normalizeTestResults(input.testResults);
  const latestTestReportName =
    input.latestTestReport?.name?.trim() ||
    input.latestTestReport?.url.split('/').pop() ||
    null;

  const createdReferenceId = generateReferenceIdFromSku(input.publicSku);

  await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        referenceId: createdReferenceId,
        publicSku: input.publicSku.trim(),
        name: input.name.trim(),
        category: categoryKeys[category],
        productType: productTypeKeys[productType],
        finish: finish ? finishKeys[finish] : null,
        collectionName: input.collection?.trim() || null,
        presentationTags: input.tags?.filter(Boolean) ?? [category, productType, ...(finish ? [finish] : [])],
        lifecycleStatus: 'DRAFT',
        publishStatus: 'NOT_READY',
        inventoryMode: 'DROPSHIP',
        availabilityStatus: supplier.status === 'ACTIVE' ? 'READY_TO_PROCURE' : supplier.status === 'ONBOARDING' ? 'SUPPLIER_ONBOARDING' : 'SUPPLIER_DELAYED',
        pricingUnit: pricingUnitKeys[pricingUnit],
        sellPriceZar: input.sellPriceZar ?? null,
        primaryImageUrl: input.primaryImage.url,
        galleryImageUrl: input.galleryImage.url,
        faceImageUrl: input.faceImage.url,
        heroImageUrl: input.heroImage?.url ?? input.primaryImage.url,
        latestTestReportUrl: input.latestTestReport?.url ?? null,
        latestTestReportName,
        latestTestLaboratoryName: input.latestTestLaboratoryName?.trim() || null,
        latestTestMethodStandard: input.latestTestMethodStandard?.trim() || null,
        latestTestReportReference: input.latestTestReportReference?.trim() || null,
        latestTestedAt: input.latestTestedAt ? new Date(input.latestTestedAt) : null,
        latestTestIssuedAt: input.latestTestIssuedAt ? new Date(input.latestTestIssuedAt) : null,
        description: input.description.trim(),
        marketingCopy: '',
        technicalSpecifications: {
          Category: category,
          Type: productType,
          ...(finish ? { Finish: finish } : {}),
        },
        lengthMm: input.dimensions.lengthMm,
        widthMm: input.dimensions.widthMm,
        heightMm: input.dimensions.heightMm,
        coverageOrientation: coverageOrientationKeys[coverageOrientation],
        faceAreaM2: coverage.faceAreaM2,
        unitsPerM2: coverage.unitsPerM2,
        weightKg: input.dimensions.weightKg,
        piecesPerPallet,
        boxesPerPallet: boxesPerPallet || null,
        palletsPerTruck,
        reorderPoint: 0,
      } as any,
    });

    if (normalizedTestResults.length > 0) {
      await tx.productTestResult.createMany({
        data: normalizedTestResults.map((result) => ({
          productId: created.id,
          ...result,
        })),
      });
    }

    await tx.productSupplier.create({
      data: {
        productId: created.id,
        supplierId: supplier.id,
        originLocationId: supplier.locations[0].id,
        isDefault: true,
        unitCostZar: input.unitCostZar,
        leadTimeDays: supplier.leadTimeDays ?? null,
        minimumOrderQuantity: 1,
        paymentTerms: 'Quote Paid',
        incoterms: 'TBD',
      },
    });

    await createProductAssets(tx, created.id, input);

    await tx.productHistoryEvent.create({
      data: {
        productId: created.id,
        eventType: 'PRODUCT_CREATED',
        actionLabel: 'Product Created',
        userName: 'Inventory API',
        details: 'Created through the Inventory OS wizard',
        occurredAt: new Date(),
      },
    });

    await enqueueDomainEvent(tx, {
      type: 'product.created',
      aggregateType: 'PRODUCT',
      aggregateId: created.referenceId,
      supplierId: supplier.id,
      productId: created.id,
      payload: { publicSku: created.publicSku, name: created.name },
    });
  });

  return getInventoryProduct(createdReferenceId);
}

export async function updateInventoryProduct(referenceId: string, input: UpdateInventoryProductInput) {
  const product = await prisma.product.findUnique({
    where: { referenceId },
    include: {
      productSuppliers: {
        include: {
          supplier: true,
          originLocation: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error(`Product ${referenceId} was not found.`);
  }

  const existingCategory = categoryLabels[product.category];
  const category = input.category ? normalizeCategory(input.category) : existingCategory;
  const productType = category && input.productType ? normalizeProductType(category, input.productType) : undefined;
  const finish = category ? normalizeFinish(category, input.finish) : undefined;
  const coverageOrientation = input.dimensions?.coverageOrientation
    ? normalizeCoverageOrientation(input.dimensions.coverageOrientation, category)
    : undefined;
  const categoryDefaults = quoteDefaultsByCategory[category];

  const lengthMm = input.dimensions?.lengthMm ?? product.lengthMm ?? undefined;
  const widthMm = input.dimensions?.widthMm ?? product.widthMm ?? undefined;
  const heightMm = input.dimensions?.heightMm ?? product.heightMm ?? undefined;
  const weightKg = input.dimensions?.weightKg ?? toNumber(product.weightKg);
  const nextPiecesPerPallet = input.packaging?.piecesPerPallet ?? product.piecesPerPallet ?? categoryDefaults.piecesPerPallet;
  const nextBoxesPerPallet = input.packaging?.boxesPerPallet ?? (product as any).boxesPerPallet ?? categoryDefaults.boxesPerPallet;
  const coverage = lengthMm && widthMm && heightMm
    ? computeCoverageMetrics({
        category,
        lengthMm,
        widthMm,
        heightMm,
        coverageOrientation: coverageOrientation ?? coverageOrientationLabels[product.coverageOrientation ?? 'LENGTH_X_HEIGHT'],
        piecesPerPallet: nextPiecesPerPallet,
        boxesPerPallet: nextBoxesPerPallet,
      })
    : null;

  if (input.unitCostZar !== undefined && input.unitCostZar !== null) {
    ensurePositiveNumber(input.unitCostZar, 'Unit cost (ZAR)');
  }
  if (input.sellPriceZar !== undefined && input.sellPriceZar !== null) {
    ensurePositiveNumber(input.sellPriceZar, 'Sell price (ZAR)');
  }
  if (input.packaging?.piecesPerPallet !== undefined) {
    ensurePositiveNumber(input.packaging.piecesPerPallet, 'Pieces per pallet');
  }
  if (category === 'Cladding' && input.packaging?.boxesPerPallet !== undefined) {
    ensurePositiveNumber(input.packaging.boxesPerPallet, 'Boxes per pallet');
  }
  if (input.packaging?.palletsPerTruck !== undefined) {
    ensurePositiveNumber(input.packaging.palletsPerTruck, 'Pallets per truck');
  }

  const pricingUnit = input.pricingUnit ? normalizePricingUnit(category, input.pricingUnit) : undefined;
  const normalizedTestResults = input.testResults ? normalizeTestResults(input.testResults) : undefined;
  const latestTestReportName =
    input.latestTestReport === undefined
      ? undefined
      : input.latestTestReport === null
        ? null
        : input.latestTestReport.name?.trim() || input.latestTestReport.url.split('/').pop() || null;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: product.id },
      data: {
        publicSku: input.publicSku?.trim(),
        name: input.name?.trim(),
        category: input.category ? categoryKeys[category] : undefined,
        productType: productType ? productTypeKeys[productType] : undefined,
        finish: finish === null ? null : finish ? finishKeys[finish] : undefined,
        collectionName: input.collection === undefined ? undefined : input.collection?.trim() || null,
        description: input.description?.trim(),
        marketingCopy: input.marketingCopy,
        sellPriceZar: input.sellPriceZar === null ? null : input.sellPriceZar,
        pricingUnit: pricingUnit ? pricingUnitKeys[pricingUnit] : undefined,
        publishStatus: input.publishStatus ? publishStatusMap[input.publishStatus] : undefined,
        lifecycleStatus: input.status ? lifecycleStatusMap[input.status] : undefined,
        primaryImageUrl:
          input.primaryImage === null
            ? null
            : input.primaryImage?.url,
        galleryImageUrl:
          input.galleryImage === null
            ? null
            : input.galleryImage?.url,
        faceImageUrl:
          input.faceImage === null
            ? null
            : input.faceImage?.url,
        heroImageUrl:
          input.heroImage === null
            ? null
            : input.heroImage?.url,
        latestTestReportUrl:
          input.latestTestReport === undefined
            ? undefined
            : input.latestTestReport === null
              ? null
              : input.latestTestReport.url,
        latestTestReportName: latestTestReportName,
        latestTestLaboratoryName:
          input.latestTestLaboratoryName === undefined ? undefined : input.latestTestLaboratoryName?.trim() || null,
        latestTestMethodStandard:
          input.latestTestMethodStandard === undefined ? undefined : input.latestTestMethodStandard?.trim() || null,
        latestTestReportReference:
          input.latestTestReportReference === undefined ? undefined : input.latestTestReportReference?.trim() || null,
        latestTestedAt:
          input.latestTestedAt === undefined ? undefined : input.latestTestedAt ? new Date(input.latestTestedAt) : null,
        latestTestIssuedAt:
          input.latestTestIssuedAt === undefined ? undefined : input.latestTestIssuedAt ? new Date(input.latestTestIssuedAt) : null,
        technicalSpecifications: input.specifications ? (input.specifications as Prisma.InputJsonValue) : undefined,
        lengthMm: input.dimensions?.lengthMm,
        widthMm: input.dimensions?.widthMm,
        heightMm: input.dimensions?.heightMm,
        coverageOrientation: coverageOrientation ? coverageOrientationKeys[coverageOrientation] : undefined,
        faceAreaM2: coverage?.faceAreaM2,
        unitsPerM2: coverage?.unitsPerM2,
        weightKg: input.dimensions?.weightKg,
        piecesPerPallet: input.packaging?.piecesPerPallet ? Math.round(input.packaging.piecesPerPallet) : undefined,
        boxesPerPallet:
          input.packaging?.boxesPerPallet !== undefined
            ? Math.max(0, Math.round(input.packaging.boxesPerPallet))
            : undefined,
        palletsPerTruck: input.packaging?.palletsPerTruck ? Math.round(input.packaging.palletsPerTruck) : undefined,
      } as any,
    });

    if (normalizedTestResults !== undefined) {
      await tx.productTestResult.deleteMany({
        where: { productId: product.id },
      });

      if (normalizedTestResults.length > 0) {
        await tx.productTestResult.createMany({
          data: normalizedTestResults.map((result) => ({
            productId: product.id,
            ...result,
          })),
        });
      }
    }

    const updatedProduct = await tx.product.findUniqueOrThrow({
      where: { id: product.id },
      select: {
        primaryImageUrl: true,
        heroImageUrl: true,
      },
    });

    if (input.heroImage === undefined && input.primaryImage?.url && !updatedProduct.heroImageUrl) {
      await tx.product.update({
        where: { id: product.id },
        data: {
          heroImageUrl: input.primaryImage.url,
        },
      });
    }

    if (input.linkedSupplierId) {
      const supplier = await tx.supplier.findUnique({
        where: { supplierKey: input.linkedSupplierId },
        include: { locations: true },
      });

      if (!supplier || !supplier.locations[0]) {
        throw new Error(`Supplier ${input.linkedSupplierId} is not configured for procurement.`);
      }

      await tx.productSupplier.updateMany({
        where: { productId: product.id },
        data: { isDefault: false },
      });

      const existingLink = await tx.productSupplier.findFirst({
        where: { productId: product.id, supplierId: supplier.id },
      });

      if (existingLink) {
        await tx.productSupplier.update({
          where: { id: existingLink.id },
          data: { isDefault: true, originLocationId: supplier.locations[0].id },
        });
      } else {
        const previousDefault = product.productSuppliers.find((link) => link.isDefault) ?? product.productSuppliers[0];
        await tx.productSupplier.create({
          data: {
            productId: product.id,
            supplierId: supplier.id,
            originLocationId: supplier.locations[0].id,
            isDefault: true,
            unitCostZar: previousDefault?.unitCostZar ?? 0,
            leadTimeDays: supplier.leadTimeDays ?? null,
            minimumOrderQuantity: previousDefault?.minimumOrderQuantity ?? 1,
            paymentTerms: previousDefault?.paymentTerms ?? 'Quote Paid',
            incoterms: previousDefault?.incoterms ?? 'TBD',
          },
        });
      }
    }

    const defaultSupplierLink = await tx.productSupplier.findFirst({
      where: { productId: product.id, isDefault: true },
    });

    if (input.unitCostZar !== undefined || input.linkedSupplierId) {
      if (defaultSupplierLink) {
        await tx.productSupplier.update({
          where: { id: defaultSupplierLink.id },
          data: {
            unitCostZar: input.unitCostZar === null ? defaultSupplierLink.unitCostZar : input.unitCostZar ?? undefined,
          },
        });
      }
    }

    await syncProductAssets(tx, product.id, {
      primaryImage: input.primaryImage,
      galleryImage: input.galleryImage,
      faceImage: input.faceImage,
      heroImage: input.heroImage,
      asset2_5d: input.asset2_5d,
      asset3d: input.asset3d,
      projectImages: input.projectImages,
      generatedImages: input.generatedImages,
      galleryImages: input.galleryImages,
    });

    const publishedCandidate = await tx.product.findUnique({
      where: { id: product.id },
      ...productDetailArgs,
    });

    if (!publishedCandidate) {
      throw new Error(`Product ${referenceId} could not be reloaded.`);
    }

    if (input.publishStatus === 'Published') {
      const readiness = buildReadiness(publishedCandidate, buildStockPosition(publishedCandidate));
      const publishBlockers = [
        !readiness.checklist.primaryImage ? 'Missing primary image' : null,
        !readiness.checklist.galleryImage ? 'Missing gallery image' : null,
        !readiness.checklist.faceImage ? 'Missing face image' : null,
        !readiness.checklist.calculatorData ? 'Missing calculator dimensions' : null,
        !readiness.checklist.supplierLinkage ? 'Missing supplier linkage' : null,
        !readiness.checklist.pricing ? 'Missing sell price or unit cost' : null,
      ].filter((value): value is string => Boolean(value));

      if (publishBlockers.length > 0) {
        throw new Error(`Product cannot be published yet: ${publishBlockers.join(', ')}.`);
      }

      if (publishedCandidate.lifecycleStatus !== 'ACTIVE') {
        await tx.product.update({
          where: { id: product.id },
          data: {
            lifecycleStatus: 'ACTIVE',
          },
        });
      }
    }

    await tx.productHistoryEvent.create({
      data: {
        productId: product.id,
        eventType: input.publishStatus === 'Published' ? 'STATUS_CHANGED' : 'PRODUCT_UPDATED',
        actionLabel: input.publishStatus === 'Published' ? 'Published To Store' : 'Product Updated',
        userName: 'Inventory API',
        details: input.publishStatus === 'Published' ? 'Published through the Inventory OS' : 'Updated through the Inventory OS',
        occurredAt: new Date(),
      },
    });

    await enqueueDomainEvent(tx, {
      type: input.publishStatus === 'Published' ? 'product.published' : 'product.updated',
      aggregateType: 'PRODUCT',
      aggregateId: product.referenceId,
      supplierId: product.productSuppliers[0]?.supplierId,
      productId: product.id,
      payload: input as Prisma.InputJsonValue,
    });
  });

  return getInventoryProduct(referenceId);
}

export async function getInventoryProductAssets(referenceId: string) {
  const detail = await getInventoryProduct(referenceId);
  return detail.media;
}

export async function createInventoryAsset(referenceId: string, input: CreateInventoryAssetInput) {
  const product = await prisma.product.findUnique({
    where: { referenceId },
  });

  if (!product) {
    throw new Error(`Product ${referenceId} was not found.`);
  }

  const asset = await prisma.productAsset.create({
    data: {
      assetKey: `AST_${Date.now()}`,
      primaryProductId: product.id,
      name: input.name,
      assetType: assetTypeKeys[input.type],
      assetSource: assetSourceKeys[normalizeAssetSource(input.source)],
      protectionLevel: input.protectionLevel ? assetProtectionKeys[input.protectionLevel] : 'MANAGED_VARIANT',
      approvalStatus: input.status ? assetStatusKeys[input.status] : 'DRAFT',
      sizeLabel: 'Pending',
      imageUrl: input.imageUrl,
      ...deriveAssetStoragePayload(input),
      usageRoles: [assetRoleKeys[input.role]],
      isThreeDReady: input.role === 'asset_2_5d' || input.role === 'asset_3d',
      tags: [input.role, input.type],
    },
  });

  await prisma.assetLink.create({
    data: {
      assetId: asset.id,
      linkType: 'PRODUCT',
      productId: product.id,
    },
  });

  if (input.linkedCampaignIds?.length) {
    await prisma.assetLink.createMany({
      data: input.linkedCampaignIds.map((campaignKey) => ({
        assetId: asset.id,
        linkType: 'CAMPAIGN',
        campaignKey,
      })),
    });
  }

  await prisma.productHistoryEvent.create({
    data: {
      productId: product.id,
      eventType: 'ASSET_ATTACHED',
      actionLabel: 'Asset Attached',
      userName: 'Inventory API',
      details: input.name,
      occurredAt: new Date(),
    },
  });

  await enqueueDomainEvent(prisma, {
    type: 'product.asset_attached',
    aggregateType: 'PRODUCT',
    aggregateId: product.referenceId,
    productId: product.id,
    payload: { assetName: input.name, role: input.role },
  });

  return getInventoryProductAssets(referenceId);
}

export async function createSupplier(input: CreateSupplierInput) {
  const supplierKey = `VND_${Date.now()}`;
  const normalizedCurrency = input.currency?.trim() || input.commercialAccount?.currency?.trim() || 'ZAR';
  const primaryName = input.tradingName?.trim() || input.registeredName?.trim() || input.name?.trim();

  if (!primaryName) {
    throw new Error('Supplier name is required.');
  }

  const created = await prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.create({
      data: {
        supplierKey,
        name: primaryName,
        registeredName: input.registeredName?.trim() || null,
        tradingName: input.tradingName?.trim() || primaryName,
        logoUrl: input.logoUrl?.trim() || null,
        status: supplierStatusKeys[input.status ?? 'Active'],
        supplierType: supplierTypeKeys[input.type],
        vendorRoles: (input.vendorRoles?.length ? input.vendorRoles : [input.providesTransport ? 'Transport Partner' : 'Product Supplier']).map(
          (role) => supplierVendorRoleKeys[role],
        ),
        capabilities: input.capabilities ?? [],
        regionLabel: input.region ?? input.location?.region ?? 'Unassigned',
        leadTimeLabel: input.leadTime ?? 'TBD',
        defaultCurrency: normalizedCurrency,
        vatRegistered: input.vatRegistered ?? input.commercialAccount?.vatRegistered ?? false,
        vatNumber: input.vatNumber?.trim() || input.commercialAccount?.vatNumber?.trim() || null,
        providesProducts: input.providesProducts ?? input.type !== 'Transport Partner',
        providesTransport: input.providesTransport ?? input.type === 'Transport Partner',
        notes: input.notes?.trim() || null,
        contacts: [],
        locations: input.location
          ? {
              create: {
                locationKey: `LOC_${Date.now()}`,
                type: 'SUPPLIER_ORIGIN',
                label: input.location.label,
                streetAddress: input.location.streetAddress ?? null,
                postalCode: input.location.postalCode ?? null,
                country: input.location.country,
                region: input.location.region,
                city: input.location.city,
                latitude: input.location.latitude ?? null,
                longitude: input.location.longitude ?? null,
              },
            }
          : undefined,
        commercialAccount: {
          create: {
            paymentTerms: input.commercialAccount?.paymentTerms ?? 'TBD',
            deliveryTerms: input.commercialAccount?.deliveryTerms ?? 'TBD',
            minimumOrderValueZar: input.commercialAccount?.minimumOrderValueZar ?? null,
            standardDiscountPct: input.commercialAccount?.standardDiscountPct ?? null,
            moq: input.commercialAccount?.moq ?? 'TBD',
            currency: normalizedCurrency,
            incoterms: input.commercialAccount?.incoterms ?? 'TBD',
            creditLimitZar: input.commercialAccount?.creditLimitZar ?? null,
            currentCreditBalanceZar: input.commercialAccount?.currentCreditBalanceZar ?? 0,
            vatRegistered: input.commercialAccount?.vatRegistered ?? input.vatRegistered ?? false,
            vatNumber: input.commercialAccount?.vatNumber ?? input.vatNumber ?? null,
          },
        },
      },
      include: {
        locations: true,
      },
    });

    if (input.contacts?.length) {
      await tx.vendorContact.createMany({
        data: input.contacts.map((contact, index) => ({
          supplierId: supplier.id,
          department: contact.department.trim(),
          roleTitle: contact.roleTitle?.trim() || null,
          name: contact.name.trim(),
          email: contact.email.trim().toLowerCase(),
          phone: contact.phone?.trim() || null,
          preferredChannel: preferredChannelKeys[contact.preferredChannel ?? 'Email'],
          notes: contact.notes?.trim() || null,
          isPrimary: contact.isPrimary ?? index === 0,
        })),
      });
    }

    if (input.documents?.length) {
      await tx.vendorDocument.createMany({
        data: input.documents.map((document) => ({
          supplierId: supplier.id,
          documentKey: `VDO_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: document.name.trim(),
          documentType: vendorDocumentTypeKeys[document.type],
          storagePath: document.storagePath,
          storedFileName: document.storedFileName,
          mimeType: document.mimeType ?? null,
          uploadedBy: document.uploadedBy ?? 'Supplier Onboarding',
          fileSizeBytes: document.fileSizeBytes ?? null,
        })),
      });
    }

    if (input.portalUser) {
      await tx.vendorUser.create({
        data: {
          supplierId: supplier.id,
          email: input.portalUser.email.trim().toLowerCase(),
          passwordHash: await hashPassword(input.portalUser.password),
          fullName: input.portalUser.fullName.trim(),
          roleLabel: input.portalUser.roleLabel?.trim() || 'Vendor Admin',
        },
      });
    }

    if (input.linkedProductIds?.length && supplier.locations[0]) {
      for (const productReference of input.linkedProductIds) {
        const product = await tx.product.findUnique({
          where: { referenceId: productReference },
          include: { productSuppliers: true },
        });

        if (!product) {
          continue;
        }

        const existingLink = product.productSuppliers.find((link) => link.supplierId === supplier.id);
        if (existingLink) {
          continue;
        }

        await tx.productSupplier.create({
          data: {
            productId: product.id,
            supplierId: supplier.id,
            originLocationId: supplier.locations[0].id,
            isDefault: product.productSuppliers.length === 0,
            unitCostZar: 0,
            leadTimeDays: supplier.leadTimeDays ?? null,
            minimumOrderQuantity: 1,
            paymentTerms: input.commercialAccount?.paymentTerms ?? 'TBD',
            incoterms: input.commercialAccount?.incoterms ?? 'TBD',
          },
        });
      }
    }

    await tx.vendorWorkflowEvent.create({
      data: {
        eventKey: `VWE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        supplierId: supplier.id,
        eventType: 'VENDOR_CREATED',
        actorLabel: 'Supplier Onboarding',
        payload: {
          linkedProductIds: input.linkedProductIds ?? [],
          hasPortalUser: Boolean(input.portalUser),
        },
        occurredAt: new Date(),
      },
    });

    await enqueueDomainEvent(tx, {
      type: 'supplier.created',
      aggregateType: 'SUPPLIER',
      aggregateId: supplier.supplierKey,
      supplierId: supplier.id,
      payload: {
        linkedProductIds: input.linkedProductIds ?? [],
        hasPortalUser: Boolean(input.portalUser),
      },
    });

    return tx.supplier.findUniqueOrThrow({
      where: { id: supplier.id },
      ...supplierDetailArgs,
    });
  });

  return buildSupplierSummary(created);
}

export async function updateSupplier(referenceId: string, input: UpdateSupplierInput) {
  const supplier = await prisma.supplier.findUnique({
    where: { supplierKey: referenceId },
    include: { locations: true, commercialAccount: true },
  });

  if (!supplier) {
    throw new Error(`Supplier ${referenceId} was not found.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.supplier.update({
      where: { id: supplier.id },
      data: {
        registeredName: input.registeredName === undefined ? undefined : input.registeredName?.trim() || null,
        tradingName: input.tradingName === undefined ? undefined : input.tradingName?.trim() || null,
        name: input.name?.trim(),
        logoUrl: input.logoUrl === undefined ? undefined : input.logoUrl?.trim() || null,
        status: input.status ? supplierStatusKeys[input.status] : undefined,
        supplierType: input.type ? supplierTypeKeys[input.type] : undefined,
        vendorRoles: input.vendorRoles?.map((role) => supplierVendorRoleKeys[role]),
        capabilities: input.capabilities,
        regionLabel: input.region,
        leadTimeLabel: input.leadTime,
        defaultCurrency: input.currency?.trim() || undefined,
        vatRegistered: input.vatRegistered,
        vatNumber: input.vatNumber === undefined ? undefined : input.vatNumber?.trim() || null,
        providesProducts: input.providesProducts,
        providesTransport: input.providesTransport,
        notes: input.notes === undefined ? undefined : input.notes?.trim() || null,
      },
    });

    if (input.location && supplier.locations[0]) {
      await tx.fulfillmentLocation.update({
        where: { id: supplier.locations[0].id },
        data: {
          label: input.location.label,
          streetAddress: input.location.streetAddress ?? null,
          postalCode: input.location.postalCode ?? null,
          country: input.location.country,
          region: input.location.region,
          city: input.location.city,
          latitude: input.location.latitude ?? null,
          longitude: input.location.longitude ?? null,
        },
      });
    }

    if (input.commercialAccount) {
      await tx.vendorCommercialAccount.upsert({
        where: { supplierId: supplier.id },
        update: {
          paymentTerms: input.commercialAccount.paymentTerms ?? undefined,
          deliveryTerms: input.commercialAccount.deliveryTerms ?? undefined,
          minimumOrderValueZar: input.commercialAccount.minimumOrderValueZar ?? undefined,
          standardDiscountPct: input.commercialAccount.standardDiscountPct ?? undefined,
          moq: input.commercialAccount.moq ?? undefined,
          currency: input.commercialAccount.currency ?? input.currency ?? undefined,
          incoterms: input.commercialAccount.incoterms ?? undefined,
          creditLimitZar: input.commercialAccount.creditLimitZar ?? undefined,
          currentCreditBalanceZar: input.commercialAccount.currentCreditBalanceZar ?? undefined,
          vatRegistered: input.commercialAccount.vatRegistered ?? input.vatRegistered ?? undefined,
          vatNumber:
            input.commercialAccount.vatNumber === undefined ? undefined : input.commercialAccount.vatNumber?.trim() || null,
        },
        create: {
          supplierId: supplier.id,
          paymentTerms: input.commercialAccount.paymentTerms ?? 'TBD',
          deliveryTerms: input.commercialAccount.deliveryTerms ?? 'TBD',
          minimumOrderValueZar: input.commercialAccount.minimumOrderValueZar ?? null,
          standardDiscountPct: input.commercialAccount.standardDiscountPct ?? null,
          moq: input.commercialAccount.moq ?? 'TBD',
          currency: input.commercialAccount.currency ?? input.currency ?? supplier.defaultCurrency,
          incoterms: input.commercialAccount.incoterms ?? 'TBD',
          creditLimitZar: input.commercialAccount.creditLimitZar ?? null,
          currentCreditBalanceZar: input.commercialAccount.currentCreditBalanceZar ?? 0,
          vatRegistered: input.commercialAccount.vatRegistered ?? input.vatRegistered ?? false,
          vatNumber: input.commercialAccount.vatNumber ?? input.vatNumber ?? null,
        },
      });
    }

    await tx.vendorWorkflowEvent.create({
      data: {
        eventKey: `VWE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        supplierId: supplier.id,
        eventType: 'VENDOR_UPDATED',
        actorLabel: 'Vendor Portal',
        payload: input as Prisma.InputJsonValue,
        occurredAt: new Date(),
      },
    });

    await enqueueDomainEvent(tx, {
      type: 'supplier.updated',
      aggregateType: 'SUPPLIER',
      aggregateId: supplier.supplierKey,
      supplierId: supplier.id,
      payload: input as Prisma.InputJsonValue,
    });
  });

  return getInventorySupplier(referenceId);
}

export async function deleteSupplier(referenceId: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { supplierKey: referenceId },
    include: {
      productSuppliers: true,
      purchaseOrders: true,
      logisticsQuotes: true,
      documents: true,
      businessDocuments: true,
      vendorUsers: true,
      workflowEvents: true,
    },
  });

  if (!supplier) {
    throw new Error(`Supplier ${referenceId} was not found.`);
  }

  const requiresArchive =
    supplier.productSuppliers.length > 0 ||
    supplier.purchaseOrders.length > 0 ||
    supplier.logisticsQuotes.length > 0 ||
    supplier.documents.length > 0 ||
    supplier.businessDocuments.length > 0 ||
    supplier.vendorUsers.length > 0 ||
    supplier.workflowEvents.length > 0;

  if (requiresArchive) {
    await prisma.$transaction(async (tx) => {
      await tx.supplier.update({
        where: { id: supplier.id },
        data: {
          status: 'INACTIVE',
        },
      });

      await tx.vendorUser.updateMany({
        where: { supplierId: supplier.id },
        data: { isActive: false },
      });

      await tx.vendorWorkflowEvent.create({
        data: {
          eventKey: `VWE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          supplierId: supplier.id,
          eventType: 'VENDOR_UPDATED',
          actorLabel: 'Vendor Directory',
          payload: {
            archived: true,
            reason: 'Operational history preserved via archive mode.',
          },
          occurredAt: new Date(),
        },
      });

      await enqueueDomainEvent(tx, {
        type: 'supplier.updated',
        aggregateType: 'SUPPLIER',
        aggregateId: supplier.supplierKey,
        supplierId: supplier.id,
        payload: {
          archived: true,
          linkedProductCount: supplier.productSuppliers.length,
          purchaseOrderCount: supplier.purchaseOrders.length,
          logisticsQuoteCount: supplier.logisticsQuotes.length,
          portalUserCount: supplier.vendorUsers.length,
        },
      });
    });

    return {
      ok: true as const,
      id: referenceId,
      disposition: 'archived' as const,
      supplier: await getInventorySupplier(referenceId),
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.supplier.delete({
      where: { id: supplier.id },
    });

    await enqueueDomainEvent(tx, {
      type: 'supplier.deleted',
      aggregateType: 'SUPPLIER',
      aggregateId: supplier.supplierKey,
      payload: {
        name: supplier.name,
      },
    });
  });

  return {
    ok: true as const,
    id: referenceId,
    disposition: 'deleted' as const,
  };
}

export async function createSupplierContact(referenceId: string, input: CreateSupplierContactInput) {
  const supplier = await prisma.supplier.findUnique({
    where: { supplierKey: referenceId },
  });

  if (!supplier) {
    throw new Error(`Supplier ${referenceId} was not found.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.vendorContact.create({
      data: {
        supplierId: supplier.id,
        department: input.department.trim(),
        roleTitle: input.roleTitle?.trim() || null,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        preferredChannel: preferredChannelKeys[input.preferredChannel ?? 'Email'],
        notes: input.notes?.trim() || null,
        isPrimary: input.isPrimary ?? false,
      },
    });

    await tx.vendorWorkflowEvent.create({
      data: {
        eventKey: `VWE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        supplierId: supplier.id,
        eventType: 'VENDOR_UPDATED',
        actorLabel: 'Vendor Directory',
        payload: { action: 'contact.created', department: input.department },
        occurredAt: new Date(),
      },
    });

    await enqueueDomainEvent(tx, {
      type: 'supplier.contact_created',
      aggregateType: 'SUPPLIER',
      aggregateId: supplier.supplierKey,
      supplierId: supplier.id,
      payload: { department: input.department, email: input.email.trim().toLowerCase() },
    });
  });

  return getInventorySupplier(referenceId);
}

export async function createSupplierDocument(referenceId: string, input: CreateSupplierDocumentInput) {
  const supplier = await prisma.supplier.findUnique({
    where: { supplierKey: referenceId },
  });

  if (!supplier) {
    throw new Error(`Supplier ${referenceId} was not found.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.vendorDocument.create({
      data: {
        supplierId: supplier.id,
        documentKey: `VDO_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: input.name.trim(),
        documentType: vendorDocumentTypeKeys[input.type],
        storagePath: input.storagePath,
        storedFileName: input.storedFileName,
        mimeType: input.mimeType ?? null,
        uploadedBy: input.uploadedBy ?? 'Vendor Directory',
        fileSizeBytes: input.fileSizeBytes ?? null,
      },
    });

    await tx.vendorWorkflowEvent.create({
      data: {
        eventKey: `VWE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        supplierId: supplier.id,
        eventType: 'VENDOR_DOCUMENT_UPLOADED',
        actorLabel: 'Vendor Directory',
        payload: { documentName: input.name, documentType: input.type },
        occurredAt: new Date(),
      },
    });

    await enqueueDomainEvent(tx, {
      type: 'supplier.document_uploaded',
      aggregateType: 'SUPPLIER',
      aggregateId: supplier.supplierKey,
      supplierId: supplier.id,
      payload: { documentName: input.name, documentType: input.type },
    });
  });

  return getInventorySupplier(referenceId);
}

export async function linkSupplierProducts(referenceId: string, input: LinkSupplierProductsInput) {
  const supplier = await prisma.supplier.findUnique({
    where: { supplierKey: referenceId },
    include: { locations: true },
  });

  if (!supplier || !supplier.locations[0]) {
    throw new Error(`Supplier ${referenceId} is not configured with an origin location.`);
  }

  await prisma.$transaction(async (tx) => {
    const targetIds = new Set(input.productIds);
    const addedProductIds: string[] = [];
    const removedProductIds: string[] = [];

    if (input.replace) {
      const existingLinks = await tx.productSupplier.findMany({
        where: { supplierId: supplier.id },
        include: {
          product: {
            include: {
              productSuppliers: {
                orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
              },
            },
          },
        },
      });

      for (const link of existingLinks) {
        if (targetIds.has(link.product.referenceId)) {
          continue;
        }

        await tx.productSupplier.delete({
          where: { id: link.id },
        });
        removedProductIds.push(link.product.referenceId);

        if (link.isDefault) {
          const fallback = link.product.productSuppliers.find((candidate) => candidate.id !== link.id);
          if (fallback) {
            await tx.productSupplier.update({
              where: { id: fallback.id },
              data: { isDefault: true },
            });
          }
        }
      }
    }

    for (const productReference of input.productIds) {
      const product = await tx.product.findUnique({
        where: { referenceId: productReference },
        include: { productSuppliers: true },
      });

      if (!product) {
        continue;
      }

      const existing = product.productSuppliers.find((link) => link.supplierId === supplier.id);
      if (existing) {
        continue;
      }

      await tx.productSupplier.create({
        data: {
          productId: product.id,
          supplierId: supplier.id,
          originLocationId: supplier.locations[0].id,
          isDefault: product.productSuppliers.length === 0,
          unitCostZar: 0,
          leadTimeDays: supplier.leadTimeDays ?? null,
          minimumOrderQuantity: 1,
          paymentTerms: 'TBD',
          incoterms: 'TBD',
        },
      });
      addedProductIds.push(productReference);
    }

    await tx.vendorWorkflowEvent.create({
      data: {
        eventKey: `VWE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        supplierId: supplier.id,
        eventType: 'PRODUCT_VENDOR_LINKED',
        actorLabel: 'Vendor Directory',
        payload: { productIds: input.productIds, addedProductIds, removedProductIds, replace: Boolean(input.replace) },
        occurredAt: new Date(),
      },
    });

    await enqueueDomainEvent(tx, {
      type: 'product.vendor_linked',
      aggregateType: 'SUPPLIER',
      aggregateId: supplier.supplierKey,
      supplierId: supplier.id,
      payload: { productIds: input.productIds, addedProductIds, removedProductIds, replace: Boolean(input.replace) },
    });
  });

  return getInventorySupplier(referenceId);
}

export async function createStockMovement(input: CreateStockMovementInput) {
  const product = await prisma.product.findUnique({
    where: { referenceId: input.productId },
  });

  if (!product) {
    throw new Error(`Product ${input.productId} was not found.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: {
        movementKey: `STK_${product.referenceId}_${Date.now()}`,
        productId: product.id,
        movementType: stockMovementTypeKeys[input.type],
        quantity: input.quantity,
        occurredAt: new Date(),
        note: input.note,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      },
    });

    await enqueueDomainEvent(tx, {
      type: 'stock.updated',
      aggregateType: 'STOCK_MOVEMENT',
      aggregateId: product.referenceId,
      productId: product.id,
      payload: {
        movementType: input.type,
        quantity: input.quantity,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      },
    });
  });

  const updated = await prisma.product.findUnique({
    where: { id: product.id },
    ...productDetailArgs,
  });

  if (!updated) {
    throw new Error(`Product ${input.productId} could not be reloaded.`);
  }

  return buildStockPosition(updated);
}

export async function listStockPositions() {
  const records = await prisma.product.findMany({
    ...productDetailArgs,
    orderBy: { name: 'asc' },
  });

  return records.map((record) => buildStockPosition(record));
}

export async function createPriceListImport(input: CreatePriceListImportInput): Promise<PriceListImportResult> {
  const batch = await prisma.priceListImportBatch.create({
    data: {
      batchKey: `IMP_${Date.now()}`,
      fileName: input.fileName,
      sourceType: input.sourceType.toUpperCase() as 'CSV' | 'XLSX' | 'JSON' | 'MANUAL',
      status: 'STAGED',
      rowCount: input.rows.length,
      rows: {
        create: input.rows.map((row, index) => ({
          rowNumber: index + 1,
          publicSku: row.publicSku,
          name: row.name,
          categoryLabel: String(row.category),
          productTypeLabel: row.productType,
          finishLabel: row.finish ?? null,
          collectionName: row.collection,
          description: row.description,
          sellPriceZar: row.sellPriceZar ?? null,
          unitCostZar: row.unitCostZar ?? null,
          linkedSupplierKey: row.linkedSupplierId ?? null,
          pricingUnit: row.pricingUnit ? String(row.pricingUnit) : null,
          lengthMm: row.lengthMm ?? null,
          widthMm: row.widthMm ?? null,
          heightMm: row.heightMm ?? null,
          weightKg: row.weightKg ?? null,
          piecesPerPallet: row.piecesPerPallet ?? null,
          boxesPerPallet: row.boxesPerPallet ?? null,
          palletsPerTruck: row.palletsPerTruck ?? null,
          primaryImageUrl: row.primaryImageUrl ?? null,
          galleryImageUrl: row.galleryImageUrl ?? null,
          faceImageUrl: row.faceImageUrl ?? null,
          heroImageUrl: row.heroImageUrl ?? null,
          tags: row.tags ?? [],
          rawData: row as unknown as Prisma.InputJsonValue,
        })) as any,
      },
    },
    include: { rows: true },
  });

  return {
    batchId: batch.id,
    fileName: batch.fileName,
    sourceType: input.sourceType,
    status: 'Staged',
    rowCount: batch.rows.length,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errors: [],
  };
}

export async function applyPriceListImport(batchId: string): Promise<PriceListImportResult> {
  const batch = await prisma.priceListImportBatch.findUnique({
    where: { id: batchId },
    include: { rows: true },
  });

  if (!batch) {
    throw new Error(`Import batch ${batchId} was not found.`);
  }

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  const fallbackSupplier = await prisma.supplier.findFirst({
    where: { status: 'ACTIVE' },
    include: { locations: true },
    orderBy: { name: 'asc' },
  });

  for (const row of batch.rows) {
    try {
      const rowData = row as typeof row & { piecesPerPallet: number | null; boxesPerPallet: number | null; palletsPerTruck: number | null };
      const category = normalizeCategory(row.categoryLabel);
      const productType = normalizeProductType(category, row.productTypeLabel);
      const finish = normalizeFinish(category, row.finishLabel ?? undefined);
      const pricingUnit = normalizePricingUnit(category, row.pricingUnit ?? undefined);
      const categoryDefaults = quoteDefaultsByCategory[category];
      const supplier = row.linkedSupplierKey
        ? await prisma.supplier.findUnique({
            where: { supplierKey: row.linkedSupplierKey },
            include: { locations: true },
          })
        : fallbackSupplier;

      if (!supplier || !supplier.locations[0]) {
        throw new Error(`No supplier with an origin location is available for ${row.publicSku}.`);
      }

      const coverageOrientation = defaultCoverageOrientation(category);
      const coverage = row.lengthMm && row.widthMm && row.heightMm
        ? computeCoverageMetrics({
            category,
            lengthMm: row.lengthMm,
            widthMm: row.widthMm,
            heightMm: row.heightMm,
            coverageOrientation,
            piecesPerPallet: rowData.piecesPerPallet ?? undefined,
            boxesPerPallet: rowData.boxesPerPallet ?? undefined,
          })
        : null;

      const existing = await prisma.product.findUnique({
        where: { publicSku: row.publicSku },
        include: {
          productSuppliers: true,
        },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            category: categoryKeys[category],
            productType: productTypeKeys[productType],
            finish: finish ? finishKeys[finish] : null,
            collectionName: row.collectionName,
            description: row.description ?? existing.description,
            sellPriceZar: row.sellPriceZar ?? existing.sellPriceZar,
            pricingUnit: pricingUnitKeys[pricingUnit],
            primaryImageUrl: row.primaryImageUrl ?? existing.primaryImageUrl,
            galleryImageUrl: row.galleryImageUrl ?? existing.galleryImageUrl,
            faceImageUrl: row.faceImageUrl ?? existing.faceImageUrl,
            heroImageUrl: row.heroImageUrl ?? existing.heroImageUrl,
            lengthMm: row.lengthMm ?? existing.lengthMm,
            widthMm: row.widthMm ?? existing.widthMm,
            heightMm: row.heightMm ?? existing.heightMm,
            coverageOrientation: coverage ? coverageOrientationKeys[coverageOrientation] : existing.coverageOrientation,
            faceAreaM2: coverage?.faceAreaM2 ?? existing.faceAreaM2,
            unitsPerM2: coverage?.unitsPerM2 ?? existing.unitsPerM2,
            weightKg: row.weightKg ?? existing.weightKg,
            piecesPerPallet: rowData.piecesPerPallet ?? (existing as any).piecesPerPallet,
            boxesPerPallet: rowData.boxesPerPallet ?? (existing as any).boxesPerPallet,
            palletsPerTruck: rowData.palletsPerTruck ?? (existing as any).palletsPerTruck,
            presentationTags: row.tags,
            availabilityStatus: supplier.status === 'ACTIVE' ? 'READY_TO_PROCURE' : supplier.status === 'ONBOARDING' ? 'SUPPLIER_ONBOARDING' : 'SUPPLIER_DELAYED',
          } as any,
        });

        if (row.unitCostZar !== null && row.unitCostZar !== undefined) {
          const defaultSupplier = existing.productSuppliers.find((link) => link.isDefault) ?? existing.productSuppliers[0];

          if (defaultSupplier) {
            await prisma.productSupplier.update({
              where: { id: defaultSupplier.id },
              data: {
                unitCostZar: row.unitCostZar,
                supplierId: supplier.id,
                originLocationId: supplier.locations[0].id,
                leadTimeDays: supplier.leadTimeDays ?? defaultSupplier.leadTimeDays,
              },
            });
          } else {
            await prisma.productSupplier.create({
              data: {
                productId: existing.id,
                supplierId: supplier.id,
                originLocationId: supplier.locations[0].id,
                isDefault: true,
                unitCostZar: row.unitCostZar,
                leadTimeDays: supplier.leadTimeDays ?? null,
                minimumOrderQuantity: 1,
                paymentTerms: 'Imported',
                incoterms: 'Imported',
              },
            });
          }
        }

        await prisma.priceListImportRow.update({
          where: { id: row.id },
          data: {
            actionTaken: 'Updated',
            appliedProductId: existing.id,
          },
        });
        updatedCount += 1;
        continue;
      }

      const created = await prisma.product.create({
        data: {
          referenceId: generateReferenceIdFromSku(row.publicSku),
          publicSku: row.publicSku,
          name: row.name,
          category: categoryKeys[category],
          productType: productTypeKeys[productType],
          finish: finish ? finishKeys[finish] : null,
          collectionName: row.collectionName,
          presentationTags: row.tags,
          lifecycleStatus: 'DRAFT',
          publishStatus: 'NOT_READY',
          inventoryMode: 'DROPSHIP',
          availabilityStatus: supplier.status === 'ACTIVE' ? 'READY_TO_PROCURE' : supplier.status === 'ONBOARDING' ? 'SUPPLIER_ONBOARDING' : 'SUPPLIER_DELAYED',
          pricingUnit: pricingUnitKeys[pricingUnit],
          sellPriceZar: row.sellPriceZar ?? null,
          primaryImageUrl: row.primaryImageUrl,
          galleryImageUrl: row.galleryImageUrl,
          faceImageUrl: row.faceImageUrl,
          heroImageUrl: row.heroImageUrl ?? row.primaryImageUrl,
          description: row.description ?? `${row.name} imported from supplier price list.`,
          marketingCopy: '',
          technicalSpecifications: {},
          lengthMm: row.lengthMm ?? null,
          widthMm: row.widthMm ?? null,
          heightMm: row.heightMm ?? null,
          coverageOrientation: coverage ? coverageOrientationKeys[coverageOrientation] : null,
          faceAreaM2: coverage?.faceAreaM2 ?? null,
          unitsPerM2: coverage?.unitsPerM2 ?? null,
          weightKg: row.weightKg ?? null,
          piecesPerPallet: rowData.piecesPerPallet ?? categoryDefaults.piecesPerPallet,
          boxesPerPallet: rowData.boxesPerPallet ?? (categoryDefaults.boxesPerPallet || null),
          palletsPerTruck: rowData.palletsPerTruck ?? categoryDefaults.palletsPerTruck,
          reorderPoint: 0,
        } as any,
      });

      await prisma.productSupplier.create({
        data: {
          productId: created.id,
          supplierId: supplier.id,
          originLocationId: supplier.locations[0].id,
          isDefault: true,
          unitCostZar: row.unitCostZar ?? 0,
          leadTimeDays: supplier.leadTimeDays,
          minimumOrderQuantity: 1,
          paymentTerms: 'Imported',
          incoterms: 'Imported',
        },
      });

      await prisma.productHistoryEvent.create({
        data: {
          productId: created.id,
          eventType: 'IMPORT_APPLIED',
          actionLabel: 'Imported from Price List',
          userName: 'Inventory Importer',
          details: batch.fileName,
          occurredAt: new Date(),
        },
      });

      await prisma.priceListImportRow.update({
        where: { id: row.id },
        data: {
          actionTaken: 'Created',
          appliedProductId: created.id,
        },
      });
      createdCount += 1;
    } catch (error) {
      skippedCount += 1;
      const message = error instanceof Error ? error.message : `Failed to apply ${row.publicSku}`;
      errors.push(message);
      await prisma.priceListImportRow.update({
        where: { id: row.id },
        data: {
          actionTaken: 'Skipped',
          errorMessage: message,
        },
      });
    }
  }

  await prisma.priceListImportBatch.update({
    where: { id: batch.id },
    data: {
      status: errors.length > 0 ? 'FAILED' : 'APPLIED',
      appliedAt: errors.length > 0 ? null : new Date(),
    },
  });

  await enqueueDomainEvent(prisma, {
    type: 'price_list_import.applied',
    aggregateType: 'PRICE_LIST_IMPORT',
    aggregateId: batch.id,
    payload: {
      fileName: batch.fileName,
      createdCount,
      updatedCount,
      skippedCount,
      failed: errors.length > 0,
    },
  });

  return {
    batchId: batch.id,
    fileName: batch.fileName,
    sourceType: batch.sourceType.toLowerCase() as PriceListImportResult['sourceType'],
    status: errors.length > 0 ? 'Failed' : 'Applied',
    rowCount: batch.rows.length,
    createdCount,
    updatedCount,
    skippedCount,
    errors,
  };
}

export async function createLogisticsQuote(input: CreateLogisticsQuoteInput): Promise<LogisticsQuote> {
  const product = await prisma.product.findUnique({
    where: { referenceId: input.productId },
    include: {
      productSuppliers: {
        include: {
          supplier: true,
          originLocation: true,
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!product) {
    throw new Error(`Product ${input.productId} was not found.`);
  }

  const productSupplier = input.supplierId
    ? product.productSuppliers.find((link) => link.supplier.supplierKey === input.supplierId)
    : product.productSuppliers.find((link) => link.isDefault) ?? product.productSuppliers[0];

  if (!productSupplier) {
    throw new Error(`No supplier linkage found for ${input.productId}.`);
  }

  const rateCard = await prisma.logisticsRateCard.findFirst({
    where: {
      supplierId: productSupplier.supplierId,
      originLocationId: productSupplier.originLocationId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!rateCard) {
    throw new Error(`No active rate card found for ${productSupplier.supplier.name}.`);
  }

  const inventoryCategory = categoryLabels[product.category];
  const quoteModel: ProductQuoteModel = {
    inventoryProductId: product.referenceId,
    name: product.name,
    categoryKey: quoteCategoryByInventoryCategory[inventoryCategory],
    pricingUnit: pricingUnitLabels[product.pricingUnit] as InventoryPricingUnit,
    sellPriceZar: toNumber(product.sellPriceZar),
    unitsPerM2: toNumber(product.unitsPerM2),
    weightPerPieceKg: toNumber(product.weightKg),
    piecesPerPallet: product.piecesPerPallet,
    boxesPerPallet: (product as any).boxesPerPallet ?? null,
    palletsPerTruck: product.palletsPerTruck,
    logistics: {
      costPricePerKm: toNumber(rateCard.costPerKm),
      sellPricePerKm: toNumber(rateCard.sellPricePerKm),
      fixedFee: 0,
      minimumCharge: 0,
      originRegion: productSupplier.originLocation.region,
      originCity: productSupplier.originLocation.city,
      originLatitude: productSupplier.originLocation.latitude,
      originLongitude: productSupplier.originLocation.longitude,
    },
  };
  const liveDistanceKm =
    input.distanceKm === undefined
      ? await resolveLiveDistanceKm({
          originLatitude: productSupplier.originLocation.latitude,
          originLongitude: productSupplier.originLocation.longitude,
          destinationRegion: input.destinationRegion ?? input.destinationLabel,
        }).catch(() => null)
      : null;
  const distanceResolution =
    input.distanceKm !== undefined
      ? { distanceKm: round(Math.max(0, input.distanceKm), 2), source: 'fallback' as const }
      : liveDistanceKm !== null
        ? { distanceKm: liveDistanceKm, source: 'live' as const }
        : resolveTransportDistance({
            product: quoteModel,
            province: input.destinationRegion ?? input.destinationLabel,
          });
  const distanceKm = distanceResolution.distanceKm;
  const costPerKm = toNumber(rateCard.costPerKm);
  const sellPricePerKm = toNumber(rateCard.sellPricePerKm);
  const fixedFee = 0;
  const minimumCharge = 0;
  const logisticsCost = round(distanceKm * costPerKm, 2);
  const logisticsSellPrice = round(distanceKm * sellPricePerKm, 2);

  const quote = await prisma.logisticsQuoteSnapshot.create({
    data: {
      quoteKey: `LQS_${Date.now()}`,
      productId: product.id,
      supplierId: productSupplier.supplierId,
      originLocationId: productSupplier.originLocationId,
      rateCardId: rateCard.id,
      destinationLabel: input.destinationLabel,
      distanceKm,
      distanceSource: distanceResolution.source,
      costPerKm,
      sellPricePerKm,
      fixedFee,
      minimumCharge,
      logisticsCost,
      logisticsSellPrice,
      currency: 'ZAR',
    },
  });

  await enqueueDomainEvent(prisma, {
    type: 'logistics.quote_created',
    aggregateType: 'LOGISTICS_QUOTE',
    aggregateId: quote.id,
    supplierId: productSupplier.supplierId,
    productId: product.id,
    payload: {
      destinationLabel: input.destinationLabel,
      distanceKm,
      logisticsSellPrice,
    },
  });

  return {
    id: quote.id,
    productId: product.referenceId,
    supplierId: productSupplier.supplier.supplierKey,
    supplierName: productSupplier.supplier.name,
    originLocationId: productSupplier.originLocation.locationKey,
    originLocationLabel: productSupplier.originLocation.label,
    destinationLabel: quote.destinationLabel,
    distanceKm: toNumber(quote.distanceKm),
    distanceSource: quote.distanceSource as LogisticsQuote['distanceSource'],
    costPerKm: toNumber(quote.costPerKm),
    sellPricePerKm: toNumber(quote.sellPricePerKm),
    fixedFee: toNumber(quote.fixedFee),
    minimumCharge: toNumber(quote.minimumCharge),
    logisticsCost: toNumber(quote.logisticsCost),
    logisticsSellPrice: toNumber(quote.logisticsSellPrice),
    currency: 'ZAR',
    createdAt: quote.createdAt.toISOString(),
  };
}

export async function getInventoryDashboard(): Promise<InventoryDashboardSnapshot> {
  const details = await listInventoryProductDetails();
  const latestActivityAt = details
    .flatMap((product) => product.history.map((event) => event.date))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
  const currentMonthStart = startOfUtcMonth(new Date());
  const monthStarts = Array.from({ length: 12 }, (_value, index) => addUtcMonths(currentMonthStart, index - 11));
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      orderedAt: {
        gte: monthStarts[0],
      },
    },
    select: {
      orderedAt: true,
      totalAmount: true,
    },
  });

  const availabilityAlerts = details
    .filter((product) => product.stockPosition.availabilityStatus !== 'Ready to Procure')
    .map((product) => {
      const severity: 'Critical' | 'Warning' =
        product.stockPosition.availabilityStatus === 'Missing Supplier' ? 'Critical' : 'Warning';

      return {
        id: product.id,
        name: product.name,
        supplierName: product.stockPosition.linkedSupplierName,
        leadTime: product.stockPosition.leadTimeLabel,
        status: product.stockPosition.availabilityStatus as Exclude<StockPosition['availabilityStatus'], 'Ready to Procure'>,
        message:
          product.stockPosition.availabilityStatus === 'Supplier Delayed'
            ? 'Supplier is delayed and procurement lead time is elevated.'
            : product.stockPosition.availabilityStatus === 'Supplier Onboarding'
            ? 'Supplier onboarding is incomplete before live procurement.'
            : 'No primary supplier is linked to this SKU.',
        severity,
      };
    });

  const assetCoverage = details.map((product) => {
    const images = product.media.filter((asset) => asset.type === 'Image').length;
    const campaigns = new Set(product.media.flatMap((asset) => asset.linkedCampaignIds ?? [])).size;
    const model3D = product.media.some((asset) => asset.type === '3D Asset' || asset.type === '2.5D Asset' || asset.type === 'Model');
    const renders = product.media.filter((asset) => asset.type === '3D Render').length;
    const health = product.readiness.assetReadiness >= 90
      ? 'Excellent'
      : product.readiness.assetReadiness >= 70
      ? 'Good'
      : product.readiness.assetReadiness > 0
      ? 'Needs Assets'
      : 'Missing All';

    return {
      id: product.id,
      name: product.name,
      images,
      campaigns,
      model3D,
      renders,
      health,
    } as const;
  });

  const categoryCounts = new Map<string, number>();
  for (const product of details) {
    categoryCounts.set(product.category, (categoryCounts.get(product.category) ?? 0) + 1);
  }

  const categoryDistribution = Array.from(categoryCounts.entries()).map(([label, count]) => ({
    label,
    value: round((count / Math.max(1, details.length)) * 100),
  }));

  const procurementPressure = details.map((product) => {
    const leadTimeText = product.stockPosition.leadTimeLabel ?? '';
    const numericLead = Number.parseInt(leadTimeText, 10);
    const leadDays = Number.isFinite(numericLead) ? numericLead : 7;
    const baseOrderQuantity =
      product.pricing.unit === 'piece'
        ? Math.max(1, product.packaging.piecesPerPallet || Math.ceil(product.dimensions.unitsPerM2 || 1))
        : product.pricing.unit === 'm2'
          ? Math.max(1, Math.round(product.packaging.sqmPerBox || 1))
          : 1;
    const baseExposureZar = round(product.pricing.costPriceZar * baseOrderQuantity, 2);
    const severity =
      product.stockPosition.availabilityStatus === 'Missing Supplier'
        ? 'Critical'
        : product.stockPosition.availabilityStatus === 'Ready to Procure'
          ? 'Healthy'
          : 'Warning';
    const severityWeight =
      severity === 'Critical'
        ? 1.4
        : severity === 'Warning'
          ? 1.15
          : 0.65;
    const pressureScore = round((severityWeight * 100) + Math.min(60, leadDays) + Math.min(120, baseExposureZar / 250), 1);
    const reason =
      product.stockPosition.availabilityStatus === 'Missing Supplier'
        ? 'Primary supplier linkage is missing.'
        : product.stockPosition.availabilityStatus === 'Supplier Onboarding'
          ? 'Supplier onboarding is incomplete before procurement can run cleanly.'
          : product.stockPosition.availabilityStatus === 'Supplier Delayed'
            ? 'Supplier lead time is elevated against current procurement expectations.'
            : 'Supplier and procurement path are healthy.';

    return {
      productId: product.id,
      productName: product.name,
      severity,
      leadDays,
      baseExposureZar,
      pressureScore,
      reason,
      actionLabel:
        severity === 'Critical'
          ? 'Resolve Supplier Link'
          : severity === 'Warning'
            ? 'Review Supplier Timeline'
            : 'Monitor Procurement',
    } as const;
  });

  const procurementFocus = [...procurementPressure]
    .sort((left, right) => right.pressureScore - left.pressureScore)[0] ?? null;

  const actualProcurementByMonth = new Map<string, number>();
  for (const purchaseOrder of purchaseOrders) {
    const key = monthBucketKey(startOfUtcMonth(purchaseOrder.orderedAt));
    actualProcurementByMonth.set(
      key,
      round((actualProcurementByMonth.get(key) ?? 0) + toNumber(purchaseOrder.totalAmount), 2),
    );
  }

  const activeProcurementExposure = procurementPressure
    .filter((entry) => entry.severity !== 'Healthy')
    .reduce((total, entry) => total + (entry.baseExposureZar * (entry.severity === 'Critical' ? 1.2 : 1)), 0);

  const rawProcurementSeries = monthStarts.map((monthStart, index) => {
    const label = monthBucketLabel(monthStart);
    const key = monthBucketKey(monthStart);
    const currentValueZar = actualProcurementByMonth.get(key) ?? 0;
    const previousKeys = monthStarts
      .slice(Math.max(0, index - 2), index + 1)
      .map((bucket) => monthBucketKey(bucket));
    const trailingAverageZar =
      previousKeys.reduce((total, bucketKey) => total + (actualProcurementByMonth.get(bucketKey) ?? 0), 0) /
      Math.max(1, previousKeys.length);
    const predictedValueZar = round(
      (trailingAverageZar * 0.65) + (currentValueZar * 0.35) + (activeProcurementExposure / 3),
      2,
    );

    return {
      label,
      currentValueZar,
      predictedValueZar,
    };
  });

  const maxProcurementValue = Math.max(
    1,
    ...rawProcurementSeries.map((entry) => entry.currentValueZar),
    ...rawProcurementSeries.map((entry) => entry.predictedValueZar),
  );

  const procurementSeries = rawProcurementSeries.map((entry) => ({
    label: entry.label,
    current: round((entry.currentValueZar / maxProcurementValue) * 100),
    predicted: round((entry.predictedValueZar / maxProcurementValue) * 100),
    currentValueZar: entry.currentValueZar,
    predictedValueZar: entry.predictedValueZar,
  }));

  const topPerformers = [...details]
    .sort((left, right) => right.readiness.catalogHealth - left.readiness.catalogHealth)
    .slice(0, 3);

  const full3dProducts = details.filter((product) => product.readiness.checklist.asset2_5d && product.readiness.checklist.asset3d);
  const baselineProducts = details.filter((product) => !(product.readiness.checklist.asset2_5d && product.readiness.checklist.asset3d));
  const full3dPublishAverage =
    full3dProducts.reduce((total, product) => total + product.readiness.publishReadiness, 0) /
    Math.max(1, full3dProducts.length);
  const baselinePublishAverage =
    baselineProducts.reduce((total, product) => total + product.readiness.publishReadiness, 0) /
    Math.max(1, baselineProducts.length);
  const communityCoveredProducts = details.filter((product) =>
    product.media.some((asset) => asset.role === 'project_image' || asset.role === 'generated_image'),
  ).length;

  const summary = {
    totalProducts: details.length,
    supplierAlertCount: availabilityAlerts.length,
    globalCatalogHealth: round(details.reduce((total, product) => total + product.readiness.catalogHealth, 0) / Math.max(1, details.length)),
    globalAssetReadiness: round(details.reduce((total, product) => total + product.readiness.assetReadiness, 0) / Math.max(1, details.length), 1),
    globalThreedReadiness: round(details.reduce((total, product) => total + product.readiness.threedReadiness, 0) / Math.max(1, details.length), 1),
    globalMarketingReadiness: round(details.reduce((total, product) => total + product.readiness.marketingReadiness, 0) / Math.max(1, details.length), 1),
    globalPublishReadiness: round(details.reduce((total, product) => total + product.readiness.publishReadiness, 0) / Math.max(1, details.length), 1),
  };

  return {
    generatedAt: new Date().toISOString(),
    latestActivityAt: latestActivityAt ? new Date(latestActivityAt).toISOString() : null,
    summary,
    availabilityAlerts,
    assetCoverage,
    procurementSeries,
    categoryDistribution,
    assetRoi: {
      threedPublishLift: round(Math.max(0, full3dPublishAverage - baselinePublishAverage), 1),
      communityCoverage: round((communityCoveredProducts / Math.max(1, details.length)) * 100, 1),
    },
    procurementFocus: procurementFocus
      ? {
          productId: procurementFocus.productId,
          productName: procurementFocus.productName,
          severity: procurementFocus.severity,
          reason: procurementFocus.reason,
          actionLabel: procurementFocus.actionLabel,
        }
      : null,
    topPerformers,
  };
}
