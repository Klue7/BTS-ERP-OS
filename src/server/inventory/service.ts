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
import type {
  AssetSlotInput,
  CoverageOrientation,
  CreateInventoryAssetInput,
  CreateInventoryProductInput,
  CreateLogisticsQuoteInput,
  CreatePriceListImportInput,
  CreateStockMovementInput,
  CreateSupplierInput,
  InventoryAssetRole,
  InventoryAssetSource,
  InventoryCategory,
  InventoryDashboardSnapshot,
  InventoryFinish,
  InventoryProductDetail,
  InventoryProductSummary,
  InventoryProductType,
  InventoryPricingUnit,
  LogisticsQuote,
  PriceListImportResult,
  ReadinessSnapshot,
  StockPosition,
  SupplierSummary,
  UpdateInventoryProductInput,
} from '../../inventory/contracts';

const PLACEHOLDER_IMAGE = 'https://picsum.photos/seed/btsinventoryplaceholder/800/800';

const productInclude = {
  productSuppliers: {
    include: {
      supplier: {
        include: {
          productSuppliers: true,
          locations: true,
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
  historyEvents: {
    orderBy: { occurredAt: 'desc' },
  },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type SupplierRecord = Prisma.SupplierGetPayload<{
  include: { productSuppliers: true; locations: true };
}>;

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
} as const;

const supplierTypeLabels = {
  MANUFACTURER: 'Manufacturer',
  DISTRIBUTOR: 'Distributor',
  WHOLESALER: 'Wholesaler',
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

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
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

function normalizePricingUnit(value?: string | null): InventoryPricingUnit {
  if (!value) {
    return 'm2';
  }

  const normalized = value.trim().toLowerCase();
  const canonical = pricingUnitOptions.find((option) => option === normalized);

  if (!canonical) {
    throw new Error(`Unsupported pricing unit "${value}".`);
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

function computeCoverageMetrics(dimensions: {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  coverageOrientation: CoverageOrientation;
}) {
  const { lengthMm, widthMm, heightMm, coverageOrientation } = dimensions;
  let coverageFace = lengthMm * widthMm;

  if (coverageOrientation === 'Length x Height') {
    coverageFace = lengthMm * heightMm;
  } else if (coverageOrientation === 'Width x Height') {
    coverageFace = widthMm * heightMm;
  }

  const faceAreaM2 = coverageFace / 1_000_000;
  const unitsPerM2 = faceAreaM2 > 0 ? 1 / faceAreaM2 : 0;

  return {
    faceAreaM2: round(faceAreaM2, 4),
    unitsPerM2: round(unitsPerM2, 4),
  };
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
  entries.push(['Weight', `${toNumber(record.weightKg).toFixed(2)}kg`]);

  return Object.fromEntries(entries);
}

function buildSupplierSummary(record: SupplierRecord): SupplierSummary {
  return {
    id: record.supplierKey,
    name: record.name,
    logo: record.logoUrl ?? '',
    status: supplierStatusLabels[record.status],
    type: supplierTypeLabels[record.supplierType],
    capabilities: record.capabilities,
    region: record.regionLabel,
    leadTime: record.leadTimeLabel ?? 'TBD',
    productCount: record.productSuppliers.length,
    rating: toNumber(record.rating),
    blocker: record.blocker ?? undefined,
    locations: record.locations.map((location) => ({
      id: location.locationKey,
      label: location.label,
      type: locationTypeLabels[location.type],
      country: location.country,
      region: location.region,
      city: location.city,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
    })),
    contacts: (record.contacts as SupplierSummary['contacts'] | null) ?? [],
    terms: (record.terms as SupplierSummary['terms'] | null) ?? {
      payment: 'TBD',
      delivery: 'TBD',
      moq: 'TBD',
      currency: 'ZAR',
      incoterms: 'TBD',
    },
    performance: (record.performance as SupplierSummary['performance'] | null) ?? {
      onTimeDelivery: 0,
      qualityScore: 0,
      returnRate: 0,
      priceCompetitiveness: 0,
    },
    workflowMilestones: (record.workflowMilestones as SupplierSummary['workflowMilestones'] | null) ?? {
      onboarded: false,
      linkedToProducts: false,
      poIssued: false,
      dispatchReady: false,
      claimsVerified: false,
    },
    orders: (record.orderSummary as SupplierSummary['orders'] | null) ?? [],
    history: (record.historySummary as SupplierSummary['history'] | null) ?? [],
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

function buildProductDetail(record: ProductRecord): InventoryProductDetail {
  const summary = buildProductSummary(record);
  const defaultSupplier = record.productSuppliers.find((link) => link.isDefault) ?? record.productSuppliers[0];

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
      sellPricePerKm: undefined,
      fixedFee: undefined,
      minimumCharge: undefined,
      currency: 'ZAR',
    },
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
  const pricingUnit = normalizePricingUnit(input.pricingUnit);
  const coverageOrientation = normalizeCoverageOrientation(input.dimensions.coverageOrientation, category);

  ensurePositiveNumber(input.unitCostZar, 'Unit cost (ZAR)');
  ensurePositiveNumber(input.dimensions.lengthMm, 'Length');
  ensurePositiveNumber(input.dimensions.widthMm, 'Width');
  ensurePositiveNumber(input.dimensions.heightMm, 'Height');
  ensurePositiveNumber(input.dimensions.weightKg, 'Weight');

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
    include: productInclude,
    orderBy: { name: 'asc' },
  });

  return records.map((record) => buildProductSummary(record));
}

export async function listInventoryProductDetails() {
  const records = await prisma.product.findMany({
    include: productInclude,
    orderBy: { name: 'asc' },
  });

  return records.map((record) => buildProductDetail(record));
}

export async function getInventoryProduct(referenceId: string) {
  const record = await prisma.product.findUnique({
    where: { referenceId },
    include: productInclude,
  });

  if (!record) {
    throw new Error(`Product ${referenceId} was not found.`);
  }

  return buildProductDetail(record);
}

export async function listInventorySuppliers() {
  const records = await prisma.supplier.findMany({
    include: {
      productSuppliers: true,
      locations: true,
    },
    orderBy: { name: 'asc' },
  });

  return records.map((record) => buildSupplierSummary(record));
}

export async function createInventoryProduct(input: CreateInventoryProductInput) {
  const { category, productType, finish, pricingUnit, coverageOrientation } = validateCreatePayload(input);
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
    lengthMm: input.dimensions.lengthMm,
    widthMm: input.dimensions.widthMm,
    heightMm: input.dimensions.heightMm,
    coverageOrientation,
  });

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
        reorderPoint: 0,
      },
    });

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

  const category = input.category ? normalizeCategory(input.category) : undefined;
  const productType = category && input.productType ? normalizeProductType(category, input.productType) : undefined;
  const finish = category ? normalizeFinish(category, input.finish) : undefined;
  const coverageOrientation = input.dimensions?.coverageOrientation
    ? normalizeCoverageOrientation(input.dimensions.coverageOrientation, category ?? categoryLabels[product.category])
    : undefined;

  const lengthMm = input.dimensions?.lengthMm ?? product.lengthMm ?? undefined;
  const widthMm = input.dimensions?.widthMm ?? product.widthMm ?? undefined;
  const heightMm = input.dimensions?.heightMm ?? product.heightMm ?? undefined;
  const weightKg = input.dimensions?.weightKg ?? toNumber(product.weightKg);
  const coverage = lengthMm && widthMm && heightMm
    ? computeCoverageMetrics({
        lengthMm,
        widthMm,
        heightMm,
        coverageOrientation: coverageOrientation ?? coverageOrientationLabels[product.coverageOrientation ?? 'LENGTH_X_HEIGHT'],
      })
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: product.id },
      data: {
        name: input.name?.trim(),
        category: category ? categoryKeys[category] : undefined,
        productType: productType ? productTypeKeys[productType] : undefined,
        finish: finish === null ? null : finish ? finishKeys[finish] : undefined,
        collectionName: input.collection === undefined ? undefined : input.collection?.trim() || null,
        description: input.description?.trim(),
        marketingCopy: input.marketingCopy,
        sellPriceZar: input.sellPriceZar === null ? null : input.sellPriceZar,
        publishStatus: input.publishStatus ? publishStatusMap[input.publishStatus] : undefined,
        lifecycleStatus: input.status ? lifecycleStatusMap[input.status] : undefined,
        technicalSpecifications: input.specifications ? (input.specifications as Prisma.InputJsonValue) : undefined,
        lengthMm: input.dimensions?.lengthMm,
        widthMm: input.dimensions?.widthMm,
        heightMm: input.dimensions?.heightMm,
        coverageOrientation: coverageOrientation ? coverageOrientationKeys[coverageOrientation] : undefined,
        faceAreaM2: coverage?.faceAreaM2,
        unitsPerM2: coverage?.unitsPerM2,
        weightKg: input.dimensions?.weightKg,
      },
    });

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

    await tx.productHistoryEvent.create({
      data: {
        productId: product.id,
        eventType: 'PRODUCT_UPDATED',
        actionLabel: 'Product Updated',
        userName: 'Inventory API',
        details: 'Updated through the Inventory OS',
        occurredAt: new Date(),
      },
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

  return getInventoryProductAssets(referenceId);
}

export async function createSupplier(input: CreateSupplierInput) {
  const created = await prisma.supplier.create({
    data: {
      supplierKey: `VND_${Date.now()}`,
      name: input.name,
      status: supplierStatusKeys[input.status ?? 'Active'],
      supplierType: supplierTypeKeys[input.type],
      capabilities: input.capabilities ?? [],
      regionLabel: input.region ?? 'Unassigned',
      leadTimeLabel: input.leadTime ?? 'TBD',
      contacts: [],
      terms: {
        payment: 'TBD',
        delivery: 'TBD',
        moq: 'TBD',
        currency: input.currency ?? 'ZAR',
        incoterms: 'TBD',
      },
      performance: {
        onTimeDelivery: 0,
        qualityScore: 0,
        returnRate: 0,
        priceCompetitiveness: 0,
      },
      workflowMilestones: {
        onboarded: true,
        linkedToProducts: false,
        poIssued: false,
        dispatchReady: false,
        claimsVerified: false,
      },
      orderSummary: [],
      historySummary: [],
      locations: input.location
        ? {
            create: {
              locationKey: `LOC_${Date.now()}`,
              type: 'SUPPLIER_ORIGIN',
              label: input.location.label,
              country: input.location.country,
              region: input.location.region,
              city: input.location.city,
              latitude: input.location.latitude ?? null,
              longitude: input.location.longitude ?? null,
            },
          }
        : undefined,
    },
    include: {
      productSuppliers: true,
      locations: true,
    },
  });

  return buildSupplierSummary(created);
}

export async function createStockMovement(input: CreateStockMovementInput) {
  const product = await prisma.product.findUnique({
    where: { referenceId: input.productId },
  });

  if (!product) {
    throw new Error(`Product ${input.productId} was not found.`);
  }

  await prisma.stockMovement.create({
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

  const updated = await prisma.product.findUnique({
    where: { id: product.id },
    include: productInclude,
  });

  if (!updated) {
    throw new Error(`Product ${input.productId} could not be reloaded.`);
  }

  return buildStockPosition(updated);
}

export async function listStockPositions() {
  const records = await prisma.product.findMany({
    include: productInclude,
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
          primaryImageUrl: row.primaryImageUrl ?? null,
          galleryImageUrl: row.galleryImageUrl ?? null,
          faceImageUrl: row.faceImageUrl ?? null,
          heroImageUrl: row.heroImageUrl ?? null,
          tags: row.tags ?? [],
          rawData: row as unknown as Prisma.InputJsonValue,
        })),
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
      const category = normalizeCategory(row.categoryLabel);
      const productType = normalizeProductType(category, row.productTypeLabel);
      const finish = normalizeFinish(category, row.finishLabel ?? undefined);
      const pricingUnit = normalizePricingUnit(row.pricingUnit ?? undefined);
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
            lengthMm: row.lengthMm,
            widthMm: row.widthMm,
            heightMm: row.heightMm,
            coverageOrientation,
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
            presentationTags: row.tags,
            availabilityStatus: supplier.status === 'ACTIVE' ? 'READY_TO_PROCURE' : supplier.status === 'ONBOARDING' ? 'SUPPLIER_ONBOARDING' : 'SUPPLIER_DELAYED',
          },
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
          reorderPoint: 0,
        },
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

  const distanceKm = input.distanceKm;
  const costPerKm = toNumber(rateCard.costPerKm);
  const sellPricePerKm = toNumber(rateCard.sellPricePerKm);
  const fixedFee = toNumber(rateCard.fixedFee);
  const minimumCharge = toNumber(rateCard.minimumCharge);
  const rawCost = round((distanceKm * costPerKm) + fixedFee, 2);
  const rawSell = round((distanceKm * sellPricePerKm) + fixedFee, 2);
  const logisticsCost = Math.max(rawCost, minimumCharge);
  const logisticsSellPrice = Math.max(rawSell, minimumCharge);

  const quote = await prisma.logisticsQuoteSnapshot.create({
    data: {
      quoteKey: `LQS_${Date.now()}`,
      productId: product.id,
      supplierId: productSupplier.supplierId,
      originLocationId: productSupplier.originLocationId,
      rateCardId: rateCard.id,
      destinationLabel: input.destinationLabel,
      distanceKm,
      costPerKm,
      sellPricePerKm,
      fixedFee,
      minimumCharge,
      logisticsCost,
      logisticsSellPrice,
      currency: 'ZAR',
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

  const averageLeadTime = details.reduce((total, product) => {
    const leadTimeText = product.stockPosition.leadTimeLabel ?? '';
    const numericLead = Number.parseInt(leadTimeText, 10);
    return total + (Number.isFinite(numericLead) ? numericLead : 7);
  }, 0) / Math.max(1, details.length);

  const procurementSeries = Array.from({ length: 12 }, (_, index) => {
    const current = Math.max(20, round((averageLeadTime * 2.4) + ((index % 4) * 7) + (availabilityAlerts.length * 6)));
    const predicted = round(current * (1.05 + ((index % 3) * 0.03)));

    return {
      label: `M${index + 1}`,
      current,
      predicted,
    };
  });

  const topPerformers = [...details]
    .sort((left, right) => right.readiness.catalogHealth - left.readiness.catalogHealth)
    .slice(0, 3);

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
    summary,
    availabilityAlerts,
    assetCoverage,
    procurementSeries,
    categoryDistribution,
    assetRoi: {
      conversionLift: round((summary.globalThreedReadiness / 3.1) + 2.2, 1),
      sampleRequestRate: round(summary.globalAssetReadiness / 7.2, 1),
    },
    topPerformers,
  };
}
