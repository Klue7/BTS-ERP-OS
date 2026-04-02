import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../../prisma/client.ts';
import type {
  CreateInventoryAssetInput,
  CreateInventoryProductInput,
  CreateLogisticsQuoteInput,
  CreatePriceListImportInput,
  CreateStockMovementInput,
  CreateSupplierInput,
  InventoryAssetSummary,
  InventoryDashboardSnapshot,
  InventoryProductDetail,
  InventoryProductSummary,
  LogisticsQuote,
  PriceListImportResult,
  ReadinessSnapshot,
  StockPosition,
  SupplierSummary,
  UpdateInventoryProductInput,
} from '../../inventory/contracts';

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

const productTypeMap = {
  Brick: 'BRICK',
  Tile: 'TILE',
  Paver: 'PAVER',
  Stone: 'STONE',
  Slab: 'SLAB',
} as const;

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

const supplierStatusKeys = {
  Active: 'ACTIVE',
  Onboarding: 'ONBOARDING',
  Delayed: 'DELAYED',
  Restocking: 'RESTOCKING',
  Inactive: 'INACTIVE',
} as const;

const supplierTypeKeys = {
  Manufacturer: 'MANUFACTURER',
  Distributor: 'DISTRIBUTOR',
  Wholesaler: 'WHOLESALER',
} as const;

const assetTypeLabels = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  THREE_D_ASSET: '3D Asset',
  THREE_D_RENDER: '3D Render',
  MODEL: 'Model',
} as const;

const assetProtectionLabels = {
  PROTECTED_ORIGINAL: 'Protected Original',
  MANAGED_VARIANT: 'Managed Variant',
  PUBLISHABLE_VARIANT: 'Publishable Variant',
} as const;

const assetStatusLabels = {
  DRAFT: 'Draft',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
  RESTRICTED: 'Restricted',
} as const;

const supplierStatusLabels = {
  ACTIVE: 'Active',
  ONBOARDING: 'Onboarding',
  DELAYED: 'Delayed',
  RESTOCKING: 'Restocking',
  INACTIVE: 'Inactive',
} as const;

const supplierTypeLabels = {
  MANUFACTURER: 'Manufacturer',
  DISTRIBUTOR: 'Distributor',
  WHOLESALER: 'Wholesaler',
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

const locationTypeLabels = {
  SUPPLIER_ORIGIN: 'Supplier Origin',
  WAREHOUSE: 'Warehouse',
  CUSTOMER_DESTINATION: 'Customer Destination',
} as const;

const assetTypeKeys = {
  Image: 'IMAGE',
  Video: 'VIDEO',
  '3D Asset': 'THREE_D_ASSET',
  '3D Render': 'THREE_D_RENDER',
  Model: 'MODEL',
} as const;

const assetProtectionKeys = {
  'Protected Original': 'PROTECTED_ORIGINAL',
  'Managed Variant': 'MANAGED_VARIANT',
  'Publishable Variant': 'PUBLISHABLE_VARIANT',
} as const;

const assetStatusKeys = {
  Draft: 'DRAFT',
  Review: 'REVIEW',
  Approved: 'APPROVED',
  Archived: 'ARCHIVED',
  Restricted: 'RESTRICTED',
} as const;

const assetRoleKeys = {
  hero: 'HERO',
  gallery: 'GALLERY',
  installation: 'INSTALLATION',
  detail: 'DETAIL',
  campaign: 'CAMPAIGN',
  '3d_ready': 'THREE_D_READY',
  model: 'MODEL',
  publishable_variant: 'PUBLISHABLE_VARIANT',
  face_texture: 'FACE_TEXTURE',
  detail_texture: 'DETAIL_TEXTURE',
  quote_render: 'QUOTE_RENDER',
  marketing_variant: 'MARKETING_VARIANT',
  model_reference: 'MODEL_REFERENCE',
  render: 'RENDER',
  pbr_texture: 'PBR_TEXTURE',
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

function buildStockPosition(record: ProductRecord): StockPosition {
  let onHand = 0;
  let reserved = 0;

  for (const movement of record.stockMovements) {
    switch (movement.movementType) {
      case 'RECEIPT':
      case 'RETURN':
      case 'ADJUSTMENT':
        onHand += movement.quantity;
        break;
      case 'ISSUE':
        onHand -= movement.quantity;
        break;
      case 'RESERVATION':
        reserved += movement.quantity;
        break;
      case 'RELEASE':
      case 'CANCELLATION':
        reserved = Math.max(0, reserved - movement.quantity);
        break;
    }
  }

  const available = Math.max(0, onHand - reserved);
  const lastMovementAt = record.stockMovements.at(-1)?.occurredAt?.toISOString() ?? null;

  return {
    productId: record.referenceId,
    onHand,
    reserved,
    available,
    reorderPoint: record.reorderPoint,
    lowStock: available < record.reorderPoint,
    lastMovementAt,
  };
}

function buildAssetSummary(asset: ProductRecord['assets'][number]): InventoryAssetSummary {
  return {
    id: asset.assetKey,
    name: asset.name,
    type: assetTypeLabels[asset.assetType],
    protectionLevel: assetProtectionLabels[asset.protectionLevel],
    size: asset.sizeLabel,
    status: assetStatusLabels[asset.approvalStatus],
    usage: asset.usageRoles.map((role) => role.toLowerCase().replace(/_/g, ' ')),
    img: asset.imageUrl,
    parentId: asset.parentAssetId ?? undefined,
    productId: undefined,
    productName: undefined,
    linkedProductIds: asset.links.filter((link) => link.linkType === 'PRODUCT' && link.productId).map((link) => link.productId!).filter(Boolean),
    linkedCampaignIds: asset.links.filter((link) => link.linkType === 'CAMPAIGN' && link.campaignKey).map((link) => link.campaignKey!).filter(Boolean),
    completeness: asset.completeness ?? undefined,
    is3DReady: asset.isThreeDReady,
    tags: asset.tags,
    workflowNode: asset.workflowNode ?? undefined,
    pipeline: asset.pipeline ? (asset.pipeline as InventoryAssetSummary['pipeline']) : undefined,
    watermarkProfile: asset.watermarkProfile ?? undefined,
    backgroundTransparent: asset.backgroundTransparent ?? undefined,
  };
}

function parseSpecs(record: ProductRecord): Record<string, string> {
  const raw = record.technicalSpecifications as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, String(value)]),
  );
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
      currency: 'GBP',
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
  const specs = parseSpecs(record);
  const approvedAssets = assets.filter((asset) => asset.approvalStatus === 'APPROVED');
  const heroAssets = assets.filter((asset) => asset.usageRoles.includes('HERO'));
  const approvedHero = heroAssets.some((asset) => asset.approvalStatus === 'APPROVED');
  const detailAssets = assets.filter((asset) => asset.usageRoles.some((role) => ['DETAIL', 'FACE_TEXTURE', 'DETAIL_TEXTURE', 'MODEL_REFERENCE'].includes(role)));
  const approvedDetail = detailAssets.some((asset) => asset.approvalStatus === 'APPROVED');
  const installationAssets = assets.filter((asset) => asset.usageRoles.some((role) => ['INSTALLATION', 'RENDER'].includes(role)));
  const approvedInstallation = installationAssets.some((asset) => asset.approvalStatus === 'APPROVED');
  const publishableVariant = assets.some((asset) => asset.protectionLevel === 'PUBLISHABLE_VARIANT' && asset.approvalStatus === 'APPROVED');
  const anyThreeDAsset = assets.some((asset) => ['THREE_D_ASSET', 'MODEL'].includes(asset.assetType));
  const approvedThreeDAsset = assets.some((asset) => ['THREE_D_ASSET', 'MODEL'].includes(asset.assetType) && asset.approvalStatus === 'APPROVED');
  const linkedCampaigns = new Set(
    assets.flatMap((asset) =>
      asset.links
        .filter((link) => link.linkType === 'CAMPAIGN' && link.campaignKey)
        .map((link) => link.campaignKey!),
    ),
  );
  const hasMarketingCopy = Boolean(record.marketingCopy?.trim());
  const hasTechnicalSpecs = Object.keys(specs).length > 0;
  const hasSupplierLinkage = record.productSuppliers.length > 0;
  const hasPrice = toNumber(record.baseSellPrice) > 0;

  let assetReadiness = 0;
  if (assets.length > 0) assetReadiness += 10;
  if (heroAssets.length > 0) assetReadiness += 10;
  if (approvedHero) assetReadiness += 15;
  if (detailAssets.length > 0) assetReadiness += 10;
  if (approvedDetail) assetReadiness += 10;
  if (installationAssets.length > 0) assetReadiness += 10;
  if (approvedInstallation) assetReadiness += 10;
  if (publishableVariant) assetReadiness += 10;
  if (approvedAssets.length >= 2) assetReadiness += 15;
  if (anyThreeDAsset) assetReadiness += 5;
  if (approvedThreeDAsset) assetReadiness += 5;
  assetReadiness = Math.min(100, assetReadiness);

  const threeDReadiness = Math.min(
    100,
    assets
      .filter((asset) => asset.pipeline)
      .map((asset) => {
        const pipeline = asset.pipeline as InventoryAssetSummary['pipeline'];
        let score = 0;
        if (pipeline?.sourceUploaded) score += 25;
        if (pipeline?.textureReady) score += 25;
        if (pipeline?.previewAttached) score += 20;
        if (pipeline?.modelReferenceAttached) score += 15;
        if (pipeline?.conversionStatus === 'Complete') score += 15;
        if (pipeline?.conversionStatus === 'Processing') score += 10;
        if (pipeline?.conversionStatus === 'Pending') score += 5;
        return score;
      })
      .reduce((max, score) => Math.max(max, score), 0),
  );

  let marketingReadiness = 0;
  if (hasMarketingCopy) marketingReadiness += 20;
  if (linkedCampaigns.size > 0) marketingReadiness += 20;
  if (publishableVariant) marketingReadiness += 20;
  if (approvedHero) marketingReadiness += 15;
  if (approvedInstallation) marketingReadiness += 15;
  if (assetReadiness >= 75) marketingReadiness += 10;
  marketingReadiness = Math.min(100, marketingReadiness);

  const publishReadiness = Math.min(
    100,
    round(
      assetReadiness * 0.25 +
        marketingReadiness * 0.25 +
        threeDReadiness * 0.15 +
        (hasPrice ? 15 : 0) +
        (hasTechnicalSpecs ? 10 : 0) +
        (hasSupplierLinkage ? 10 : 0),
    ),
  );

  const stockHealth = stockPosition.available >= stockPosition.reorderPoint
    ? 100
    : Math.max(35, round((stockPosition.available / Math.max(1, stockPosition.reorderPoint)) * 100));

  const catalogHealth = Math.min(
    100,
    round(
      assetReadiness * 0.3 +
        threeDReadiness * 0.2 +
        marketingReadiness * 0.2 +
        publishReadiness * 0.2 +
        stockHealth * 0.1,
    ),
  );

  const blockers = new Set<string>();
  if (stockPosition.available < stockPosition.reorderPoint) blockers.add('Low Stock');
  if (threeDReadiness === 0) blockers.add('Missing 3D Assets');
  if (!approvedInstallation) blockers.add('Missing Installation Shots');
  if (!hasSupplierLinkage) blockers.add('Missing Supplier Linkage');

  return {
    catalogHealth,
    assetReadiness,
    threedReadiness: threeDReadiness,
    marketingReadiness,
    publishReadiness,
    blockers: Array.from(blockers),
    checklist: {
      heroImage: approvedHero,
      technicalSpecs: hasTechnicalSpecs,
      threeDModel: threeDReadiness >= 80,
      marketingCopy: hasMarketingCopy,
      installationGallery: approvedInstallation,
      supplierLinkage: hasSupplierLinkage,
    },
  };
}

function buildProductSummary(record: ProductRecord): InventoryProductSummary {
  const stockPosition = buildStockPosition(record);
  const defaultSupplier = record.productSuppliers.find((link) => link.isDefault) ?? record.productSuppliers[0];
  const costPrice = toNumber(defaultSupplier?.unitCost);
  const sellPrice = toNumber(record.baseSellPrice);
  const marginPercent = sellPrice > 0 ? round(((sellPrice - costPrice) / sellPrice) * 100, 1) : 0;
  const readiness = buildReadiness(record, stockPosition);

  return {
    id: record.referenceId,
    recordId: record.id,
    sku: record.sku,
    name: record.name,
    productType: record.productType.charAt(0) + record.productType.slice(1).toLowerCase(),
    commercialCategory: record.commercialCategory,
    collection: record.collectionName ?? null,
    status: lifecycleStatusLabels[record.lifecycleStatus],
    stockPosition,
    sellPrice,
    costPrice,
    marginPercent,
    primaryImageUrl: record.primaryImageUrl,
    readiness,
    supplierCount: record.productSuppliers.length,
    tags: record.presentationTags,
  };
}

function buildProductDetail(record: ProductRecord): InventoryProductDetail {
  const summary = buildProductSummary(record);
  const suppliers = record.productSuppliers.map((link) => buildSupplierSummary(link.supplier));
  const defaultSupplier = record.productSuppliers.find((link) => link.isDefault) ?? record.productSuppliers[0];

  return {
    ...summary,
    description: record.description,
    marketingCopy: record.marketingCopy ?? '',
    specifications: parseSpecs(record),
    media: record.assets.map((asset) => buildAssetSummary(asset)),
    suppliers,
    history: record.historyEvents.map((event) => ({
      id: event.id,
      date: formatDate(event.occurredAt),
      action: event.actionLabel,
      user: event.userName,
      details: event.details ?? undefined,
    })),
    pricing: {
      unit: record.unit,
      sellPrice: summary.sellPrice,
      costPrice: summary.costPrice,
      marginPercent: summary.marginPercent,
      currency: record.currency,
    },
    logistics: {
      defaultSupplierId: defaultSupplier?.supplier.supplierKey,
      defaultSupplierName: defaultSupplier?.supplier.name,
      defaultOriginLocation: defaultSupplier?.originLocation.label,
      sellPricePerKm: undefined,
      fixedFee: undefined,
      minimumCharge: undefined,
      currency: record.currency,
    },
  };
}

function generateReferenceIdFromSku(sku: string) {
  let hash = 0;
  for (const character of sku) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1000;
  }
  return `PRD_${String(hash).padStart(3, '0')}`;
}

function normalizeProductType(label: string) {
  return productTypeMap[label as keyof typeof productTypeMap] ?? 'BRICK';
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
  const fallbackSupplier = input.supplierId
    ? await prisma.supplier.findUnique({
        where: { supplierKey: input.supplierId },
        include: { locations: true },
      })
    : await prisma.supplier.findFirst({
        where: { status: 'ACTIVE' },
        include: { locations: true },
        orderBy: { name: 'asc' },
      });

  const created = await prisma.product.create({
    data: {
      referenceId: generateReferenceIdFromSku(input.sku),
      sku: input.sku,
      name: input.name,
      productType: normalizeProductType(input.productType),
      commercialCategory: input.commercialCategory,
      collectionName: null,
      presentationTags: [input.productType, input.commercialCategory],
      lifecycleStatus: 'DRAFT',
      publishStatus: 'NOT_READY',
      unit: input.unit ?? 'm2',
      baseSellPrice: input.sellPrice ?? 0,
      currency: 'GBP',
      primaryImageUrl: 'https://picsum.photos/seed/newproduct/800/800',
      description: input.description,
      marketingCopy: '',
      technicalSpecifications: {
        Dimensions: input.dimensions ?? 'TBD',
        Weight: input.weightKg ? `${input.weightKg}kg` : 'TBD',
      },
      dimensionsText: input.dimensions ?? null,
      weightKg: input.weightKg ?? null,
      reorderPoint: input.reorderPoint ?? 100,
    },
  });

  if (fallbackSupplier && fallbackSupplier.locations[0]) {
    await prisma.productSupplier.create({
      data: {
        productId: created.id,
        supplierId: fallbackSupplier.id,
        originLocationId: fallbackSupplier.locations[0].id,
        isDefault: true,
        unitCost: input.sellPrice ? round(input.sellPrice * 0.45, 2) : 0,
        currency: 'GBP',
        leadTimeDays: fallbackSupplier.leadTimeDays ?? null,
        minimumOrderQuantity: 1,
        paymentTerms: 'TBD',
        incoterms: 'TBD',
      },
    });
  }

  if ((input.initialStock ?? 0) > 0) {
    await prisma.stockMovement.create({
      data: {
        movementKey: `STK_${created.referenceId}_${Date.now()}`,
        productId: created.id,
        movementType: 'RECEIPT',
        quantity: input.initialStock ?? 0,
        occurredAt: new Date(),
        note: 'Initial stock creation',
        referenceType: 'Manual',
        referenceId: created.referenceId,
      },
    });
  }

  await prisma.productHistoryEvent.create({
    data: {
      productId: created.id,
      eventType: 'PRODUCT_CREATED',
      actionLabel: 'Product Created',
      userName: 'Inventory API',
      details: 'Created through the Inventory OS wizard',
      occurredAt: new Date(),
    },
  });

  return getInventoryProduct(created.referenceId);
}

export async function updateInventoryProduct(referenceId: string, input: UpdateInventoryProductInput) {
  const product = await prisma.product.findUnique({
    where: { referenceId },
  });

  if (!product) {
    throw new Error(`Product ${referenceId} was not found.`);
  }

  await prisma.product.update({
    where: { id: product.id },
    data: {
      name: input.name,
      commercialCategory: input.commercialCategory,
      collectionName: input.collection,
      description: input.description,
      marketingCopy: input.marketingCopy,
      baseSellPrice: input.sellPrice,
      publishStatus: input.publishStatus ? publishStatusMap[input.publishStatus] : undefined,
      lifecycleStatus: input.status ? lifecycleStatusMap[input.status] : undefined,
      reorderPoint: input.reorderPoint,
      technicalSpecifications: input.specifications ? (input.specifications as Prisma.InputJsonValue) : undefined,
    },
  });

  await prisma.productHistoryEvent.create({
    data: {
      productId: product.id,
      eventType: 'PRODUCT_UPDATED',
      actionLabel: 'Product Updated',
      userName: 'Inventory API',
      details: 'Updated through the Inventory OS',
      occurredAt: new Date(),
    },
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
      assetType: assetTypeKeys[input.type] ?? 'IMAGE',
      protectionLevel: input.protectionLevel ? assetProtectionKeys[input.protectionLevel] : 'MANAGED_VARIANT',
      approvalStatus: input.status ? assetStatusKeys[input.status] : 'DRAFT',
      sizeLabel: 'Pending',
      imageUrl: input.imageUrl,
      usageRoles: [assetRoleKeys[input.role] ?? 'GALLERY'],
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
      eventType: 'ASSET_APPROVED',
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
        currency: input.currency ?? 'GBP',
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

  const movementType = {
    Receipt: 'RECEIPT',
    Reservation: 'RESERVATION',
    Release: 'RELEASE',
    Issue: 'ISSUE',
    Return: 'RETURN',
    Adjustment: 'ADJUSTMENT',
    Cancellation: 'CANCELLATION',
  } as const;

  await prisma.stockMovement.create({
    data: {
      movementKey: `STK_${product.referenceId}_${Date.now()}`,
      productId: product.id,
      movementType: movementType[input.type],
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
    include: {
      stockMovements: {
        orderBy: { occurredAt: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return records.map((record) =>
    buildStockPosition({
      ...record,
      productSuppliers: [],
      assets: [],
      historyEvents: [],
    } as ProductRecord),
  );
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
          sku: row.sku,
          name: row.name,
          productTypeLabel: row.productType,
          commercialCategory: row.commercialCategory,
          collectionName: row.collection,
          description: row.description,
          sellPrice: row.sellPrice ?? null,
          unitCost: row.unitCost ?? null,
          currency: row.currency ?? 'GBP',
          unit: row.unit ?? 'm2',
          tags: row.tags ?? [],
          rawData: row as unknown as Prisma.InputJsonValue,
        })),
      },
    },
    include: {
      rows: true,
    },
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
    include: {
      rows: true,
    },
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
      const existing = await prisma.product.findUnique({
        where: { sku: row.sku },
      });

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            productType: normalizeProductType(row.productTypeLabel),
            commercialCategory: row.commercialCategory,
            collectionName: row.collectionName,
            description: row.description ?? existing.description,
            baseSellPrice: row.sellPrice ?? existing.baseSellPrice,
            currency: row.currency ?? existing.currency,
            unit: row.unit ?? existing.unit,
            presentationTags: row.tags,
          },
        });

        if (row.unitCost !== null && row.unitCost !== undefined) {
          const defaultSupplier = await prisma.productSupplier.findFirst({
            where: { productId: existing.id, isDefault: true },
          });

          if (defaultSupplier) {
            await prisma.productSupplier.update({
              where: { id: defaultSupplier.id },
              data: {
                unitCost: row.unitCost,
                currency: row.currency ?? defaultSupplier.currency,
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

      if (!fallbackSupplier || !fallbackSupplier.locations[0]) {
        skippedCount += 1;
        errors.push(`No fallback supplier available for ${row.sku}`);
        await prisma.priceListImportRow.update({
          where: { id: row.id },
          data: {
            actionTaken: 'Skipped',
            errorMessage: 'Missing fallback supplier',
          },
        });
        continue;
      }

      const created = await prisma.product.create({
        data: {
          referenceId: generateReferenceIdFromSku(row.sku),
          sku: row.sku,
          name: row.name,
          productType: normalizeProductType(row.productTypeLabel),
          commercialCategory: row.commercialCategory,
          collectionName: row.collectionName,
          presentationTags: row.tags,
          lifecycleStatus: 'DRAFT',
          publishStatus: 'NOT_READY',
          unit: row.unit ?? 'm2',
          baseSellPrice: row.sellPrice ?? 0,
          currency: row.currency ?? 'GBP',
          primaryImageUrl: 'https://picsum.photos/seed/imported-product/800/800',
          description: row.description ?? `${row.name} imported from price list.`,
          marketingCopy: '',
          technicalSpecifications: {},
          reorderPoint: 100,
        },
      });

      await prisma.productSupplier.create({
        data: {
          productId: created.id,
          supplierId: fallbackSupplier.id,
          originLocationId: fallbackSupplier.locations[0].id,
          isDefault: true,
          unitCost: row.unitCost ?? 0,
          currency: row.currency ?? 'GBP',
          leadTimeDays: fallbackSupplier.leadTimeDays,
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
      const message = error instanceof Error ? error.message : `Failed to apply ${row.sku}`;
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
      currency: rateCard.currency,
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
    currency: quote.currency,
    createdAt: quote.createdAt.toISOString(),
  };
}

export async function getInventoryDashboard(): Promise<InventoryDashboardSnapshot> {
  const details = await listInventoryProductDetails();

  const lowStockAlerts = details
    .filter((product) => product.stockPosition.available < product.stockPosition.reorderPoint)
    .map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stockPosition.available,
      min: product.stockPosition.reorderPoint,
      status: product.stockPosition.available < (product.stockPosition.reorderPoint * 0.5) ? ('Critical' as const) : ('Low' as const),
    }));

  const assetCoverage = details.map((product) => {
    const images = product.media.filter((asset) => asset.type === 'Image').length;
    const campaigns = new Set(product.media.flatMap((asset) => asset.linkedCampaignIds ?? [])).size;
    const model3D = product.media.some((asset) => asset.type === '3D Asset' || asset.type === 'Model');
    const renders = product.media.filter((asset) => asset.usage.some((usage) => usage.includes('render')) || asset.type === '3D Render').length;
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
    categoryCounts.set(product.productType, (categoryCounts.get(product.productType) ?? 0) + 1);
  }

  const categoryDistribution = Array.from(categoryCounts.entries()).map(([label, count]) => ({
    label,
    value: round((count / Math.max(1, details.length)) * 100),
  }));

  const averageAvailable = details.reduce((total, product) => total + product.stockPosition.available, 0) / Math.max(1, details.length);
  const lowStockCount = lowStockAlerts.length;
  const velocitySeries = Array.from({ length: 12 }, (_, index) => {
    const current = Math.max(
      20,
      round((averageAvailable / 50) + ((index % 4) * 8) + (lowStockCount * 6) + ((details.length - 1) * 4)),
    );
    const predicted = round(current * (1.08 + ((index % 3) * 0.04)));

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
    lowStockCount,
    globalCatalogHealth: round(details.reduce((total, product) => total + product.readiness.catalogHealth, 0) / Math.max(1, details.length)),
    globalAssetReadiness: round(details.reduce((total, product) => total + product.readiness.assetReadiness, 0) / Math.max(1, details.length), 1),
    globalThreedReadiness: round(details.reduce((total, product) => total + product.readiness.threedReadiness, 0) / Math.max(1, details.length), 1),
    globalMarketingReadiness: round(details.reduce((total, product) => total + product.readiness.marketingReadiness, 0) / Math.max(1, details.length), 1),
    globalPublishReadiness: round(details.reduce((total, product) => total + product.readiness.publishReadiness, 0) / Math.max(1, details.length), 1),
  };

  return {
    summary,
    lowStockAlerts,
    assetCoverage,
    velocitySeries,
    categoryDistribution,
    assetRoi: {
      conversionLift: round((summary.globalThreedReadiness / 3.2) + 2.5, 1),
      sampleRequestRate: round((summary.globalAssetReadiness / 7.5), 1),
    },
    topPerformers,
  };
}
