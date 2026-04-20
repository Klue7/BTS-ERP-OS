import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../../prisma/client.ts';
import type {
  CreateCreativeAiJobInput,
  CreateCreativeDocumentInput,
  CreateCreativeExportJobInput,
  CreateCreativeLayerInput,
  CreativeAiJob,
  CreativeCanvasPreset,
  CreativeDocumentDetail,
  CreativeDocumentStatus,
  CreativeDocumentSummary,
  CreativeExportJob,
  CreativeExportPreset,
  CreativeLayer,
  CreativeMask,
  PublishCreativeDocumentInput,
  UpdateCreativeDocumentInput,
  UpdateCreativeLayerInput,
} from '../../creative/contracts.ts';
import { getCreativeAiProvider } from './provider.ts';
import { emitMarketingEvent } from '../marketing/events.ts';

const creativeProvider = getCreativeAiProvider();

const documentStatusMap = {
  Draft: 'DRAFT',
  Review: 'REVIEW',
  Approved: 'APPROVED',
  Archived: 'ARCHIVED',
} as const;

const workspaceModeMap = {
  'Product Design': 'PRODUCT_DESIGN',
  Cutout: 'CUTOUT',
  'Room Restyle': 'ROOM_RESTYLE',
} as const;

const layerTypeMap = {
  image: 'IMAGE',
  text: 'TEXT',
  shape: 'SHAPE',
  logo: 'LOGO',
  'product-card': 'PRODUCT_CARD',
  'brand-block': 'BRAND_BLOCK',
  'room-mask': 'ROOM_MASK',
} as const;

const exportPresetMap = {
  'Home Hero': 'HOME_HERO',
  'Square Post': 'SQUARE_POST',
  'Portrait Story': 'PORTRAIT_STORY',
  'WhatsApp Share': 'WHATSAPP_SHARE',
  'Email Banner': 'EMAIL_BANNER',
  Custom: 'CUSTOM',
} as const;

const exportJobStatusMap = {
  Draft: 'DRAFT',
  Queued: 'QUEUED',
  Processing: 'PROCESSING',
  Review: 'REVIEW',
  Approved: 'APPROVED',
  Failed: 'FAILED',
  Archived: 'ARCHIVED',
} as const;

const aiJobTypeMap = {
  'Background Removal': 'BACKGROUND_REMOVAL',
  'Object Cleanup': 'OBJECT_CLEANUP',
  'Image Expansion': 'IMAGE_EXPANSION',
  'Auto Caption': 'AUTO_CAPTION',
  'Auto Layout': 'AUTO_LAYOUT',
  'Room Segmentation': 'ROOM_SEGMENTATION',
  'Room Restyle': 'ROOM_RESTYLE',
} as const;

const aiJobStatusMap = {
  Draft: 'DRAFT',
  Queued: 'QUEUED',
  Processing: 'PROCESSING',
  Review: 'REVIEW',
  Approved: 'APPROVED',
  Failed: 'FAILED',
  Archived: 'ARCHIVED',
} as const;

const linkTypeMap = {
  Product: 'PRODUCT',
  Campaign: 'CAMPAIGN',
  Template: 'TEMPLATE',
  Asset: 'ASSET',
  'Publish Target': 'PUBLISH_TARGET',
} as const;

const assetTypeReverseMap = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  TWO_POINT_FIVE_D_ASSET: '2.5D Asset',
  THREE_D_ASSET: '3D Asset',
  THREE_D_RENDER: '3D Render',
  MODEL: 'Model',
} as const;

const assetProtectionReverseMap = {
  PROTECTED_ORIGINAL: 'Protected Original',
  MANAGED_VARIANT: 'Managed Variant',
  PUBLISHABLE_VARIANT: 'Publishable Variant',
} as const;

const assetStatusReverseMap = {
  DRAFT: 'Draft',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
  RESTRICTED: 'Restricted',
} as const;

type DbDocumentStatus = (typeof documentStatusMap)[keyof typeof documentStatusMap];
type DbWorkspaceMode = (typeof workspaceModeMap)[keyof typeof workspaceModeMap];
type DbLayerType = (typeof layerTypeMap)[keyof typeof layerTypeMap];
type DbExportPreset = (typeof exportPresetMap)[keyof typeof exportPresetMap];
type DbExportJobStatus = (typeof exportJobStatusMap)[keyof typeof exportJobStatusMap];
type DbAiJobType = (typeof aiJobTypeMap)[keyof typeof aiJobTypeMap];
type DbAiJobStatus = (typeof aiJobStatusMap)[keyof typeof aiJobStatusMap];
type DbLinkType = (typeof linkTypeMap)[keyof typeof linkTypeMap];
type DbMarketingChannel = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'LINKEDIN' | 'EMAIL' | 'WHATSAPP' | 'PINTEREST';

function createKey(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8).toUpperCase()}${Date.now().toString().slice(-4)}`;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function mapDocumentStatus(status: keyof typeof documentStatusMap) {
  return documentStatusMap[status];
}

function mapWorkspaceMode(mode: keyof typeof workspaceModeMap) {
  return workspaceModeMap[mode];
}

function mapLayerType(type: keyof typeof layerTypeMap) {
  return layerTypeMap[type];
}

function mapExportPreset(preset: keyof typeof exportPresetMap) {
  return exportPresetMap[preset];
}

function mapAiJobType(type: keyof typeof aiJobTypeMap) {
  return aiJobTypeMap[type];
}

function mapAiJobStatus(status: keyof typeof aiJobStatusMap) {
  return aiJobStatusMap[status];
}

function mapExportJobStatus(status: keyof typeof exportJobStatusMap) {
  return exportJobStatusMap[status];
}

function reverseDocumentStatus(status: DbDocumentStatus | string) {
  const match = Object.entries(documentStatusMap).find(([, dbValue]) => dbValue === status);
  return (match?.[0] ?? 'Draft') as CreativeDocumentStatus;
}

function reverseWorkspaceMode(status: DbWorkspaceMode | string) {
  const match = Object.entries(workspaceModeMap).find(([, dbValue]) => dbValue === status);
  return (match?.[0] ?? 'Product Design') as CreativeDocumentDetail['workspaceMode'];
}

function reverseLayerType(status: DbLayerType | string) {
  const match = Object.entries(layerTypeMap).find(([, dbValue]) => dbValue === status);
  return (match?.[0] ?? 'image') as CreativeLayer['type'];
}

function reverseExportPreset(preset: DbExportPreset | string) {
  const match = Object.entries(exportPresetMap).find(([, dbValue]) => dbValue === preset);
  return (match?.[0] ?? 'Square Post') as CreativeExportPreset;
}

function reverseExportJobStatus(status: DbExportJobStatus | string) {
  const match = Object.entries(exportJobStatusMap).find(([, dbValue]) => dbValue === status);
  return (match?.[0] ?? 'Draft') as CreativeExportJob['status'];
}

function reverseAiJobType(type: DbAiJobType | string) {
  const match = Object.entries(aiJobTypeMap).find(([, dbValue]) => dbValue === type);
  return (match?.[0] ?? 'Background Removal') as CreativeAiJob['type'];
}

function reverseAiJobStatus(status: DbAiJobStatus | string) {
  const match = Object.entries(aiJobStatusMap).find(([, dbValue]) => dbValue === status);
  return (match?.[0] ?? 'Draft') as CreativeAiJob['status'];
}

function reverseLinkType(type: DbLinkType | string) {
  const match = Object.entries(linkTypeMap).find(([, dbValue]) => dbValue === type);
  return (match?.[0] ?? 'Asset') as CreativeDocumentDetail['links'][number]['linkType'];
}

function mapMarketingChannel(channel: CreateCreativeExportJobInput['publishChannel'] | PublishCreativeDocumentInput['channel']) {
  return String(channel).toUpperCase() as DbMarketingChannel;
}

function reverseMarketingChannel(channel: DbMarketingChannel | string | null) {
  if (!channel) {
    return null;
  }

  const normalized = String(channel);
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function buildCanvasPreset(label: CreativeExportPreset, width: number, height: number): CreativeCanvasPreset {
  const defaults: Record<CreativeExportPreset, CreativeCanvasPreset> = {
    'Home Hero': { label: 'Home Hero', width: 1600, height: 900, safeZone: { topPct: 8, rightPct: 8, bottomPct: 10, leftPct: 8 } },
    'Square Post': { label: 'Square Post', width: 1080, height: 1080, safeZone: { topPct: 8, rightPct: 8, bottomPct: 10, leftPct: 8 } },
    'Portrait Story': { label: 'Portrait Story', width: 1080, height: 1920, safeZone: { topPct: 10, rightPct: 8, bottomPct: 12, leftPct: 8 } },
    'WhatsApp Share': { label: 'WhatsApp Share', width: 1080, height: 1080, safeZone: { topPct: 8, rightPct: 8, bottomPct: 10, leftPct: 8 } },
    'Email Banner': { label: 'Email Banner', width: 1200, height: 630, safeZone: { topPct: 8, rightPct: 8, bottomPct: 10, leftPct: 8 } },
    Custom: { label: 'Custom', width, height, safeZone: { topPct: 8, rightPct: 8, bottomPct: 10, leftPct: 8 } },
  };

  const base = defaults[label] ?? defaults.Custom;
  return {
    ...base,
    width: label === 'Custom' ? width : base.width,
    height: label === 'Custom' ? height : base.height,
  };
}

function mapMarketingAsset(record: {
  id: string;
  name: string;
  assetType: keyof typeof assetTypeReverseMap;
  protectionLevel: keyof typeof assetProtectionReverseMap;
  approvalStatus: keyof typeof assetStatusReverseMap;
  sizeLabel: string;
  imageUrl: string;
  tags: string[];
}) {
  return {
    id: record.id,
    name: record.name,
    type: assetTypeReverseMap[record.assetType],
    protectionLevel: assetProtectionReverseMap[record.protectionLevel],
    status: assetStatusReverseMap[record.approvalStatus],
    size: record.sizeLabel,
    usage: record.tags.length ? record.tags : ['creative-output'],
    img: record.imageUrl,
    tags: record.tags,
  };
}

function mapLayer(record: {
  id: string;
  name: string;
  layerType: DbLayerType | string;
  sourceAssetId: string | null;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  transformJson: Prisma.JsonValue;
  cropJson: Prisma.JsonValue | null;
  styleJson: Prisma.JsonValue | null;
  contentJson: Prisma.JsonValue | null;
}) {
  return {
    id: record.id,
    name: record.name,
    type: reverseLayerType(record.layerType),
    sourceAssetId: record.sourceAssetId,
    visible: record.visible,
    locked: record.locked,
    transform: (record.transformJson ?? {}) as unknown as CreativeLayer['transform'],
    crop: (record.cropJson ?? null) as unknown as CreativeLayer['crop'],
    style: (record.styleJson ?? null) as unknown as CreativeLayer['style'],
    content: (record.contentJson ?? null) as unknown as CreativeLayer['content'],
  } satisfies CreativeLayer;
}

function mapMask(record: {
  id: string;
  label: string;
  maskMode: string;
  width: number;
  height: number;
  maskImageUrl: string | null;
  vectorData: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    label: record.label,
    maskMode: record.maskMode,
    width: record.width,
    height: record.height,
    maskImageUrl: record.maskImageUrl,
    vectorData: (record.vectorData ?? null) as unknown as CreativeMask['vectorData'],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  } satisfies CreativeMask;
}

function mapAiJob(record: {
  id: string;
  jobKey: string;
  jobType: DbAiJobType | string;
  status: DbAiJobStatus | string;
  provider: string;
  resultJson: Prisma.JsonValue | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    jobKey: record.jobKey,
    type: reverseAiJobType(record.jobType),
    status: reverseAiJobStatus(record.status),
    provider: record.provider,
    result: (record.resultJson ?? null) as unknown as Record<string, unknown> | null,
    errorMessage: record.errorMessage,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  } satisfies CreativeAiJob;
}

function mapExportJob(record: {
  id: string;
  jobKey: string;
  preset: DbExportPreset | string;
  width: number;
  height: number;
  status: DbExportJobStatus | string;
  publishChannel: DbMarketingChannel | string | null;
  publishTarget: string | null;
  createdAt: Date;
  updatedAt: Date;
  outputAssetId: string | null;
  outputAsset: {
    id: string;
    name: string;
    assetType: keyof typeof assetTypeReverseMap;
    protectionLevel: keyof typeof assetProtectionReverseMap;
    approvalStatus: keyof typeof assetStatusReverseMap;
    sizeLabel: string;
    imageUrl: string;
    tags: string[];
  } | null;
}) {
  return {
    id: record.id,
    jobKey: record.jobKey,
    preset: reverseExportPreset(record.preset),
    width: record.width,
    height: record.height,
    status: reverseExportJobStatus(record.status),
    outputAssetId: record.outputAssetId,
    outputAsset: record.outputAsset ? mapMarketingAsset(record.outputAsset) : null,
    publishChannel: reverseMarketingChannel(record.publishChannel),
    publishTarget: record.publishTarget,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  } satisfies CreativeExportJob;
}

function buildDocumentSnapshot(input: {
  name: string;
  status: CreativeDocumentStatus;
  workspaceMode: CreativeDocumentDetail['workspaceMode'];
  canvasPreset: CreativeCanvasPreset;
  metadata?: Record<string, unknown> | null;
  layers: CreativeLayer[];
}) {
  return {
    name: input.name,
    status: input.status,
    workspaceMode: input.workspaceMode,
    canvasPreset: input.canvasPreset,
    metadata: input.metadata ?? null,
    layerCount: input.layers.length,
  };
}

async function rebuildDocumentVersion(tx: Prisma.TransactionClient, documentId: string) {
  const document = await tx.creativeDocument.findUniqueOrThrow({
    where: { id: documentId },
    include: {
      layers: {
        orderBy: { zIndex: 'asc' },
      },
    },
  });

  const previousVersion = await tx.creativeDocumentVersion.findFirst({
    where: { documentId },
    orderBy: { versionNumber: 'desc' },
  });

  const snapshot = buildDocumentSnapshot({
    name: document.name,
    status: reverseDocumentStatus(document.status),
    workspaceMode: reverseWorkspaceMode(document.workspaceMode),
    canvasPreset: buildCanvasPreset(
      reverseExportPreset(document.canvasPreset),
      document.canvasWidth,
      document.canvasHeight,
    ),
    metadata: (document.metadata ?? null) as Record<string, unknown> | null,
    layers: document.layers.map(mapLayer),
  });

  const version = await tx.creativeDocumentVersion.create({
    data: {
      versionKey: createKey('CRV'),
      documentId,
      versionNumber: (previousVersion?.versionNumber ?? 0) + 1,
      snapshot: asJson(snapshot),
    },
  });

  await tx.creativeDocument.update({
    where: { id: documentId },
    data: {
      currentVersionId: version.id,
    },
  });
}

async function syncDocumentLinks(tx: Prisma.TransactionClient, documentId: string) {
  const document = await tx.creativeDocument.findUniqueOrThrow({
    where: { id: documentId },
    include: {
      layers: true,
    },
  });

  await tx.creativeDocumentLink.deleteMany({
    where: { documentId },
  });

  const creates: Prisma.CreativeDocumentLinkUncheckedCreateInput[] = [];
  if (document.productId) {
    creates.push({ documentId, linkType: 'PRODUCT', productId: document.productId });
  }
  if (document.campaignId) {
    creates.push({ documentId, linkType: 'CAMPAIGN', campaignId: document.campaignId });
  }
  if (document.templateId) {
    creates.push({ documentId, linkType: 'TEMPLATE', templateId: document.templateId });
  }

  const sourceAssetIds = Array.from(
    new Set(
      document.layers
        .map((layer) => layer.sourceAssetId)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  for (const assetId of sourceAssetIds) {
    creates.push({ documentId, linkType: 'ASSET', assetId });
  }

  if (creates.length) {
    await tx.creativeDocumentLink.createMany({
      data: creates,
    });
  }
}

async function loadCreativeDocumentRecord(documentId: string) {
  return await prisma.creativeDocument.findUniqueOrThrow({
    where: { id: documentId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
      template: {
        select: {
          id: true,
          name: true,
        },
      },
      layers: {
        orderBy: { zIndex: 'asc' },
      },
      links: {
        orderBy: { createdAt: 'asc' },
      },
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 10,
      },
      masks: {
        orderBy: { createdAt: 'desc' },
      },
      aiJobs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      exportJobs: {
        orderBy: { createdAt: 'desc' },
        include: {
          outputAsset: {
            select: {
              id: true,
              name: true,
              assetType: true,
              protectionLevel: true,
              approvalStatus: true,
              sizeLabel: true,
              imageUrl: true,
              tags: true,
            },
          },
        },
      },
    },
  });
}

function mapDocumentSummary(record: Awaited<ReturnType<typeof loadCreativeDocumentRecord>>) {
  return {
    id: record.id,
    key: record.documentKey,
    name: record.name,
    status: reverseDocumentStatus(record.status),
    workspaceMode: reverseWorkspaceMode(record.workspaceMode),
    canvasPreset: buildCanvasPreset(reverseExportPreset(record.canvasPreset), record.canvasWidth, record.canvasHeight),
    previewImageUrl: record.previewImageUrl,
    productId: record.productId,
    productName: record.product?.name ?? null,
    campaignId: record.campaignId,
    campaignName: record.campaign?.name ?? null,
    templateId: record.templateId,
    templateName: record.template?.name ?? null,
    updatedAt: record.updatedAt.toISOString(),
  } satisfies CreativeDocumentSummary;
}

function mapDocumentDetail(record: Awaited<ReturnType<typeof loadCreativeDocumentRecord>>) {
  return {
    ...mapDocumentSummary(record),
    metadata: (record.metadata ?? null) as unknown as CreativeDocumentDetail['metadata'],
    layers: record.layers.map(mapLayer),
    links: record.links.map((link) => ({
      id: link.id,
      linkType: reverseLinkType(link.linkType),
      productId: link.productId,
      campaignId: link.campaignId,
      templateId: link.templateId,
      assetId: link.assetId,
      publishTarget: link.publishTarget,
    })),
    versions: record.versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      createdAt: version.createdAt.toISOString(),
      snapshot: version.snapshot as unknown as CreativeDocumentDetail['versions'][number]['snapshot'],
    })),
    masks: record.masks.map(mapMask),
    aiJobs: record.aiJobs.map(mapAiJob),
    exportJobs: record.exportJobs.map(mapExportJob),
  } satisfies CreativeDocumentDetail;
}

function buildDefaultLayers(input: {
  workspaceMode: CreateCreativeDocumentInput['workspaceMode'];
  product?: { name: string; category: string; imageUrl?: string | null; price?: string | number | null } | null;
  templateName?: string | null;
}) {
  if (input.workspaceMode === 'Cutout') {
    return [] satisfies CreativeLayer[];
  }

  if (input.workspaceMode === 'Room Restyle') {
    return [] satisfies CreativeLayer[];
  }

  const layers: CreativeLayer[] = [];
  if (input.product?.imageUrl) {
    layers.push({
      id: `draft_${createKey('L')}`,
      name: 'Hero Image',
      type: 'image',
      visible: true,
      locked: false,
      sourceAssetId: null,
      transform: { xPct: 12, yPct: 12, widthPct: 36, heightPct: 54, rotation: 0, zIndex: 0, opacity: 1 },
      crop: { xPct: 0, yPct: 0, scale: 1 },
      style: null,
      content: { imageUrl: input.product.imageUrl },
    });
  }

  layers.push({
    id: `draft_${createKey('L')}`,
    name: 'Headline',
    type: 'text',
    visible: true,
    locked: false,
    transform: { xPct: 54, yPct: 16, widthPct: 34, heightPct: 16, rotation: 0, zIndex: 2, opacity: 1 },
    style: { fontSize: 52, fontFamily: 'Playfair Display', color: '#ffffff', fontWeight: 700, align: 'left' },
    content: { text: input.product?.name ?? input.templateName ?? 'BTS Creative' },
  });

  layers.push({
    id: `draft_${createKey('L')}`,
    name: 'Body Copy',
    type: 'text',
    visible: true,
    locked: false,
    transform: { xPct: 54, yPct: 36, widthPct: 28, heightPct: 18, rotation: 0, zIndex: 3, opacity: 1 },
    style: { fontSize: 18, fontFamily: 'Inter', color: 'rgba(255,255,255,0.78)', fontWeight: 500, align: 'left' },
    content: { text: input.product?.category ? `Premium ${input.product.category.toLowerCase()} visual.` : 'Premium BTS campaign visual.' },
  });

  layers.push({
    id: `draft_${createKey('L')}`,
    name: 'Brand Strip',
    type: 'brand-block',
    visible: true,
    locked: false,
    transform: { xPct: 6, yPct: 6, widthPct: 88, heightPct: 12, rotation: 0, zIndex: 4, opacity: 1 },
    style: { fill: 'rgba(5,5,5,0.3)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 18 },
    content: { eyebrow: 'Brick Tile Shop', templateName: input.templateName ?? 'Creative Studio' },
  });

  if (input.product?.price) {
    layers.push({
      id: `draft_${createKey('L')}`,
      name: 'Price',
      type: 'product-card',
      visible: true,
      locked: false,
      transform: { xPct: 54, yPct: 60, widthPct: 20, heightPct: 12, rotation: 0, zIndex: 5, opacity: 1 },
      style: { fill: '#22c55e', color: '#050505', borderRadius: 20 },
      content: { label: String(input.product.price) },
    });
  }

  return layers;
}

function normalizeLayerInput(layer: CreativeLayer | CreateCreativeLayerInput) {
  return {
    name: layer.name,
    layerType: mapLayerType(layer.type),
    sourceAssetId: layer.sourceAssetId ?? null,
    visible: layer.visible ?? true,
    locked: layer.locked ?? false,
    zIndex: layer.transform.zIndex ?? 0,
    transformJson: asJson(layer.transform),
    cropJson: layer.crop ? asJson(layer.crop) : Prisma.JsonNull,
    styleJson: layer.style ? asJson(layer.style) : Prisma.JsonNull,
    contentJson: layer.content ? asJson(layer.content) : Prisma.JsonNull,
  };
}

export async function getCreativeStudioSnapshot() {
  const documents = await prisma.creativeDocument.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      product: { select: { id: true, name: true } },
      campaign: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
      layers: { orderBy: { zIndex: 'asc' } },
      links: true,
      versions: { orderBy: { versionNumber: 'desc' }, take: 10 },
      masks: { orderBy: { createdAt: 'desc' } },
      aiJobs: { orderBy: { createdAt: 'desc' }, take: 20 },
      exportJobs: {
        orderBy: { createdAt: 'desc' },
        include: {
          outputAsset: {
            select: {
              id: true,
              name: true,
              assetType: true,
              protectionLevel: true,
              approvalStatus: true,
              sizeLabel: true,
              imageUrl: true,
              tags: true,
            },
          },
        },
      },
    },
  });

  return {
    documents: documents.map(mapDocumentSummary),
  };
}

export async function getCreativeDocument(documentId: string) {
  return mapDocumentDetail(await loadCreativeDocumentRecord(documentId));
}

export async function createCreativeDocument(input: CreateCreativeDocumentInput) {
  const [product, template] = await Promise.all([
    input.productId
      ? prisma.product.findUnique({
          where: { id: input.productId },
          select: {
            id: true,
            name: true,
            category: true,
            sellPriceZar: true,
            heroImageUrl: true,
            primaryImageUrl: true,
            faceImageUrl: true,
            galleryImageUrl: true,
          },
        })
      : Promise.resolve(null),
    input.templateId
      ? prisma.marketingTemplate.findUnique({
          where: { id: input.templateId },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  const defaultLayers =
    input.layers && input.layers.length
      ? input.layers
      : buildDefaultLayers({
          workspaceMode: input.workspaceMode,
          product: product
            ? {
                name: product.name,
                category: product.category.toString(),
                imageUrl:
                  product.heroImageUrl ?? product.primaryImageUrl ?? product.faceImageUrl ?? product.galleryImageUrl ?? null,
                price: product.sellPriceZar ? Number(product.sellPriceZar) : null,
              }
            : null,
          templateName: template?.name ?? null,
        });

  const createdId = await prisma.$transaction(async (tx) => {
    const document = await tx.creativeDocument.create({
      data: {
        documentKey: createKey('CRD'),
        name: input.name,
        status: 'DRAFT',
        workspaceMode: mapWorkspaceMode(input.workspaceMode),
        canvasPreset: mapExportPreset(input.canvasPreset.label),
        canvasWidth: input.canvasPreset.width,
        canvasHeight: input.canvasPreset.height,
        metadata: input.metadata ? asJson(input.metadata) : Prisma.JsonNull,
        productId: input.productId ?? null,
        campaignId: input.campaignId ?? null,
        templateId: input.templateId ?? null,
      },
    });

    if (defaultLayers.length) {
      await tx.creativeDocumentLayer.createMany({
        data: defaultLayers.map((layer, index) => ({
          layerKey: createKey('LYR'),
          documentId: document.id,
          ...normalizeLayerInput({
            ...layer,
            transform: {
              ...layer.transform,
              zIndex: layer.transform.zIndex ?? index,
            },
          }),
        })),
      });
    }

    await syncDocumentLinks(tx, document.id);
    await rebuildDocumentVersion(tx, document.id);

    return document.id;
  });

  return await getCreativeDocument(createdId);
}

export async function updateCreativeDocument(documentId: string, input: UpdateCreativeDocumentInput) {
  await prisma.$transaction(async (tx) => {
    await tx.creativeDocument.update({
      where: { id: documentId },
      data: {
        name: input.name,
        status: input.status ? mapDocumentStatus(input.status) : undefined,
        workspaceMode: input.workspaceMode ? mapWorkspaceMode(input.workspaceMode) : undefined,
        canvasPreset: input.canvasPreset ? mapExportPreset(input.canvasPreset.label) : undefined,
        canvasWidth: input.canvasPreset?.width,
        canvasHeight: input.canvasPreset?.height,
        productId: input.productId === undefined ? undefined : input.productId,
        campaignId: input.campaignId === undefined ? undefined : input.campaignId,
        templateId: input.templateId === undefined ? undefined : input.templateId,
        metadata: input.metadata === undefined ? undefined : input.metadata ? asJson(input.metadata) : Prisma.JsonNull,
        previewImageUrl: input.previewImageUrl === undefined ? undefined : input.previewImageUrl,
      },
    });

    if (input.layers) {
      await tx.creativeDocumentLayer.deleteMany({
        where: { documentId },
      });

      if (input.layers.length) {
        await tx.creativeDocumentLayer.createMany({
          data: input.layers.map((layer, index) => ({
            layerKey: createKey('LYR'),
            documentId,
            ...normalizeLayerInput({
              ...layer,
              transform: {
                ...layer.transform,
                zIndex: layer.transform.zIndex ?? index,
              },
            }),
          })),
        });
      }
    }

    if (input.masks) {
      await tx.creativeMask.deleteMany({
        where: { documentId },
      });

      if (input.masks.length) {
        await tx.creativeMask.createMany({
          data: input.masks.map((mask) => ({
            documentId,
            label: mask.label,
            maskMode: mask.maskMode,
            width: mask.width,
            height: mask.height,
            maskImageUrl: mask.maskImageUrl ?? null,
            vectorData: mask.vectorData ? asJson(mask.vectorData) : Prisma.JsonNull,
          })),
        });
      }
    }

    await syncDocumentLinks(tx, documentId);
    await rebuildDocumentVersion(tx, documentId);
  });

  return await getCreativeDocument(documentId);
}

export async function duplicateCreativeDocument(documentId: string) {
  const existing = await loadCreativeDocumentRecord(documentId);

  return await createCreativeDocument({
    name: `${existing.name} Copy`,
    workspaceMode: reverseWorkspaceMode(existing.workspaceMode),
    canvasPreset: buildCanvasPreset(reverseExportPreset(existing.canvasPreset), existing.canvasWidth, existing.canvasHeight),
    productId: existing.productId ?? undefined,
    campaignId: existing.campaignId ?? undefined,
    templateId: existing.templateId ?? undefined,
    metadata: (existing.metadata ?? null) as UpdateCreativeDocumentInput['metadata'],
    layers: existing.layers.map(mapLayer),
  });
}

export async function archiveCreativeDocument(documentId: string) {
  return await updateCreativeDocument(documentId, { status: 'Archived' });
}

export async function createCreativeLayer(documentId: string, input: CreateCreativeLayerInput) {
  await prisma.$transaction(async (tx) => {
    await tx.creativeDocumentLayer.create({
      data: {
        layerKey: createKey('LYR'),
        documentId,
        ...normalizeLayerInput(input),
      },
    });
    await syncDocumentLinks(tx, documentId);
    await rebuildDocumentVersion(tx, documentId);
  });

  return await getCreativeDocument(documentId);
}

export async function updateCreativeLayer(documentId: string, layerId: string, input: UpdateCreativeLayerInput) {
  const nextPayload: Prisma.CreativeDocumentLayerUncheckedUpdateInput = {};
  if (input.name !== undefined) nextPayload.name = input.name;
  if (input.type !== undefined) nextPayload.layerType = mapLayerType(input.type);
  if (input.sourceAssetId !== undefined) nextPayload.sourceAssetId = input.sourceAssetId;
  if (input.visible !== undefined) nextPayload.visible = input.visible;
  if (input.locked !== undefined) nextPayload.locked = input.locked;
  if (input.transform !== undefined) {
    nextPayload.zIndex = input.transform.zIndex;
    nextPayload.transformJson = asJson(input.transform);
  }
  if (input.crop !== undefined) nextPayload.cropJson = input.crop ? asJson(input.crop) : Prisma.JsonNull;
  if (input.style !== undefined) nextPayload.styleJson = input.style ? asJson(input.style) : Prisma.JsonNull;
  if (input.content !== undefined) nextPayload.contentJson = input.content ? asJson(input.content) : Prisma.JsonNull;

  await prisma.$transaction(async (tx) => {
    await tx.creativeDocumentLayer.update({
      where: { id: layerId },
      data: nextPayload,
    });
    await syncDocumentLinks(tx, documentId);
    await rebuildDocumentVersion(tx, documentId);
  });

  return await getCreativeDocument(documentId);
}

async function createCreativeAiJobRecord(input: {
  documentId?: string;
  assetId?: string;
  type: CreateCreativeAiJobInput['type'];
  provider: string;
  result: Record<string, unknown>;
  errorMessage?: string | null;
}) {
  const created = await prisma.creativeAiJob.create({
    data: {
      jobKey: createKey('CAJ'),
      documentId: input.documentId ?? null,
      assetId: input.assetId ?? null,
      jobType: mapAiJobType(input.type),
      status: mapAiJobStatus(input.errorMessage ? 'Failed' : 'Review'),
      provider: input.provider,
      resultJson: asJson(input.result),
      errorMessage: input.errorMessage ?? null,
    },
  });

  return await prisma.creativeAiJob.findUniqueOrThrow({
    where: { id: created.id },
  });
}

export async function createBackgroundRemovalJob(input: CreateCreativeAiJobInput) {
  const providerResult = await creativeProvider.backgroundRemoval(input.input ?? {});
  const created = await createCreativeAiJobRecord({
    documentId: input.documentId,
    assetId: input.assetId,
    type: 'Background Removal',
    provider: providerResult.provider,
    result: providerResult.result,
  });
  return mapAiJob(created);
}

export async function createRoomSegmentationJob(input: CreateCreativeAiJobInput) {
  const providerResult = await creativeProvider.roomSegmentation(input.input ?? {});
  const created = await createCreativeAiJobRecord({
    documentId: input.documentId,
    assetId: input.assetId,
    type: 'Room Segmentation',
    provider: providerResult.provider,
    result: providerResult.result,
  });

  if (input.documentId) {
    const result = providerResult.result;
    await prisma.creativeMask.create({
      data: {
        documentId: input.documentId,
        aiJobId: created.id,
        label: 'AI Suggested Mask',
        maskMode: String(result.maskMode ?? 'ellipse'),
        width: Number((input.input?.width as number | undefined) ?? 512),
        height: Number((input.input?.height as number | undefined) ?? 320),
        vectorData: asJson(result),
      },
    });
  }

  return mapAiJob(created);
}

export async function createRoomRestyleJob(input: CreateCreativeAiJobInput) {
  const providerResult = await creativeProvider.roomRestyle(input.input ?? {});
  const created = await createCreativeAiJobRecord({
    documentId: input.documentId,
    assetId: input.assetId,
    type: 'Room Restyle',
    provider: providerResult.provider,
    result: providerResult.result,
  });
  return mapAiJob(created);
}

export async function createExpandImageJob(input: CreateCreativeAiJobInput) {
  const providerResult = await creativeProvider.expandImage(input.input ?? {});
  const created = await createCreativeAiJobRecord({
    documentId: input.documentId,
    assetId: input.assetId,
    type: 'Image Expansion',
    provider: providerResult.provider,
    result: providerResult.result,
  });
  return mapAiJob(created);
}

export async function createAutoLayoutJob(input: CreateCreativeAiJobInput) {
  const providerResult = await creativeProvider.autoLayout(input.input ?? {});
  const created = await createCreativeAiJobRecord({
    documentId: input.documentId,
    assetId: input.assetId,
    type: 'Auto Layout',
    provider: providerResult.provider,
    result: providerResult.result,
  });
  return mapAiJob(created);
}

export async function createAutoCaptionJob(input: CreateCreativeAiJobInput) {
  const providerResult = await creativeProvider.autoCaption(input.input ?? {});
  const created = await createCreativeAiJobRecord({
    documentId: input.documentId,
    assetId: input.assetId,
    type: 'Auto Caption',
    provider: providerResult.provider,
    result: providerResult.result,
  });
  return mapAiJob(created);
}

export async function createObjectCleanupJob(input: CreateCreativeAiJobInput) {
  const providerResult = await creativeProvider.objectCleanup(input.input ?? {});
  const created = await createCreativeAiJobRecord({
    documentId: input.documentId,
    assetId: input.assetId,
    type: 'Object Cleanup',
    provider: providerResult.provider,
    result: providerResult.result,
  });
  return mapAiJob(created);
}

export async function getCreativeAiJob(jobId: string) {
  const job = await prisma.creativeAiJob.findUniqueOrThrow({
    where: { id: jobId },
  });

  return mapAiJob(job);
}

export async function createCreativeExportJob(documentId: string, input: CreateCreativeExportJobInput) {
  const document = await loadCreativeDocumentRecord(documentId);

  const protectionLevel =
    input.usagePurpose === 'Publishable Variant' ? 'PUBLISHABLE_VARIANT' : 'MANAGED_VARIANT';
  const usageRole = input.usagePurpose === 'Gallery' ? 'GALLERY_EXTRA' : input.usagePurpose === 'Social' ? 'CAMPAIGN' : 'GENERATED_IMAGE';

  const createdJob = await prisma.$transaction(async (tx) => {
    const asset = await tx.productAsset.create({
      data: {
        assetKey: createKey('AST'),
        primaryProductId: document.productId ?? null,
        name: `${document.name} ${input.preset}`,
        assetType: 'IMAGE',
        assetSource: 'STUDIO_PUBLISHED',
        protectionLevel,
        approvalStatus: 'REVIEW',
        sizeLabel: `${input.width}x${input.height}`,
        imageUrl: input.uploadedAsset.imageUrl,
        originalFileName: input.uploadedAsset.originalFilename,
        storedFileName: input.uploadedAsset.storedFilename ?? null,
        storagePath: input.uploadedAsset.storagePath ?? null,
        mimeType: input.uploadedAsset.mimeType ?? null,
        fileSizeBytes: input.uploadedAsset.fileSizeBytes ?? null,
        sha256: input.uploadedAsset.sha256 ?? null,
        usageRoles: [usageRole],
        parentAssetId: null,
        completeness: 100,
        isThreeDReady: false,
        workflowNode: 'creative.studio.exported',
        tags: Array.from(
          new Set([
            'Creative Studio',
            input.preset,
            document.workspaceMode.replace(/_/g, ' '),
            document.product?.name ?? '',
            document.template?.name ?? '',
          ].filter(Boolean)),
        ),
        watermarkProfile: input.watermarkProfile ?? null,
      } as Prisma.ProductAssetUncheckedCreateInput,
    });

    if (document.productId) {
      await tx.assetLink.create({
        data: {
          assetId: asset.id,
          linkType: 'PRODUCT',
          productId: document.productId,
        },
      });
    }

    const campaignId = input.attachToCampaignId ?? document.campaignId ?? null;
    if (campaignId) {
      await tx.marketingCampaignAsset.create({
        data: {
          campaignId,
          assetId: asset.id,
        },
      });
    }

    const exportJob = await tx.creativeExportJob.create({
      data: {
        jobKey: createKey('EXP'),
        documentId,
        preset: mapExportPreset(input.preset),
        width: input.width,
        height: input.height,
        status: mapExportJobStatus('Review'),
        outputAssetId: asset.id,
        publishChannel: input.publishChannel ? mapMarketingChannel(input.publishChannel) : null,
        publishTarget: input.publishTarget ?? null,
        metadata: asJson({
          usagePurpose: input.usagePurpose,
          attachToCampaignId: campaignId,
        }),
      },
    });

    await tx.creativeDocument.update({
      where: { id: documentId },
      data: {
        status: 'REVIEW',
        previewImageUrl: input.uploadedAsset.imageUrl,
      },
    });

    return exportJob.id;
  });

  const job = await prisma.creativeExportJob.findUniqueOrThrow({
    where: { id: createdJob },
    include: {
      outputAsset: {
        select: {
          id: true,
          name: true,
          assetType: true,
          protectionLevel: true,
          approvalStatus: true,
          sizeLabel: true,
          imageUrl: true,
          tags: true,
        },
      },
    },
  });

  return mapExportJob(job);
}

export async function publishCreativeDocument(documentId: string, input: PublishCreativeDocumentInput) {
  const exportJob = await prisma.creativeExportJob.findUniqueOrThrow({
    where: { id: input.exportJobId },
    include: {
      outputAsset: true,
    },
  });
  const creativeDocument = await prisma.creativeDocument.findUniqueOrThrow({
    where: { id: documentId },
    select: {
      campaignId: true,
      metadata: true,
    },
  });

  if (exportJob.documentId !== documentId) {
    throw new Error('Export job does not belong to the selected creative document.');
  }

  if (!exportJob.outputAssetId || !exportJob.outputAsset) {
    throw new Error('This export job does not have a reusable output asset yet.');
  }

  const metadata =
    creativeDocument.metadata && typeof creativeDocument.metadata === 'object' && !Array.isArray(creativeDocument.metadata)
      ? (creativeDocument.metadata as Record<string, unknown>)
      : null;
  const metadataCampaignId =
    metadata && typeof metadata.selectedCampaignId === 'string' && metadata.selectedCampaignId.trim().length > 0
      ? metadata.selectedCampaignId
      : null;
  const linkedCampaignId = creativeDocument.campaignId ?? metadataCampaignId ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.productAsset.update({
      where: { id: exportJob.outputAssetId! },
      data: {
        approvalStatus: 'APPROVED',
        workflowNode: 'creative.studio.approved',
      },
    });

    const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : new Date();
    const calendarEntry = await tx.marketingCalendarEntry.create({
      data: {
        entryKey: createKey('POST'),
        campaignId: linkedCampaignId,
        assetId: exportJob.outputAssetId,
        title: input.title,
        channel: mapMarketingChannel(input.channel),
        scheduledFor,
        status: 'SCHEDULED',
        workflowNode: 'post.scheduled',
      },
    });

    await tx.marketingPublishingJob.create({
      data: {
        jobKey: createKey('PUB'),
        campaignId: linkedCampaignId,
        calendarEntryId: calendarEntry.id,
        assetId: exportJob.outputAssetId,
        creativeName: input.title,
        channel: mapMarketingChannel(input.channel),
        status: 'QUEUED',
        queuedAt: new Date(),
        progress: 0,
        workflowNode: 'publish.queued',
      },
    });

    await tx.creativeExportJob.update({
      where: { id: exportJob.id },
      data: {
        status: 'APPROVED',
        publishChannel: mapMarketingChannel(input.channel),
      },
    });

    await tx.creativeDocumentLink.create({
      data: {
        documentId,
        linkType: 'PUBLISH_TARGET',
        publishTarget: input.channel,
      },
    });

    await tx.creativeDocument.update({
      where: { id: documentId },
      data: {
        status: 'APPROVED',
      },
    });
  });

  emitMarketingEvent({ type: 'publishing.updated' });
  emitMarketingEvent({ type: 'calendar.updated' });
  emitMarketingEvent({ type: 'community.updated' });
  emitMarketingEvent({ type: 'dashboard.updated' });

  return await getCreativeDocument(documentId);
}
