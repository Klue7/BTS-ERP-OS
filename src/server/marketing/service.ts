import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../../prisma/client.ts';
import {
  createDefaultBlueprintConfig,
  summarizeBlueprintConfig,
} from '../../marketing/contracts.ts';
import type {
  CreateMarketingTemplateInput,
  CreateMarketingAssetInput,
  CreateMarketingCreativeOutputInput,
  CreateMarketingCalendarEntryInput,
  CreateMarketingCampaignInput,
  CreateMarketingContentPostInput,
  CreateMarketingCommunityLikeInput,
  CreateMarketingCommunityCommentInput,
  CreateMarketingRenderInput,
  CreateMarketingVariantInput,
  MarketingAnalyticsSnapshot,
  MarketingAnalyticsSourceModule,
  MarketingBlueprintBehavior,
  MarketingBlueprintCanvas,
  MarketingBlueprintConfig,
  MarketingBlueprintSlot,
  MarketingBlueprintStyle,
  MarketingCalendarEntry,
  MarketingAssetSummary,
  MarketingCampaignSummary,
  MarketingCampaignPerformance,
  MarketingChannel,
  MarketingChannelHealthSnapshot,
  MarketingCommunityChannelStats,
  MarketingCommunityLikeActor,
  MarketingCommunityComment,
  MarketingCommunityPostSummary,
  MarketingContentPostSummary,
  MarketingPublishingJob,
  PublicMarketingBlueprintSnapshot,
  PublicMarketingBlueprintTarget,
  MarketingStudioSnapshot,
  MarketingTemplateSummary,
  UpdateMarketingTemplateInput,
  UpdateMarketingAssetInput,
} from '../../marketing/contracts.ts';
import { emitMarketingEvent } from './events.ts';
import { hasLiveMarketingPlatformBridge, resolveMarketingPlatformBridge } from './platform-bridge.ts';

type MarketingChannelKey = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'LINKEDIN' | 'EMAIL' | 'WHATSAPP' | 'PINTEREST';

const channelLabels: Record<MarketingChannelKey, MarketingChannel> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
  LINKEDIN: 'LinkedIn',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  PINTEREST: 'Pinterest',
};

const marketingChannelToDb: Record<MarketingChannel, MarketingChannelKey> = {
  Instagram: 'INSTAGRAM',
  Facebook: 'FACEBOOK',
  TikTok: 'TIKTOK',
  LinkedIn: 'LINKEDIN',
  Email: 'EMAIL',
  WhatsApp: 'WHATSAPP',
  Pinterest: 'PINTEREST',
};

function inferAnalyticsAttributionSource(name: string): {
  sourceModule: MarketingAnalyticsSourceModule;
  channel?: MarketingChannel;
} {
  const normalized = name.toLowerCase();

  if (normalized.includes('instagram')) {
    return { sourceModule: 'Publishing', channel: 'Instagram' };
  }

  if (normalized.includes('facebook') || normalized.includes('meta')) {
    return { sourceModule: 'Publishing', channel: 'Facebook' };
  }

  if (normalized.includes('tiktok')) {
    return { sourceModule: 'Publishing', channel: 'TikTok' };
  }

  if (normalized.includes('linkedin')) {
    return { sourceModule: 'Publishing', channel: 'LinkedIn' };
  }

  if (normalized.includes('email')) {
    return { sourceModule: 'Publishing', channel: 'Email' };
  }

  if (normalized.includes('whatsapp')) {
    return { sourceModule: 'Publishing', channel: 'WhatsApp' };
  }

  if (normalized.includes('pinterest')) {
    return { sourceModule: 'Publishing', channel: 'Pinterest' };
  }

  if (normalized.includes('direct')) {
    return { sourceModule: 'CommunityFeed' };
  }

  return { sourceModule: 'Campaigns' };
}

function buildCommunityPostKey(input: {
  campaignId?: string | null;
  assetId?: string | null;
  creativeName: string;
}) {
  const campaignPart = (input.campaignId ?? 'none').replace(/[^a-zA-Z0-9]/g, '').slice(-10).toUpperCase() || 'NONE';
  const assetPart = (input.assetId ?? 'none').replace(/[^a-zA-Z0-9]/g, '').slice(-10).toUpperCase() || 'NONE';
  const creativePart = input.creativeName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24).toUpperCase() || 'POST';
  return `COM_${campaignPart}_${assetPart}_${creativePart}`;
}

function mapPublishingStatusToCommunityStatus(
  status: 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'RETRYING',
): 'Published' | 'Scheduled' | 'Draft' | 'Failed' {
  if (status === 'PUBLISHED') {
    return 'Published';
  }

  if (status === 'FAILED') {
    return 'Failed';
  }

  if (status === 'QUEUED' || status === 'PUBLISHING' || status === 'RETRYING') {
    return 'Scheduled';
  }

  return 'Draft';
}

function parseMetricValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function parseExternalMetrics(
  value: Prisma.JsonValue | null | undefined,
): NonNullable<MarketingPublishingJob['metrics']> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const metrics: NonNullable<MarketingPublishingJob['metrics']> = {};

  for (const key of ['likes', 'comments', 'shares', 'clicks', 'saves', 'opens', 'reach', 'impressions'] as const) {
    const parsed = parseMetricValue(record[key]);
    if (parsed !== undefined) {
      metrics[key] = parsed;
    }
  }

  return Object.keys(metrics).length > 0 ? metrics : undefined;
}

function measureExternalSignal(metrics: NonNullable<MarketingPublishingJob['metrics']> | undefined) {
  if (!metrics) {
    return 0;
  }

  return (
    (metrics.reach ?? 0) +
    (metrics.impressions ?? 0) +
    (metrics.likes ?? 0) +
    (metrics.comments ?? 0) +
    (metrics.shares ?? 0) +
    (metrics.clicks ?? 0) +
    (metrics.saves ?? 0) +
    (metrics.opens ?? 0)
  );
}

function buildSyntheticChannelMetrics(
  input: {
    channel: MarketingChannel;
    creativeName: string;
    assetId?: string | null;
    calendarEntryId?: string | null;
  },
  signalIndex: number,
) {
  const baseSignal = Math.max(
    24,
    36 +
      signalIndex * 17 +
      input.creativeName.length * 4 +
      (input.assetId ? 22 : 0) +
      (input.calendarEntryId ? 14 : 0),
  );

  switch (input.channel) {
    case 'Email':
      return {
        opens: baseSignal * 19,
        clicks: Math.round(baseSignal * 3.6),
      };
    case 'WhatsApp':
      return {
        clicks: Math.round(baseSignal * 2.1),
        shares: Math.round(baseSignal * 0.45),
      };
    case 'LinkedIn':
      return {
        likes: baseSignal * 8,
        comments: Math.round(baseSignal * 0.7),
        shares: Math.round(baseSignal * 0.45),
        clicks: Math.round(baseSignal * 0.3),
      };
    case 'TikTok':
      return {
        likes: baseSignal * 13,
        comments: Math.round(baseSignal * 0.8),
        shares: Math.round(baseSignal * 0.55),
        saves: Math.round(baseSignal * 0.65),
      };
    case 'Pinterest':
      return {
        likes: baseSignal * 6,
        comments: Math.round(baseSignal * 0.2),
        shares: Math.round(baseSignal * 0.15),
        saves: Math.round(baseSignal * 0.95),
        clicks: Math.round(baseSignal * 0.45),
      };
    default:
      return {
        likes: baseSignal * 10,
        comments: Math.round(baseSignal * 0.75),
        shares: Math.round(baseSignal * 0.5),
        saves: Math.round(baseSignal * 0.35),
        clicks: Math.round(baseSignal * 0.3),
      };
  }
}

function buildCommunityChannelStats(
  job: {
    id: string;
    channel: MarketingChannelKey;
    status: 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'RETRYING';
    queuedAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    externalProvider: string | null;
    externalPostId: string | null;
    externalPostUrl: string | null;
    externalMetrics: Prisma.JsonValue | null;
    calendarEntryId: string | null;
    assetId: string | null;
    creativeName: string;
  },
  signalIndex: number,
): MarketingCommunityChannelStats {
  const channel = channelLabels[job.channel];
  const status = mapPublishingStatusToCommunityStatus(job.status);
  const publishedAtSource = job.publishedAt ?? (job.status === 'PUBLISHED' ? job.updatedAt : job.queuedAt);
  const publishedAt = formatHumanTimestamp(publishedAtSource);
  const syncedMetrics = parseExternalMetrics(job.externalMetrics);

  if (status !== 'Published') {
    return {
      channel,
      status,
      publishedAt,
      publishedAtIso: publishedAtSource.toISOString(),
      assetId: job.assetId ?? undefined,
      calendarEntryId: job.calendarEntryId ?? undefined,
      publishingJobId: job.id,
      externalProvider: job.externalProvider ?? undefined,
      externalPostId: job.externalPostId ?? undefined,
      externalPostUrl: job.externalPostUrl ?? undefined,
    };
  }

  return {
    channel,
    status,
    publishedAt,
    publishedAtIso: publishedAtSource.toISOString(),
    assetId: job.assetId ?? undefined,
    calendarEntryId: job.calendarEntryId ?? undefined,
    publishingJobId: job.id,
    externalProvider: job.externalProvider ?? undefined,
    externalPostId: job.externalPostId ?? undefined,
    externalPostUrl: job.externalPostUrl ?? undefined,
    ...(syncedMetrics ??
      buildSyntheticChannelMetrics(
        {
          channel,
          creativeName: job.creativeName,
          assetId: job.assetId,
          calendarEntryId: job.calendarEntryId,
        },
        signalIndex,
      )),
  };
}

async function syncMarketingCommunityPostsFromPublishingJobs() {
  const publishingJobs = await prisma.marketingPublishingJob.findMany({
    where: {
      status: { in: ['QUEUED', 'PUBLISHING', 'RETRYING', 'PUBLISHED', 'FAILED'] },
    },
    orderBy: [{ queuedAt: 'asc' }],
    include: {
      campaign: true,
      calendarEntry: true,
      asset: true,
    },
  });

  if (publishingJobs.length === 0) {
    return;
  }

  const existingPosts = await prisma.marketingCommunityPost.findMany({
    where: {
      postKey: { startsWith: 'COM_' },
    },
  });
  const existingPostsByKey = new Map(existingPosts.map((post) => [post.postKey, post]));
  const grouped = new Map<string, typeof publishingJobs>();

  for (const job of publishingJobs) {
    if (!job.asset?.imageUrl) {
      continue;
    }

    const postKey = buildCommunityPostKey({
      campaignId: job.campaignId,
      assetId: job.assetId,
      creativeName: job.creativeName,
    });
    const current = grouped.get(postKey) ?? [];
    current.push(job);
    grouped.set(postKey, current);
  }

  for (const [postKey, jobs] of grouped) {
    const primaryJob = [...jobs].sort((left, right) => {
      if (left.status === 'PUBLISHED' && right.status !== 'PUBLISHED') {
        return -1;
      }
      if (right.status === 'PUBLISHED' && left.status !== 'PUBLISHED') {
        return 1;
      }
      return left.queuedAt.getTime() - right.queuedAt.getTime();
    })[0];

    if (!primaryJob?.asset?.imageUrl) {
      continue;
    }

    const creatorName = primaryJob.campaign?.owner?.trim() || 'Marketing Ops';
    const creatorAvatarUrl = `https://i.pravatar.cc/150?u=${encodeURIComponent(creatorName.toLowerCase().replace(/\s+/g, '-'))}`;
    const headline = primaryJob.calendarEntry?.title?.trim() || primaryJob.creativeName.trim();
    const campaignDescription = primaryJob.campaign?.description?.trim();
    const caption = campaignDescription ? `${headline}\n\n${campaignDescription}` : headline;
    const channelStats = jobs.map((job, index) => buildCommunityChannelStats(job, index));
    const existing = existingPostsByKey.get(postKey);
    const mediaType =
      primaryJob.asset.mimeType?.toLowerCase().startsWith('video') || primaryJob.asset.assetType === 'VIDEO'
        ? 'VIDEO'
        : 'IMAGE';
    const nextChannelStatsJson = channelStats as unknown as Prisma.InputJsonValue;
    const hasChanged =
      !existing ||
      existing.campaignId !== (primaryJob.campaignId ?? null) ||
      existing.creatorName !== creatorName ||
      existing.creatorAvatarUrl !== creatorAvatarUrl ||
      existing.mediaUrl !== primaryJob.asset.imageUrl ||
      existing.mediaType !== mediaType ||
      existing.caption !== caption ||
      JSON.stringify(existing.channelStats) !== JSON.stringify(channelStats);

    if (!hasChanged) {
      continue;
    }

    if (!existing) {
      await prisma.marketingCommunityPost.create({
        data: {
          postKey,
          campaignId: primaryJob.campaignId ?? undefined,
          creatorName,
          creatorAvatarUrl,
          mediaUrl: primaryJob.asset.imageUrl,
          mediaType,
        caption,
        internalLikes: 0,
        internalLikeActors: [],
        internalComments: [],
        channelStats: nextChannelStatsJson,
        createdAt: primaryJob.queuedAt,
      },
      });
      continue;
    }

    await prisma.marketingCommunityPost.update({
      where: { id: existing.id },
      data: {
        campaignId: primaryJob.campaignId ?? undefined,
        creatorName,
        creatorAvatarUrl,
        mediaUrl: primaryJob.asset.imageUrl,
        mediaType,
        caption,
        channelStats: nextChannelStatsJson,
      },
    });
  }
}

const templateTypeLabels = {
  PRODUCT_CARD: 'Product Card',
  COLLECTION_HIGHLIGHT: 'Collection Highlight',
  QUOTE_CTA: 'Quote CTA',
} as const;

const templateStatusLabels = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
} as const;

const campaignStatusLabels = {
  ACTIVE: 'Active',
  DRAFT: 'Draft',
  COMPLETED: 'Completed',
  SCHEDULED: 'Scheduled',
} as const;

const calendarStatusLabels = {
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
  FAILED: 'Failed',
  DRAFT: 'Draft',
} as const;

const calendarEntryTypeLabels = {
  POST: 'Post',
  NOTE: 'Note',
  REMINDER: 'Reminder',
} as const;

const publishingStatusLabels = {
  QUEUED: 'Queued',
  PUBLISHING: 'Publishing',
  PUBLISHED: 'Published',
  FAILED: 'Failed',
  RETRYING: 'Retrying',
} as const;

const channelHealthLabels = {
  HEALTHY: 'Healthy',
  DEGRADED: 'Degraded',
  DOWN: 'Down',
} as const;

const assetTypeLabels = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  TWO_POINT_FIVE_D_ASSET: '2.5D Asset',
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

const assetRoleLabels = {
  PRIMARY_IMAGE: 'Hero',
  GALLERY_IMAGE: 'Gallery',
  FACE_IMAGE: 'Detail',
  HERO_IMAGE: 'Hero',
  ASSET_2_5D: '3D Ready',
  ASSET_3D: 'Model',
  PROJECT_IMAGE: 'Installation',
  GENERATED_IMAGE: 'Render',
  GALLERY_EXTRA: 'Gallery',
  INSTALLATION: 'Installation',
  DETAIL: 'Detail',
  CAMPAIGN: 'Campaign',
} as const;

const publicBlueprintDestinationByTarget: Record<PublicMarketingBlueprintTarget, MarketingTemplateSummary['destination']> = {
  'home.hero': 'Public Site Hero',
  'products.journey': 'Public Product Section',
};
type AssetStorageRecord = {
  originalFileName?: string | null;
  storedFileName?: string | null;
  storagePath?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  sha256?: string | null;
};

function createKey(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function formatDate(input: Date) {
  return input.toISOString().slice(0, 10);
}

function formatTime(input: Date) {
  return input.toISOString().slice(11, 19);
}

function formatHumanTimestamp(input: Date) {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(input);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return String(value);
}

function parseJsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function parseJsonObject<T>(value: unknown, fallback: T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}

function normalizeTemplateStatus(status?: string | null): keyof typeof templateStatusLabels {
  if (status === 'Archived') {
    return 'ARCHIVED';
  }
  if (status === 'Active') {
    return 'ACTIVE';
  }
  return 'DRAFT';
}

function normalizeTemplateType(type?: string | null): keyof typeof templateTypeLabels {
  if (type === 'Collection Highlight') {
    return 'COLLECTION_HIGHLIGHT';
  }
  if (type === 'Quote CTA') {
    return 'QUOTE_CTA';
  }
  return 'PRODUCT_CARD';
}

function normalizeBlueprintCanvas(config: MarketingBlueprintConfig['canvas']) {
  const width = Number.isFinite(config.width) ? Math.max(320, Math.round(config.width)) : 1080;
  const height = Number.isFinite(config.height) ? Math.max(320, Math.round(config.height)) : 1080;
  return {
    width,
    height,
    aspectRatio: config.aspectRatio?.trim() || `${width}:${height}`,
    safeZone: {
      top: Number.isFinite(config.safeZone.top) ? Math.max(0, config.safeZone.top) : 8,
      right: Number.isFinite(config.safeZone.right) ? Math.max(0, config.safeZone.right) : 8,
      bottom: Number.isFinite(config.safeZone.bottom) ? Math.max(0, config.safeZone.bottom) : 8,
      left: Number.isFinite(config.safeZone.left) ? Math.max(0, config.safeZone.left) : 8,
    },
  } satisfies MarketingBlueprintCanvas;
}

function normalizeBlueprintSlots(slots: MarketingBlueprintConfig['slots']) {
  return slots.map((slot, index) => ({
    id: slot.id?.trim() || `slot-${index + 1}`,
    kind: slot.kind,
    label: slot.label?.trim() || slot.kind,
    enabled: slot.enabled !== false,
    xAlign: slot.xAlign,
    yAlign: slot.yAlign,
    widthPct: Number.isFinite(slot.widthPct) ? Math.max(5, Math.min(100, slot.widthPct)) : 50,
    heightPct: Number.isFinite(slot.heightPct) ? Math.max(5, Math.min(100, slot.heightPct)) : 20,
    maxLines: slot.maxLines && Number.isFinite(slot.maxLines) ? Math.max(1, Math.min(6, slot.maxLines)) : undefined,
  })) satisfies MarketingBlueprintSlot[];
}

function normalizeBlueprintStyle(style: MarketingBlueprintConfig['style']) {
  return {
    typographyPreset: style.typographyPreset,
    overlayMode: style.overlayMode,
    colorTreatment: style.colorTreatment,
    badgeStyle: style.badgeStyle,
    backgroundTreatment: style.backgroundTreatment,
  } satisfies MarketingBlueprintStyle;
}

function normalizeBlueprintBehavior(behavior: MarketingBlueprintConfig['behavior']) {
  return {
    showPrice: Boolean(behavior.showPrice),
    showCta: Boolean(behavior.showCta),
    showCollectionLabel: Boolean(behavior.showCollectionLabel),
    showSpecStrip: Boolean(behavior.showSpecStrip),
    requiredProductFields: Array.from(new Set(behavior.requiredProductFields.filter(Boolean))),
    requiredAssetRoles: Array.from(new Set(behavior.requiredAssetRoles.filter(Boolean))),
  } satisfies MarketingBlueprintBehavior;
}

function normalizeBlueprintConfig(
  type: MarketingTemplateSummary['type'],
  destination: MarketingTemplateSummary['destination'],
  config?: Partial<MarketingBlueprintConfig> | null,
) {
  const fallback = createDefaultBlueprintConfig(type, destination);
  const canvas = normalizeBlueprintCanvas({
    ...fallback.canvas,
    ...(config?.canvas ?? {}),
    safeZone: {
      ...fallback.canvas.safeZone,
      ...(config?.canvas?.safeZone ?? {}),
    },
  });

  return {
    canvas,
    slots: normalizeBlueprintSlots(config?.slots?.length ? config.slots : fallback.slots),
    style: normalizeBlueprintStyle({ ...fallback.style, ...(config?.style ?? {}) }),
    behavior: normalizeBlueprintBehavior({ ...fallback.behavior, ...(config?.behavior ?? {}) }),
  } satisfies MarketingBlueprintConfig;
}

function mapTemplate(template: {
  id: string;
  name: string;
  description: string;
  templateType: keyof typeof templateTypeLabels;
  thumbnailUrl: string;
  blueprint: string;
  destination: string | null;
  tags: Prisma.JsonValue | null;
  allowedTargets: Prisma.JsonValue | null;
  publicSurfaceEligible: boolean;
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: string;
  safeZone: Prisma.JsonValue | null;
  layoutJson: Prisma.JsonValue | null;
  styleJson: Prisma.JsonValue | null;
  behaviorJson: Prisma.JsonValue | null;
  status: keyof typeof templateStatusLabels;
}) {
  const templateType = templateTypeLabels[template.templateType];
  const destination = (template.destination ?? 'Instagram Post') as MarketingTemplateSummary['destination'];
  const config = normalizeBlueprintConfig(templateType, destination, {
    canvas: {
      width: template.canvasWidth,
      height: template.canvasHeight,
      aspectRatio: template.aspectRatio,
      safeZone: parseJsonObject(template.safeZone, { top: 8, right: 8, bottom: 8, left: 8 }),
    },
    slots: parseJsonArray(template.layoutJson),
    style: parseJsonObject(template.styleJson, createDefaultBlueprintConfig(templateType, destination).style),
    behavior: parseJsonObject(template.behaviorJson, createDefaultBlueprintConfig(templateType, destination).behavior),
  });

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    type: templateType,
    thumbnail: template.thumbnailUrl,
    blueprint: template.blueprint || summarizeBlueprintConfig(config, destination),
    status: templateStatusLabels[template.status],
    destination,
    tags: parseJsonArray<string>(template.tags),
    publicSurfaceEligible: template.publicSurfaceEligible,
    allowedTargets: parseJsonArray<string>(template.allowedTargets),
    blueprintConfig: config,
  } satisfies MarketingTemplateSummary;
}

function normalizeAssetTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter(Boolean),
    ),
  );
}

const marketingContentTypeLabels: Record<string, MarketingContentPostSummary['type']> = {
  guide: 'guide',
  trend: 'trend',
  news: 'news',
  tips: 'tips',
  blog: 'blog',
  editorial: 'editorial',
  concept: 'concept',
  built: 'built',
};

const marketingContentStatusLabels: Record<string, MarketingContentPostSummary['status']> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

const marketingContentCoverFallbacks: Record<string, string> = {
  Architecture: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
  Technical: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=80',
  Sustainability: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80',
  Maintenance: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80',
  Innovation: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80',
  Residential: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
  Commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
};

function normalizeMarketingContentSurface(value?: string | null): MarketingContentPostSummary['targetSurface'] {
  return value === 'Design & Build' ? 'Design & Build' : 'Knowledge & Insights';
}

function normalizeMarketingContentType(value?: string | null): MarketingContentPostSummary['type'] {
  const normalized = String(value ?? '').toLowerCase();
  return marketingContentTypeLabels[normalized] ?? 'guide';
}

function normalizeMarketingContentStatus(value?: string | null): MarketingContentPostSummary['status'] {
  if (value === 'Published' || value === 'PUBLISHED') return 'Published';
  if (value === 'Archived' || value === 'ARCHIVED') return 'Archived';
  return 'Draft';
}

function mapMarketingContentStatusToDb(value?: string | null) {
  const normalized = normalizeMarketingContentStatus(value);
  if (normalized === 'Published') return 'PUBLISHED';
  if (normalized === 'Archived') return 'ARCHIVED';
  return 'DRAFT';
}

function estimateContentReadTime(body: string[]) {
  const words = body.join(' ').split(/\s+/).filter(Boolean).length;
  return `${Math.max(2, Math.ceil(words / 180))} min`;
}

function deriveContentTitle(input: CreateMarketingContentPostInput) {
  const topic = input.topic?.trim() || input.title?.trim() || 'Brick Tile Shop material guide';
  if (input.title?.trim()) {
    return input.title.trim();
  }

  const type = normalizeMarketingContentType(input.type);
  if (type === 'news') return `${topic}: Industry Update`;
  if (type === 'trend') return `${topic}: Material Trend Report`;
  if (type === 'blog') return `${topic}: Field Notes`;
  if (type === 'tips') return `${topic}: Practical Tips`;
  if (type === 'concept') return `${topic}: Design Concept`;
  if (type === 'built') return `${topic}: Built Case Study`;
  if (type === 'editorial') return `${topic}: Editorial Brief`;
  return `${topic}: Practical Guide`;
}

function buildGeneratedContentBody(input: CreateMarketingContentPostInput, assetName?: string | null) {
  const topic = input.topic?.trim() || input.title?.trim() || 'brick and cladding specification';
  const category = input.category?.trim() || 'Technical';
  const aiDirection = input.aiDirection?.trim();
  const sourceLine = assetName ? `The selected source asset, ${assetName}, gives the article a concrete visual reference and keeps the advice grounded in reusable Brick Tile Shop media.` : 'The guidance is written to connect product knowledge, customer questions, and public education into one reusable marketing asset.';

  return [
    `${topic} matters because customers, designers, and contractors need material decisions that are visual, practical, and commercially clear. This ${category.toLowerCase()} piece frames the subject around Brick Tile Shop product truth instead of generic inspiration.`,
    sourceLine,
    `For the public guide, keep the message focused on selection, installation context, maintenance expectations, and the next action a customer should take. ${aiDirection ? `Editorial direction: ${aiDirection}` : 'The tone should stay helpful, confident, and specific to South African residential and light commercial projects.'}`,
  ];
}

function buildGeneratedTakeaways(input: CreateMarketingContentPostInput, assetName?: string | null) {
  const topic = input.topic?.trim() || input.title?.trim() || 'material selection';
  return [
    `Use ${topic} as a practical decision point, not just a style reference.`,
    assetName ? `Anchor the article visually around ${assetName}.` : 'Pair every recommendation with a clear product or project context.',
    'Publish only once the content can help a customer choose, quote, or brief a project with more confidence.',
  ];
}

function mapMarketingContentPost(post: {
  id: string;
  targetSurface: string;
  contentType: string;
  status: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  readTime: string;
  category: string;
  authorName: string;
  authorRole: string | null;
  body: Prisma.JsonValue;
  takeaways: Prisma.JsonValue;
  tags: string[];
  relatedCategoryKeys: string[];
  relatedProductKeywords: string[];
  sourceAssetId: string | null;
  campaignId: string | null;
  generatedFromTopic: string | null;
  aiDirection: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}): MarketingContentPostSummary {
  const status = normalizeMarketingContentStatus(post.status);
  const publishedDate = post.publishedAt ?? post.updatedAt ?? post.createdAt;

  return {
    id: post.id,
    targetSurface: normalizeMarketingContentSurface(post.targetSurface),
    type: normalizeMarketingContentType(post.contentType),
    status,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImageUrl,
    readTime: post.readTime,
    category: post.category,
    author: post.authorName,
    authorRole: post.authorRole ?? undefined,
    featured: false,
    date: formatDate(publishedDate),
    body: parseJsonArray<string>(post.body),
    takeaways: parseJsonArray<string>(post.takeaways),
    tags: post.tags,
    relatedCategoryKeys: post.relatedCategoryKeys,
    relatedProductKeywords: post.relatedProductKeywords,
    sourceAssetId: post.sourceAssetId ?? undefined,
    campaignId: post.campaignId ?? undefined,
    topic: post.generatedFromTopic ?? undefined,
    aiDirection: post.aiDirection ?? undefined,
    createdAt: post.createdAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() ?? undefined,
    workflowNode: status === 'Published' ? 'content.published' : 'content.generated',
  };
}

function deriveAssetNameFromFilename(rawName: string) {
  const withoutExtension = rawName.replace(/\.[^/.]+$/, '');
  const normalized = withoutExtension
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return 'Uploaded Asset';
  }

  return normalized
    .split(' ')
    .map((segment) => {
      const lower = segment.toLowerCase();
      if (lower === '3d') return '3D';
      if (lower === '2.5d' || lower === '25d') return '2.5D';
      if (lower === 'bts') return 'BTS';
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function inferUploadUsageRoles(name: string, assetType: keyof typeof assetTypeLabels) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('hero')) {
    return ['HERO_IMAGE'];
  }
  if (lowerName.includes('face')) {
    return ['FACE_IMAGE'];
  }
  if (lowerName.includes('gallery')) {
    return ['GALLERY_IMAGE'];
  }
  if (lowerName.includes('install') || lowerName.includes('project')) {
    return ['INSTALLATION'];
  }
  if (lowerName.includes('detail')) {
    return ['DETAIL'];
  }
  if (assetType === 'TWO_POINT_FIVE_D_ASSET') {
    return ['ASSET_2_5D'];
  }
  if (assetType === 'THREE_D_ASSET' || assetType === 'MODEL') {
    return ['ASSET_3D'];
  }
  if (assetType === 'THREE_D_RENDER') {
    return ['GENERATED_IMAGE'];
  }

  return ['CAMPAIGN'];
}

function mapMarketingAssetTypeToDb(type: CreateMarketingAssetInput['type'] | CreateMarketingCreativeOutputInput['type']) {
  if (type === 'Video') {
    return 'VIDEO' as const;
  }
  if (type === '2.5D Asset') {
    return 'TWO_POINT_FIVE_D_ASSET' as const;
  }
  if (type === '3D Asset') {
    return 'THREE_D_ASSET' as const;
  }
  if (type === '3D Render') {
    return 'THREE_D_RENDER' as const;
  }
  if (type === 'Model') {
    return 'MODEL' as const;
  }
  return 'IMAGE' as const;
}

function mapMarketingAssetProtectionToDb(level: CreateMarketingCreativeOutputInput['protectionLevel']) {
  if (level === 'Protected Original') {
    return 'PROTECTED_ORIGINAL' as const;
  }
  if (level === 'Managed Variant') {
    return 'MANAGED_VARIANT' as const;
  }
  return 'PUBLISHABLE_VARIANT' as const;
}

function mapMarketingAssetStatusToDb(status: CreateMarketingCreativeOutputInput['status']) {
  if (status === 'Draft') {
    return 'DRAFT' as const;
  }
  if (status === 'Approved') {
    return 'APPROVED' as const;
  }
  if (status === 'Archived') {
    return 'ARCHIVED' as const;
  }
  if (status === 'Restricted') {
    return 'RESTRICTED' as const;
  }
  return 'REVIEW' as const;
}

async function loadAssetById(assetId: string) {
  return prisma.productAsset.findUniqueOrThrow({
    where: { id: assetId },
    include: {
      primaryProduct: {
        select: {
          id: true,
          name: true,
        },
      },
      links: true,
      marketingCampaignLinks: true,
    },
  });
}

function mapAssetUsage(roles: string[]) {
  return roles.map((role) => assetRoleLabels[role as keyof typeof assetRoleLabels] ?? role.replaceAll('_', ' '));
}

function mapAsset(asset: Awaited<ReturnType<typeof loadAssets>>[number]): MarketingAssetSummary {
  const storage = asset as Awaited<ReturnType<typeof loadAssets>>[number] & AssetStorageRecord;
  const linkedProductIds = asset.links
    .filter((link) => link.linkType === 'PRODUCT' && link.productId)
    .map((link) => link.productId as string);
  const linkedCampaignIds = asset.marketingCampaignLinks.map((link) => link.campaignId);

  return {
    id: asset.id,
    name: asset.name,
    type: assetTypeLabels[asset.assetType],
    protectionLevel: assetProtectionLabels[asset.protectionLevel],
    size: asset.sizeLabel,
    status: assetStatusLabels[asset.approvalStatus],
    usage: mapAssetUsage(asset.usageRoles),
    img: asset.imageUrl,
    parentId: asset.parentAssetId ?? undefined,
    productId: asset.primaryProductId ?? undefined,
    productName: asset.primaryProduct?.name ?? undefined,
    linkedProductIds,
    linkedCampaignIds,
    completeness: asset.completeness ?? undefined,
    is3DReady: asset.isThreeDReady,
    tags: asset.tags,
    workflowNode: asset.workflowNode ?? undefined,
    pipeline: asset.pipeline ? (asset.pipeline as MarketingAssetSummary['pipeline']) : undefined,
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

async function loadAssets() {
  return prisma.productAsset.findMany({
    include: {
      primaryProduct: {
        select: {
          id: true,
          name: true,
        },
      },
      links: true,
      marketingCampaignLinks: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function loadCampaigns() {
  return prisma.marketingCampaign.findMany({
    include: {
      products: true,
      assets: true,
      calendarEntries: true,
      publishingJobs: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

function deriveCampaignProgress(input: {
  status: keyof typeof campaignStatusLabels;
  productCount: number;
  assetCount: number;
  scheduledCount: number;
  publishedCount: number;
}) {
  const base =
    (input.status === 'ACTIVE' ? 20 : input.status === 'SCHEDULED' ? 10 : input.status === 'COMPLETED' ? 90 : 5) +
    (input.productCount * 10) +
    (input.assetCount * 8) +
    (input.scheduledCount * 12) +
    (input.publishedCount * 15);

  return Math.max(5, Math.min(100, base));
}

async function ensureChannelHealthSnapshots() {
  const jobs = await prisma.marketingPublishingJob.findMany({
    orderBy: [{ queuedAt: 'desc' }],
  });

  const channels = Object.keys(channelLabels) as MarketingChannelKey[];

  await prisma.$transaction(
    channels.map((channel) => {
      const channelJobs = jobs.filter((job) => job.channel === channel).slice(0, 6);
      const failed = channelJobs.filter((job) => job.status === 'FAILED').length;
      const active = channelJobs.filter((job) => job.status === 'PUBLISHING' || job.status === 'RETRYING').length;
      const syncFailures = channelJobs.filter((job) => (job.syncError ?? '').trim().length > 0).length;
      const liveBridgeActive = hasLiveMarketingPlatformBridge(channel);
      const status: keyof typeof channelHealthLabels =
        failed >= 2 || syncFailures >= 2
          ? 'DOWN'
          : failed >= 1 || syncFailures >= 1 || active >= 2 || (liveBridgeActive && channelJobs.length === 0)
            ? 'DEGRADED'
            : 'HEALTHY';
      const latencyMs =
        status === 'HEALTHY' ? 110 + channelJobs.length * 7 : status === 'DEGRADED' ? 360 + syncFailures * 40 : 820;
      const uptimePct = status === 'HEALTHY' ? '99.98' : status === 'DEGRADED' ? '99.22' : '94.10';

      return prisma.marketingChannelHealthSnapshot.create({
        data: {
          channel,
          status,
          latencyMs,
          uptimePct,
        },
      });
    }),
  );
}

export async function getMarketingStudioSnapshot(): Promise<MarketingStudioSnapshot> {
  await syncMarketingCommunityPostsFromPublishingJobs();

  const [assets, templates, campaigns, calendarEntries, publishingJobs, analyticsSnapshots, communityPosts, contentPosts, healthSnapshots] =
    await Promise.all([
      loadAssets(),
      prisma.marketingTemplate.findMany({
        where: { status: { not: 'ARCHIVED' } },
        orderBy: { createdAt: 'asc' },
      }),
      loadCampaigns(),
      prisma.marketingCalendarEntry.findMany({
        orderBy: [{ scheduledFor: 'asc' }],
      }),
      prisma.marketingPublishingJob.findMany({
        orderBy: [{ queuedAt: 'desc' }],
      }),
      prisma.marketingAnalyticsSnapshot.findMany({
        include: { campaign: true },
        orderBy: [{ periodEnd: 'desc' }],
      }),
      prisma.marketingCommunityPost.findMany({
        include: { campaign: true },
        orderBy: [{ createdAt: 'desc' }],
      }),
      prisma.marketingContentPost.findMany({
        orderBy: [{ updatedAt: 'desc' }],
      }),
      prisma.marketingChannelHealthSnapshot.findMany({
        orderBy: [{ capturedAt: 'desc' }],
      }),
    ]);

  const mappedAssets = assets.map(mapAsset);
  const latestGlobalAnalytics = analyticsSnapshots.find((snapshot) => snapshot.scope === 'GLOBAL') ?? null;
  const campaignAnalytics = analyticsSnapshots.filter((snapshot) => snapshot.scope === 'CAMPAIGN');

  const latestHealthByChannel = new Map<string, (typeof healthSnapshots)[number]>();
  for (const snapshot of healthSnapshots) {
    if (!latestHealthByChannel.has(snapshot.channel)) {
      latestHealthByChannel.set(snapshot.channel, snapshot);
    }
  }

  const totalReach = communityPosts.reduce((sum, post) => {
    const channelStats = parseJsonArray<MarketingCommunityChannelStats>(post.channelStats);
    return (
      sum +
      channelStats.reduce(
        (channelSum, channel) =>
          channelSum + (channel.likes ?? 0) + (channel.comments ?? 0) + (channel.shares ?? 0) + (channel.clicks ?? 0) + (channel.opens ?? 0),
        0,
      )
    );
  }, 0);

  const totalQuotes = latestGlobalAnalytics?.quotes ?? campaignAnalytics.reduce((sum, snapshot) => sum + snapshot.quotes, 0);
  const totalLeads = latestGlobalAnalytics?.leads ?? campaignAnalytics.reduce((sum, snapshot) => sum + snapshot.leads, 0);
  const pendingRenders = mappedAssets.filter((asset) => asset.status === 'Review' || asset.workflowNode === 'creative.rendered').length;
  const conversionRate = latestGlobalAnalytics ? Number(latestGlobalAnalytics.conversionRatePct) : totalLeads > 0 ? (totalQuotes / totalLeads) * 100 : 0;

  const liveCampaigns = campaigns.slice(0, 3).map((campaign) => {
    const publishedCount = campaign.publishingJobs.filter((job) => job.status === 'PUBLISHED').length;
    return {
      id: campaign.campaignKey,
      name: campaign.name,
      status: campaignStatusLabels[campaign.status],
      progress: deriveCampaignProgress({
        status: campaign.status,
        productCount: campaign.products.length,
        assetCount: campaign.assets.length,
        scheduledCount: campaign.calendarEntries.length,
        publishedCount,
      }),
    };
  });

  const readinessCount = mappedAssets.filter((asset) => asset.is3DReady).length;
  const readinessPct = mappedAssets.length === 0 ? 0 : Math.round((readinessCount / mappedAssets.length) * 100);
  const generatedVariants = mappedAssets.filter((asset) => asset.parentId).length;

  const dashboard = {
    kpis: [
      {
        label: 'Active Campaigns',
        value: String(campaigns.filter((campaign) => campaign.status === 'ACTIVE').length),
        trend: `+${campaigns.filter((campaign) => campaign.status === 'SCHEDULED').length}`,
        route: 'Campaigns' as const,
      },
      {
        label: 'Pending Renders',
        value: String(pendingRenders),
        trend: pendingRenders > 0 ? 'High' : 'Clear',
        route: 'AssetLab' as const,
      },
      {
        label: 'Total Reach',
        value: formatCompact(totalReach),
        trend: latestGlobalAnalytics ? `+${Number(latestGlobalAnalytics.roas).toFixed(1)}x` : '+0.0x',
        route: 'CommunityFeed' as const,
      },
      {
        label: 'Conversion',
        value: `${conversionRate.toFixed(1)}%`,
        trend: totalQuotes > 0 ? `+${Math.max(0.2, conversionRate / 10).toFixed(1)}%` : '+0.0%',
        route: 'Analytics' as const,
      },
    ],
    liveCampaigns,
    assetLabStats: [
      { label: 'Total Assets', value: formatCompact(mappedAssets.length), route: 'AssetLab' as const },
      { label: '3D Readiness', value: `${readinessPct}%`, route: 'AssetLab' as const },
      { label: 'Active Renders', value: String(pendingRenders), route: 'CreativeGenerator' as const },
      { label: 'New Variants', value: String(generatedVariants), route: 'Publishing' as const },
    ],
    totalAssets: mappedAssets.length,
    renderedVariants: generatedVariants,
    publishableVariants: mappedAssets.filter((asset) => asset.protectionLevel === 'Publishable Variant').length,
    generatedAt: new Date().toISOString(),
  };

  const studioTemplates: MarketingTemplateSummary[] = templates.map(mapTemplate);

  const studioCampaigns: MarketingCampaignSummary[] = campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    owner: campaign.owner,
    description: campaign.description,
    status: campaignStatusLabels[campaign.status],
    startDate: formatDate(campaign.startDate),
    endDate: formatDate(campaign.endDate),
    channels: campaign.channels.map((channel) => channelLabels[channel]),
    linkedAssetIds: campaign.assets.map((asset) => asset.assetId),
    productIds: campaign.products.map((product) => product.productId),
    budget: campaign.budgetLabel,
    workflowNode: campaign.workflowNode === 'campaign.created' ? 'campaign.created' : (campaign.workflowNode ?? undefined),
  }));

  const studioCalendarEntries: MarketingCalendarEntry[] = calendarEntries.map((entry) => ({
    id: entry.id,
    entryType: calendarEntryTypeLabels[entry.entryType],
    title: entry.title,
    description: entry.description ?? undefined,
    channel: entry.channel ? channelLabels[entry.channel] : undefined,
    time: formatTime(entry.scheduledFor),
    date: formatDate(entry.scheduledFor),
    status: calendarStatusLabels[entry.status],
    assetId: entry.assetId ?? undefined,
    campaignId: entry.campaignId ?? undefined,
    workflowNode:
      entry.workflowNode === 'post.scheduled' || entry.workflowNode === 'note.scheduled' || entry.workflowNode === 'reminder.scheduled'
        ? entry.workflowNode
        : undefined,
  }));

  const studioPublishingJobs: MarketingPublishingJob[] = publishingJobs.map((job) => ({
    id: job.id,
    creativeName: job.creativeName,
    channel: channelLabels[job.channel],
    status: publishingStatusLabels[job.status],
    timestamp: formatTime(job.queuedAt),
    progress: job.progress ?? undefined,
    error: job.errorMessage ?? undefined,
    syncError: job.syncError ?? undefined,
    assetId: job.assetId ?? undefined,
    campaignId: job.campaignId ?? undefined,
    postId: job.calendarEntryId ?? undefined,
    externalProvider: job.externalProvider ?? undefined,
    externalPostId: job.externalPostId ?? undefined,
    externalPostUrl: job.externalPostUrl ?? undefined,
    externalStatus: job.externalStatus ?? undefined,
    lastSyncedAt: job.lastSyncedAt?.toISOString() ?? undefined,
    publishedAt: job.publishedAt?.toISOString() ?? undefined,
    metrics: parseExternalMetrics(job.externalMetrics),
    workflowNode:
      job.workflowNode === 'publish.queued' || job.workflowNode === 'publish.succeeded' || job.workflowNode === 'publish.failed'
        ? job.workflowNode
        : undefined,
  }));

  const studioChannelHealth: MarketingChannelHealthSnapshot[] = Array.from(latestHealthByChannel.values())
    .sort((left, right) => left.channel.localeCompare(right.channel))
    .map((snapshot) => ({
      name: channelLabels[snapshot.channel],
      status: channelHealthLabels[snapshot.status],
      latency: `${snapshot.latencyMs}ms`,
      uptime: `${Number(snapshot.uptimePct).toFixed(2)}%`,
    }));

  const highestLeadCampaign = [...campaignAnalytics].sort((left, right) => right.leads - left.leads)[0] ?? null;
  const highestQuoteCampaign = [...campaignAnalytics].sort((left, right) => right.quotes - left.quotes)[0] ?? null;
  const highestSpendCampaign = [...campaignAnalytics].sort((left, right) => Number(right.spendZar) - Number(left.spendZar))[0] ?? null;
  const highestRoasCampaign = [...campaignAnalytics].sort((left, right) => Number(right.roas) - Number(left.roas))[0] ?? null;

  const defaultTrend: MarketingAnalyticsSnapshot['trend'] = Array.from({ length: 24 }).map((_, index) => ({
    label: `D${index + 1}`,
    leads: Math.max(5, Math.round(totalLeads / 24 + ((index % 5) * 3))),
    quotes: Math.max(2, Math.round(totalQuotes / 24 + ((index % 4) * 2))),
    sourceModule: 'Campaigns',
  }));

  const externalChannelTotals = publishingJobs.reduce(
    (accumulator, job) => {
      const metrics = parseExternalMetrics(job.externalMetrics);
      const total = measureExternalSignal(metrics);
      if (!metrics || total <= 0) {
        return accumulator;
      }

      accumulator.set(job.channel, (accumulator.get(job.channel) ?? 0) + total);
      return accumulator;
    },
    new Map<MarketingChannelKey, number>(),
  );
  const channelColorMap: Record<MarketingChannelKey, 'blue' | 'red' | 'green' | 'purple'> = {
    INSTAGRAM: 'blue',
    FACEBOOK: 'red',
    TIKTOK: 'green',
    LINKEDIN: 'purple',
    EMAIL: 'purple',
    WHATSAPP: 'green',
    PINTEREST: 'red',
  };
  const externalChannelAttribution =
    externalChannelTotals.size > 0
      ? Array.from(externalChannelTotals.entries())
          .sort((left, right) => right[1] - left[1])
          .map(([channel, value]) => ({
            name: channelLabels[channel],
            value,
            color: channelColorMap[channel],
          }))
      : null;

  const channelAttributionSource =
    externalChannelAttribution ??
    (latestGlobalAnalytics?.channelAttribution
      ? (latestGlobalAnalytics.channelAttribution as Array<{ name: string; value: number; color: 'blue' | 'red' | 'green' | 'purple' }>)
      : [
          { name: 'Instagram Ads', value: 42, color: 'blue' },
          { name: 'Google Search', value: 28, color: 'red' },
          { name: 'Direct Traffic', value: 18, color: 'green' },
          { name: 'Email Marketing', value: 12, color: 'purple' },
        ]);

  const channelAttribution: MarketingAnalyticsSnapshot['channelAttribution'] = channelAttributionSource.map((channel) => {
    const source = inferAnalyticsAttributionSource(channel.name);
    return {
      ...channel,
      color: channel.color as 'blue' | 'red' | 'green' | 'purple',
      sourceModule: source.sourceModule,
      channel: source.channel,
    };
  });

  const performance: MarketingCampaignPerformance[] = campaignAnalytics.map((snapshot) => ({
    id: snapshot.campaignId ?? snapshot.id,
    name: snapshot.campaign?.name ?? snapshot.label,
    leads: snapshot.leads,
    quotes: snapshot.quotes,
    conversion: `${Number(snapshot.conversionRatePct).toFixed(1)}%`,
    spend: formatMoney(Number(snapshot.spendZar)),
    roas: `${Number(snapshot.roas).toFixed(1)}x`,
    publishedCount: snapshot.publishedPosts,
    workflowNode: 'analytics.updated',
  }));

  const externalAssetScores = publishingJobs.reduce(
    (accumulator, job) => {
      if (!job.assetId) {
        return accumulator;
      }

      const metrics = parseExternalMetrics(job.externalMetrics);
      const total = measureExternalSignal(metrics);
      if (total <= 0) {
        return accumulator;
      }

      const current = accumulator.get(job.assetId) ?? { total: 0, campaignId: job.campaignId ?? undefined };
      current.total += total;
      current.campaignId = current.campaignId ?? job.campaignId ?? undefined;
      accumulator.set(job.assetId, current);
      return accumulator;
    },
    new Map<string, { total: number; campaignId?: string }>(),
  );
  const topExternalAssetEntry = Array.from(externalAssetScores.entries()).sort((left, right) => right[1].total - left[1].total)[0];
  const topExternalAsset = topExternalAssetEntry
    ? mappedAssets.find((asset) => asset.id === topExternalAssetEntry[0]) ?? null
    : null;
  const topAssetSource = topExternalAsset
    ? {
        name: topExternalAsset.name,
        imageUrl: topExternalAsset.img,
        quotesGenerated: Math.round(topExternalAssetEntry?.[1].total ?? 0),
        campaignId: topExternalAssetEntry?.[1].campaignId,
        sourceModule: 'Publishing' as const,
      }
    : latestGlobalAnalytics?.topAsset
      ? (latestGlobalAnalytics.topAsset as { name: string; imageUrl: string; quotesGenerated: number })
      : mappedAssets[0]
        ? {
            name: mappedAssets[0].name,
            imageUrl: mappedAssets[0].img,
            quotesGenerated: totalQuotes,
          }
        : null;
  const resolvedTopAsset =
    topAssetSource === null
      ? null
      : mappedAssets.find((asset) => asset.img === topAssetSource.imageUrl || asset.name === topAssetSource.name) ?? null;
  const topAsset = topAssetSource
    ? {
        id: resolvedTopAsset?.id,
        name: topAssetSource.name,
        imageUrl: topAssetSource.imageUrl,
        quotesGenerated: topAssetSource.quotesGenerated,
        campaignId:
          ('campaignId' in topAssetSource && typeof topAssetSource.campaignId === 'string'
            ? topAssetSource.campaignId
            : undefined) ??
          resolvedTopAsset?.campaignId ??
          resolvedTopAsset?.linkedCampaignIds?.[0],
        sourceModule:
          'sourceModule' in topAssetSource && topAssetSource.sourceModule === 'Publishing' ? ('Publishing' as const) : ('AssetLab' as const),
      }
    : null;

  const community: MarketingCommunityPostSummary[] = communityPosts.map((post) => {
    const channels = parseJsonArray<MarketingCommunityChannelStats>(post.channelStats);
    const channelAssetIds = channels
      .map((channel) => channel.assetId)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);
    const channelCalendarIds = channels
      .map((channel) => channel.calendarEntryId)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);
    const channelJobIds = channels
      .map((channel) => channel.publishingJobId)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);
    const matchedAsset = mappedAssets.find((asset) => asset.img === post.mediaUrl) ?? null;

    return {
      id: post.id,
      campaignId: post.campaignId ?? '',
      campaignName: post.campaign?.name ?? 'Unlinked Campaign',
      assetId: channelAssetIds[0] ?? matchedAsset?.id,
      calendarEntryIds: Array.from(new Set(channelCalendarIds)),
      publishingJobIds: Array.from(new Set(channelJobIds)),
      creator: {
        name: post.creatorName,
        avatar: post.creatorAvatarUrl,
      },
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType === 'VIDEO' ? 'video' : 'image',
      caption: post.caption,
      createdAt: formatHumanTimestamp(post.createdAt),
      channels,
      internalComments: parseJsonArray<MarketingCommunityComment>(post.internalComments),
      internalLikes: post.internalLikes,
      internalLikeActors: parseJsonArray<MarketingCommunityLikeActor>(post.internalLikeActors),
      workflowNode: channelJobIds.length > 0 ? 'community.synced' : undefined,
    };
  });

  return {
    dashboard,
    assets: mappedAssets,
    templates: studioTemplates,
    campaigns: studioCampaigns,
    calendarEntries: studioCalendarEntries,
    publishingJobs: studioPublishingJobs,
    channelHealth: studioChannelHealth,
    analytics: {
      kpis: [
        {
          label: 'Total Leads',
          value: formatCompact(totalLeads),
          trend: '+12.5%',
          kind: 'leads',
          sourceModule: 'Campaigns',
          campaignId: highestLeadCampaign?.campaignId ?? highestLeadCampaign?.id,
        },
        {
          label: 'Quote Conversion',
          value: `${conversionRate.toFixed(1)}%`,
          trend: '+4.2%',
          kind: 'quotes',
          sourceModule: 'Campaigns',
          campaignId: highestQuoteCampaign?.campaignId ?? highestQuoteCampaign?.id,
        },
        {
          label: 'Avg. CAC',
          value: formatMoney(totalQuotes > 0 ? Number(latestGlobalAnalytics?.spendZar ?? 0) / Math.max(totalQuotes, 1) : 0),
          trend: '-8.1%',
          kind: 'cac',
          sourceModule: 'Campaigns',
          campaignId: highestSpendCampaign?.campaignId ?? highestSpendCampaign?.id,
        },
        {
          label: 'ROAS',
          value: `${Number(latestGlobalAnalytics?.roas ?? 0).toFixed(1)}x`,
          trend: '+0.5x',
          kind: 'roas',
          sourceModule: 'Campaigns',
          campaignId: highestRoasCampaign?.campaignId ?? highestRoasCampaign?.id,
        },
      ],
      trend: latestGlobalAnalytics?.trend
        ? (latestGlobalAnalytics.trend as Array<{ label: string; leads: number; quotes: number }>).map((point) => ({
            ...point,
            sourceModule: 'Campaigns',
          }))
        : defaultTrend,
      channelAttribution,
      topAsset,
      performance,
    },
    communityPosts: community,
    contentPosts: contentPosts.map(mapMarketingContentPost),
  };
}

export async function listMarketingTemplates(status: 'active' | 'archived' | 'all' = 'active') {
  const records = await prisma.marketingTemplate.findMany({
    where:
      status === 'all'
        ? undefined
        : status === 'archived'
          ? { status: 'ARCHIVED' }
          : { status: { not: 'ARCHIVED' } },
    orderBy: [{ createdAt: 'asc' }],
  });

  return records.map(mapTemplate);
}

export async function listPublishedMarketingContent() {
  const records = await prisma.marketingContentPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
  });

  return records.map(mapMarketingContentPost);
}

export async function createMarketingContentPost(input: CreateMarketingContentPostInput) {
  const sourceAsset = input.sourceAssetId
    ? await prisma.productAsset.findUnique({
        where: { id: input.sourceAssetId },
        select: { id: true, name: true, imageUrl: true, tags: true, primaryProduct: { select: { name: true, publicSku: true } } },
      })
    : null;
  const status = mapMarketingContentStatusToDb(input.status);
  const targetSurface = normalizeMarketingContentSurface(input.targetSurface);
  const contentType = normalizeMarketingContentType(input.type);
  const title = deriveContentTitle({ ...input, type: contentType });
  const body = input.body?.filter((paragraph) => paragraph.trim().length > 0) ?? buildGeneratedContentBody(input, sourceAsset?.name);
  const takeaways = input.takeaways?.filter((takeaway) => takeaway.trim().length > 0) ?? buildGeneratedTakeaways(input, sourceAsset?.name);
  const topic = input.topic?.trim() || title;
  const category = input.category?.trim() || (targetSurface === 'Design & Build' ? 'Residential' : 'Technical');
  const coverImage =
    input.coverImage?.trim() ||
    sourceAsset?.imageUrl ||
    marketingContentCoverFallbacks[category] ||
    marketingContentCoverFallbacks.Technical;
  const excerpt =
    input.excerpt?.trim() ||
    `${topic} distilled into a Brick Tile Shop ${contentType} with product-aware context, practical guidance, and a clear next step for customers.`;
  const tags = normalizeAssetTags([
    ...(input.tags ?? []),
    contentType,
    category,
    ...(sourceAsset?.tags ?? []),
    ...(sourceAsset?.primaryProduct?.name ? [sourceAsset.primaryProduct.name] : []),
  ]).slice(0, 12);
  const relatedProductKeywords = normalizeAssetTags([
    ...(input.relatedProductKeywords ?? []),
    topic,
    category,
    ...(sourceAsset?.primaryProduct?.name ? [sourceAsset.primaryProduct.name] : []),
    ...(sourceAsset?.primaryProduct?.publicSku ? [sourceAsset.primaryProduct.publicSku] : []),
  ]).slice(0, 16);
  const relatedCategoryKeys = Array.from(
    new Set((input.relatedCategoryKeys?.length ? input.relatedCategoryKeys : ['cladding-tiles']).filter(Boolean)),
  ).slice(0, 4);
  const now = new Date();

  const record = await prisma.marketingContentPost.create({
    data: {
      contentKey: createKey('CONTENT'),
      targetSurface,
      contentType,
      status,
      title,
      excerpt,
      coverImageUrl: coverImage,
      readTime: estimateContentReadTime(body),
      category,
      authorName: input.author?.trim() || 'BTS Editorial',
      authorRole: input.authorRole?.trim() || (targetSurface === 'Design & Build' ? 'Material Editor' : 'Editorial Desk'),
      body: body as unknown as Prisma.InputJsonValue,
      takeaways: takeaways as unknown as Prisma.InputJsonValue,
      tags,
      relatedCategoryKeys,
      relatedProductKeywords,
      sourceAssetId: sourceAsset?.id ?? input.sourceAssetId ?? null,
      campaignId: input.campaignId?.trim() || null,
      generatedFromTopic: topic,
      aiDirection: input.aiDirection?.trim() || null,
      publishedAt: status === 'PUBLISHED' ? now : null,
    },
  });

  emitMarketingEvent({ type: 'dashboard.updated' });
  return mapMarketingContentPost(record);
}

function selectPublicBlueprintForTarget(
  templates: MarketingTemplateSummary[],
  target: PublicMarketingBlueprintTarget,
) {
  const preferredDestination = publicBlueprintDestinationByTarget[target];

  return (
    templates.find((template) => template.allowedTargets.includes(target)) ??
    templates.find((template) => template.destination === preferredDestination) ??
    null
  );
}

export async function getPublicMarketingBlueprintSnapshot(): Promise<PublicMarketingBlueprintSnapshot> {
  const templates = await prisma.marketingTemplate.findMany({
    where: {
      status: 'ACTIVE',
      publicSurfaceEligible: true,
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  const mapped = templates.map(mapTemplate);

  return {
    generatedAt: new Date().toISOString(),
    surfaces: {
      'home.hero': selectPublicBlueprintForTarget(mapped, 'home.hero'),
      'products.journey': selectPublicBlueprintForTarget(mapped, 'products.journey'),
    },
  };
}

export async function createMarketingTemplate(input: CreateMarketingTemplateInput) {
  const templateType = input.type ?? 'Product Card';
  const destination = input.destination ?? 'Instagram Post';
  const blueprintConfig = normalizeBlueprintConfig(templateType, destination, input.blueprintConfig);
  const blueprintSummary = input.blueprint?.trim() || summarizeBlueprintConfig(blueprintConfig, destination);
  const template = await prisma.marketingTemplate.create({
    data: {
      templateKey: createKey('TMP'),
      name: input.name?.trim() || `Blueprint ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      description: input.description?.trim() || 'Draft deterministic marketing blueprint.',
      templateType: normalizeTemplateType(templateType),
      thumbnailUrl: input.thumbnail?.trim() || 'https://picsum.photos/seed/marketing-blueprint/400/300',
      blueprint: blueprintSummary,
      destination,
      tags: input.tags ?? [],
      allowedTargets: input.allowedTargets ?? [destination],
      publicSurfaceEligible: Boolean(input.publicSurfaceEligible),
      canvasWidth: blueprintConfig.canvas.width,
      canvasHeight: blueprintConfig.canvas.height,
      aspectRatio: blueprintConfig.canvas.aspectRatio,
      safeZone: blueprintConfig.canvas.safeZone,
      layoutJson: blueprintConfig.slots,
      styleJson: blueprintConfig.style,
      behaviorJson: blueprintConfig.behavior,
      status: normalizeTemplateStatus(input.status),
    },
  });

  emitMarketingEvent({ type: 'template.created', entityId: template.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  return mapTemplate(template);
}

export async function updateMarketingTemplate(templateId: string, input: UpdateMarketingTemplateInput) {
  const existing = await prisma.marketingTemplate.findUniqueOrThrow({ where: { id: templateId } });
  const templateType = input.type ?? templateTypeLabels[existing.templateType];
  const destination = input.destination ?? (existing.destination as MarketingTemplateSummary['destination']);
  const blueprintConfig = normalizeBlueprintConfig(templateType, destination, input.blueprintConfig ?? {
    canvas: {
      width: existing.canvasWidth,
      height: existing.canvasHeight,
      aspectRatio: existing.aspectRatio,
      safeZone: parseJsonObject(existing.safeZone, { top: 8, right: 8, bottom: 8, left: 8 }),
    },
    slots: parseJsonArray(existing.layoutJson),
    style: parseJsonObject(existing.styleJson, createDefaultBlueprintConfig(templateType, destination).style),
    behavior: parseJsonObject(existing.behaviorJson, createDefaultBlueprintConfig(templateType, destination).behavior),
  });

  const updated = await prisma.marketingTemplate.update({
    where: { id: templateId },
    data: {
      name: input.name?.trim() ?? existing.name,
      description: input.description?.trim() ?? existing.description,
      templateType: normalizeTemplateType(templateType),
      thumbnailUrl: input.thumbnail?.trim() ?? existing.thumbnailUrl,
      blueprint: input.blueprint?.trim() || summarizeBlueprintConfig(blueprintConfig, destination),
      destination,
      tags: input.tags ?? existing.tags,
      allowedTargets: input.allowedTargets ?? existing.allowedTargets,
      publicSurfaceEligible: input.publicSurfaceEligible ?? existing.publicSurfaceEligible,
      canvasWidth: blueprintConfig.canvas.width,
      canvasHeight: blueprintConfig.canvas.height,
      aspectRatio: blueprintConfig.canvas.aspectRatio,
      safeZone: blueprintConfig.canvas.safeZone,
      layoutJson: blueprintConfig.slots,
      styleJson: blueprintConfig.style,
      behaviorJson: blueprintConfig.behavior,
      status: input.status ? normalizeTemplateStatus(input.status) : existing.status,
    },
  });

  emitMarketingEvent({ type: 'template.updated', entityId: updated.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  return mapTemplate(updated);
}

export async function duplicateMarketingTemplate(templateId: string) {
  const existing = await prisma.marketingTemplate.findUniqueOrThrow({ where: { id: templateId } });
  const duplicated = await prisma.marketingTemplate.create({
    data: {
      templateKey: createKey('TMP'),
      name: `${existing.name} Copy`,
      description: existing.description,
      templateType: existing.templateType,
      thumbnailUrl: existing.thumbnailUrl,
      blueprint: existing.blueprint,
      destination: existing.destination,
      tags: existing.tags,
      allowedTargets: existing.allowedTargets,
      publicSurfaceEligible: existing.publicSurfaceEligible,
      canvasWidth: existing.canvasWidth,
      canvasHeight: existing.canvasHeight,
      aspectRatio: existing.aspectRatio,
      safeZone: existing.safeZone,
      layoutJson: existing.layoutJson,
      styleJson: existing.styleJson,
      behaviorJson: existing.behaviorJson,
      status: 'DRAFT',
    },
  });

  emitMarketingEvent({ type: 'template.created', entityId: duplicated.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  return mapTemplate(duplicated);
}

export async function archiveMarketingTemplate(templateId: string) {
  const archived = await prisma.marketingTemplate.update({
    where: { id: templateId },
    data: { status: 'ARCHIVED' },
  });

  emitMarketingEvent({ type: 'template.updated', entityId: archived.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  return mapTemplate(archived);
}

export async function restoreMarketingTemplate(templateId: string) {
  const existing = await prisma.marketingTemplate.findUniqueOrThrow({
    where: { id: templateId },
  });

  const restored = await prisma.marketingTemplate.update({
    where: { id: templateId },
    data: {
      status: existing.status === 'ARCHIVED' ? 'ACTIVE' : existing.status,
    },
  });

  emitMarketingEvent({
    type: 'template.restored',
    entityId: restored.id,
  });

  return mapTemplate(restored);
}

export async function createMarketingCampaign(input: CreateMarketingCampaignInput) {
  const campaign = await prisma.$transaction(async (tx) => {
    const created = await tx.marketingCampaign.create({
      data: {
        campaignKey: createKey('CMP'),
        name: input.name.trim(),
        owner: input.owner.trim(),
        description: input.description.trim(),
        status:
          input.status === 'Active'
            ? 'ACTIVE'
            : input.status === 'Completed'
              ? 'COMPLETED'
              : input.status === 'Scheduled'
                ? 'SCHEDULED'
                : 'DRAFT',
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        channels: input.channels.map((channel) => marketingChannelToDb[channel]),
        budgetLabel: input.budget.trim() || 'R 0',
        workflowNode: 'campaign.created',
      },
    });

    if (input.productIds.length) {
      await tx.marketingCampaignProduct.createMany({
        data: input.productIds.map((productId) => ({
          campaignId: created.id,
          productId,
        })),
        skipDuplicates: true,
      });
    }

    for (const assetId of input.linkedAssetIds) {
      await tx.marketingCampaignAsset.create({
        data: {
          campaignId: created.id,
          assetId,
        },
      });

      await tx.assetLink.create({
        data: {
          assetId,
          linkType: 'CAMPAIGN',
          campaignKey: created.campaignKey,
        },
      });
    }

    return created;
  });

  emitMarketingEvent({ type: 'campaign.created', entityId: campaign.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  return {
    id: campaign.id,
    name: campaign.name,
    owner: campaign.owner,
    description: campaign.description,
    status: campaignStatusLabels[campaign.status],
    startDate: formatDate(campaign.startDate),
    endDate: formatDate(campaign.endDate),
    channels: campaign.channels.map((channel) => channelLabels[channel]),
    linkedAssetIds: input.linkedAssetIds,
    productIds: input.productIds,
    budget: campaign.budgetLabel,
    workflowNode: 'campaign.created',
  };
}

export async function createMarketingCalendarEntry(input: CreateMarketingCalendarEntryInput) {
  const entryType =
    input.entryType === 'Note'
      ? 'NOTE'
      : input.entryType === 'Reminder'
        ? 'REMINDER'
        : 'POST';
  const campaignId =
    input.campaignId ??
    (entryType === 'POST'
      ? (
          await prisma.marketingCampaign.findFirst({
            where: { status: { in: ['ACTIVE', 'SCHEDULED'] } },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
          })
        )?.id
      : undefined);

  const defaultAssetId =
    entryType === 'POST'
      ? input.assetId ??
        (campaignId
      ? (
          await prisma.marketingCampaignAsset.findFirst({
            where: { campaignId },
            orderBy: { createdAt: 'asc' },
            select: { assetId: true },
          })
        )?.assetId
      : undefined)
      : undefined;

  const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const channel =
    entryType === 'POST'
      ? marketingChannelToDb[input.channel ?? 'Instagram']
      : null;
  const workflowNode =
    entryType === 'NOTE'
      ? 'note.scheduled'
      : entryType === 'REMINDER'
        ? 'reminder.scheduled'
        : 'post.scheduled';
  const defaultTitle =
    entryType === 'NOTE'
      ? 'Calendar Note'
      : entryType === 'REMINDER'
        ? 'Reminder'
        : 'Quick Scheduled Post';

  const entry = await prisma.marketingCalendarEntry.create({
    data: {
      entryKey: createKey('POST'),
      campaignId: campaignId ?? null,
      assetId: defaultAssetId ?? null,
      entryType,
      title: input.title?.trim() || defaultTitle,
      description: input.description?.trim() || null,
      channel,
      scheduledFor,
      status: 'SCHEDULED',
      workflowNode,
    },
  });

  emitMarketingEvent({ type: 'calendar.updated', entityId: entry.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  return {
    id: entry.id,
    entryType: calendarEntryTypeLabels[entry.entryType],
    title: entry.title,
    description: entry.description ?? undefined,
    channel: entry.channel ? channelLabels[entry.channel] : undefined,
    time: formatTime(entry.scheduledFor),
    date: formatDate(entry.scheduledFor),
    status: calendarStatusLabels[entry.status],
    assetId: entry.assetId ?? undefined,
    campaignId: entry.campaignId ?? undefined,
    workflowNode:
      entry.workflowNode === 'note.scheduled'
        ? 'note.scheduled'
        : entry.workflowNode === 'reminder.scheduled'
          ? 'reminder.scheduled'
          : 'post.scheduled',
  };
}

export async function createMarketingAsset(input: CreateMarketingAssetInput) {
  const assetType =
    input.type === 'Video'
      ? 'VIDEO'
      : input.type === '2.5D Asset'
        ? 'TWO_POINT_FIVE_D_ASSET'
        : input.type === '3D Asset'
        ? 'THREE_D_ASSET'
        : input.type === '3D Render'
          ? 'THREE_D_RENDER'
          : input.type === 'Model'
              ? 'MODEL'
              : 'IMAGE';
  const normalizedName = deriveAssetNameFromFilename(input.name.trim());
  const usageRoles = inferUploadUsageRoles(normalizedName, assetType);
  const linkedProduct = input.productId
    ? await prisma.product.findUnique({
        where: { id: input.productId },
        select: { id: true, name: true },
      })
    : null;
  const derivedTags = normalizeAssetTags([
    ...(input.tags ?? []),
    'Direct Upload',
    assetTypeLabels[assetType],
    ...usageRoles.map((role) => assetRoleLabels[role as keyof typeof assetRoleLabels] ?? role),
    ...(linkedProduct?.name ? [linkedProduct.name] : []),
  ]);

  const asset = await prisma.productAsset.create({
    data: {
      assetKey: createKey('AST'),
      primaryProductId: linkedProduct?.id ?? null,
      name: normalizedName,
      assetType,
      assetSource: 'DIRECT_UPLOAD',
      protectionLevel: 'PROTECTED_ORIGINAL',
      approvalStatus: 'REVIEW',
      sizeLabel: input.size,
      imageUrl: input.imageUrl,
      originalFileName: input.originalFilename ?? normalizedName,
      storedFileName: input.storedFilename ?? null,
      storagePath: input.storagePath ?? null,
      mimeType: input.mimeType ?? null,
      fileSizeBytes: input.fileSizeBytes ?? null,
      sha256: input.sha256 ?? null,
      usageRoles,
      completeness: 70,
      isThreeDReady: assetType === 'THREE_D_ASSET' || assetType === 'MODEL' || assetType === 'TWO_POINT_FIVE_D_ASSET',
      workflowNode: 'asset.uploaded',
      tags: derivedTags,
    } as Prisma.ProductAssetUncheckedCreateInput,
    include: {
      primaryProduct: {
        select: {
          id: true,
          name: true,
        },
      },
      links: true,
      marketingCampaignLinks: true,
    },
  });

  if (linkedProduct?.id) {
    await prisma.assetLink.create({
      data: {
        assetId: asset.id,
        linkType: 'PRODUCT',
        productId: linkedProduct.id,
      },
    });
  }

  emitMarketingEvent({ type: 'asset.created', entityId: asset.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  const created = await prisma.productAsset.findUniqueOrThrow({
    where: { id: asset.id },
    include: {
      primaryProduct: {
        select: {
          id: true,
          name: true,
        },
      },
      links: true,
      marketingCampaignLinks: true,
    },
  });

  return mapAsset(created);
}

function mapUsagePurposeToRole(usagePurpose: string) {
  if (usagePurpose === 'Gallery') {
    return 'GALLERY_IMAGE';
  }
  if (usagePurpose === 'Campaign') {
    return 'CAMPAIGN';
  }
  if (usagePurpose === 'Social') {
    return 'GENERATED_IMAGE';
  }
  return 'CAMPAIGN';
}

export async function createMarketingAssetVariant(assetId: string, input: CreateMarketingVariantInput) {
  const parent = await prisma.productAsset.findUniqueOrThrow({
    where: { id: assetId },
    include: {
      primaryProduct: true,
      links: true,
      marketingCampaignLinks: true,
    },
  });
  const parentStorage = parent as typeof parent & AssetStorageRecord;

  const nextProtection = input.usagePurpose === 'Publishable Variant' ? 'PUBLISHABLE_VARIANT' : 'MANAGED_VARIANT';
  const nextApproval = input.usagePurpose === 'Publishable Variant' ? 'APPROVED' : 'REVIEW';

  const variant = await prisma.$transaction(async (tx) => {
    const created = await tx.productAsset.create({
      data: {
        assetKey: createKey('AST'),
        primaryProductId: parent.primaryProductId,
        name: `${parent.name} ${input.channelSize} Variant`,
        assetType: parent.assetType,
        assetSource: 'MARKETING_TOOL',
        protectionLevel: nextProtection,
        approvalStatus: nextApproval,
        sizeLabel: input.channelSize,
        imageUrl: parent.imageUrl,
        originalFileName: parentStorage.originalFileName ?? null,
        storedFileName: parentStorage.storedFileName ?? null,
        storagePath: parentStorage.storagePath ?? null,
        mimeType: parentStorage.mimeType ?? null,
        fileSizeBytes: parentStorage.fileSizeBytes ?? null,
        sha256: parentStorage.sha256 ?? null,
        usageRoles: [mapUsagePurposeToRole(input.usagePurpose)],
        parentAssetId: parent.id,
        completeness: parent.completeness ?? 100,
        isThreeDReady: parent.isThreeDReady,
        workflowNode: 'variant.generated',
        pipeline: parent.pipeline ?? undefined,
        tags: Array.from(new Set([...parent.tags, input.usagePurpose, input.channelSize])),
        watermarkProfile: input.watermarkProfile === 'None' ? null : input.watermarkProfile,
        backgroundTransparent: input.transparentBg,
      } as Prisma.ProductAssetUncheckedCreateInput,
    });

    if (parent.primaryProductId) {
      await tx.assetLink.create({
        data: {
          assetId: created.id,
          linkType: 'PRODUCT',
          productId: parent.primaryProductId,
        },
      });
    }

    for (const campaignLink of parent.marketingCampaignLinks) {
      const campaign = await tx.marketingCampaign.findUnique({
        where: { id: campaignLink.campaignId },
        select: { campaignKey: true },
      });

      await tx.marketingCampaignAsset.create({
        data: {
          campaignId: campaignLink.campaignId,
          assetId: created.id,
        },
      });

      await tx.assetLink.create({
        data: {
          assetId: created.id,
          linkType: 'CAMPAIGN',
          campaignKey: campaign?.campaignKey ?? null,
        },
      });
    }

    return created;
  });

  emitMarketingEvent({ type: 'asset.variant_created', entityId: variant.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  const created = await prisma.productAsset.findUniqueOrThrow({
    where: { id: variant.id },
    include: {
      primaryProduct: {
        select: {
          id: true,
          name: true,
        },
      },
      links: true,
      marketingCampaignLinks: true,
    },
  });

  return mapAsset(created);
}

export async function updateMarketingAsset(assetId: string, input: UpdateMarketingAssetInput) {
  const nextName = input.name?.trim();
  const nextTags = input.tags ? normalizeAssetTags(input.tags) : undefined;

  if (input.name !== undefined && !nextName) {
    throw new Error('Asset name cannot be empty.');
  }

  const updated = await prisma.productAsset.update({
    where: { id: assetId },
    data: {
      ...(nextName ? { name: nextName } : {}),
      ...(input.tags !== undefined ? { tags: nextTags ?? [] } : {}),
      workflowNode: 'asset.metadata_updated',
    },
  });

  emitMarketingEvent({ type: 'asset.updated', entityId: updated.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  return mapAsset(await loadAssetById(updated.id));
}

export async function duplicateMarketingAsset(assetId: string) {
  const source = await prisma.productAsset.findUniqueOrThrow({
    where: { id: assetId },
    include: {
      primaryProduct: true,
      links: true,
      marketingCampaignLinks: true,
    },
  });
  const sourceStorage = source as typeof source & AssetStorageRecord;

  const duplicate = await prisma.$transaction(async (tx) => {
    const created = await tx.productAsset.create({
      data: {
        assetKey: createKey('AST'),
        primaryProductId: source.primaryProductId,
        name: `${source.name} Copy`,
        assetType: source.assetType,
        assetSource: source.assetSource,
        protectionLevel: source.protectionLevel,
        approvalStatus: source.approvalStatus,
        sizeLabel: source.sizeLabel,
        imageUrl: source.imageUrl,
        originalFileName: sourceStorage.originalFileName ?? null,
        storedFileName: sourceStorage.storedFileName ?? null,
        storagePath: sourceStorage.storagePath ?? null,
        mimeType: sourceStorage.mimeType ?? null,
        fileSizeBytes: sourceStorage.fileSizeBytes ?? null,
        sha256: sourceStorage.sha256 ?? null,
        usageRoles: source.usageRoles,
        parentAssetId: source.parentAssetId ?? source.id,
        completeness: source.completeness,
        isThreeDReady: source.isThreeDReady,
        watermarkProfile: source.watermarkProfile ?? null,
        backgroundTransparent: source.backgroundTransparent ?? null,
        workflowNode: 'asset.duplicated',
        pipeline: source.pipeline ?? undefined,
        tags: normalizeAssetTags([...source.tags, 'Copy']),
      } as Prisma.ProductAssetUncheckedCreateInput,
    });

    const linkedProductIds = Array.from(
      new Set(source.links.filter((link) => link.linkType === 'PRODUCT' && link.productId).map((link) => link.productId as string)),
    );

    if (linkedProductIds.length) {
      await tx.assetLink.createMany({
        data: linkedProductIds.map((productId) => ({
          assetId: created.id,
          linkType: 'PRODUCT',
          productId,
        })),
        skipDuplicates: true,
      });
    }

    for (const campaignLink of source.marketingCampaignLinks) {
      const campaign = await tx.marketingCampaign.findUnique({
        where: { id: campaignLink.campaignId },
        select: { campaignKey: true },
      });

      await tx.marketingCampaignAsset.create({
        data: {
          campaignId: campaignLink.campaignId,
          assetId: created.id,
        },
      });

      await tx.assetLink.create({
        data: {
          assetId: created.id,
          linkType: 'CAMPAIGN',
          campaignKey: campaign?.campaignKey ?? null,
        },
      });
    }

    return created;
  });

  emitMarketingEvent({ type: 'asset.duplicated', entityId: duplicate.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  return mapAsset(await loadAssetById(duplicate.id));
}

export async function archiveMarketingAsset(assetId: string) {
  const archived = await prisma.productAsset.update({
    where: { id: assetId },
    data: {
      approvalStatus: 'ARCHIVED',
      workflowNode: 'asset.archived',
    },
  });

  emitMarketingEvent({ type: 'asset.archived', entityId: archived.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  return mapAsset(await loadAssetById(archived.id));
}

export async function createMarketingRender(input: CreateMarketingRenderInput) {
  const [template, product] = await Promise.all([
    prisma.marketingTemplate.findUniqueOrThrow({ where: { id: input.templateId } }),
    prisma.product.findUniqueOrThrow({ where: { id: input.productId } }),
  ]);
  const mappedTemplate = mapTemplate(template);

  const imageUrl = product.heroImageUrl || product.primaryImageUrl || product.galleryImageUrl || product.faceImageUrl;
  if (!imageUrl) {
    throw new Error('Selected product is missing source media for rendering.');
  }

  const asset = await prisma.productAsset.create({
    data: {
      assetKey: createKey('AST'),
      primaryProductId: product.id,
      name: `${template.name} - ${product.name}`,
      assetType: 'IMAGE',
      assetSource: 'STUDIO_PUBLISHED',
      protectionLevel: input.usagePurpose === 'Publishable Variant' ? 'PUBLISHABLE_VARIANT' : 'MANAGED_VARIANT',
      approvalStatus: 'APPROVED',
      sizeLabel:
        input.channelSize === 'Original'
          ? `${mappedTemplate.blueprintConfig.canvas.width}x${mappedTemplate.blueprintConfig.canvas.height}`
          : input.channelSize,
      imageUrl,
      originalFileName: product.name,
      mimeType: 'image/jpeg',
      usageRoles: [mapUsagePurposeToRole(input.usagePurpose)],
      completeness: 100,
      isThreeDReady: false,
      workflowNode: 'creative.rendered',
      tags: Array.from(new Set([product.category, template.name, mappedTemplate.destination, ...mappedTemplate.tags, 'Rendered'])),
      watermarkProfile: input.watermarkProfile === 'None' ? null : input.watermarkProfile,
      backgroundTransparent: input.transparentBg,
    } as Prisma.ProductAssetUncheckedCreateInput,
  });

  await prisma.assetLink.create({
    data: {
      assetId: asset.id,
      linkType: 'PRODUCT',
      productId: product.id,
    },
  });

  emitMarketingEvent({ type: 'asset.created', entityId: asset.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  const created = await prisma.productAsset.findUniqueOrThrow({
    where: { id: asset.id },
    include: {
      primaryProduct: {
        select: {
          id: true,
          name: true,
        },
      },
      links: true,
      marketingCampaignLinks: true,
    },
  });

  return mapAsset(created);
}

export async function createMarketingCreativeOutput(input: CreateMarketingCreativeOutputInput) {
  const assetType = mapMarketingAssetTypeToDb(input.type);
  const normalizedName = deriveAssetNameFromFilename(input.name.trim());
  const usageRoles = Array.from(
    new Set([
      ...inferUploadUsageRoles(normalizedName, assetType),
      mapUsagePurposeToRole(input.usagePurpose),
    ]),
  );

  const [linkedProduct, linkedTemplate] = await Promise.all([
    input.productId
      ? prisma.product.findUnique({
          where: { id: input.productId },
          select: { id: true, name: true, category: true },
        })
      : Promise.resolve(null),
    input.templateId
      ? prisma.marketingTemplate.findUnique({
          where: { id: input.templateId },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  const derivedTags = normalizeAssetTags([
    ...(input.tags ?? []),
    linkedTemplate?.name ?? '',
    linkedProduct?.name ?? '',
    input.usagePurpose,
    assetTypeLabels[assetType],
  ]);

  const createdAsset = await prisma.$transaction(async (tx) => {
    const asset = await tx.productAsset.create({
      data: {
        assetKey: createKey('AST'),
        primaryProductId: linkedProduct?.id ?? null,
        name: normalizedName,
        assetType,
        assetSource: 'MARKETING_TOOL',
        protectionLevel: mapMarketingAssetProtectionToDb(input.protectionLevel),
        approvalStatus: mapMarketingAssetStatusToDb(input.status),
        sizeLabel: input.size,
        imageUrl: input.imageUrl,
        originalFileName: input.originalFilename ?? normalizedName,
        storedFileName: input.storedFilename ?? null,
        storagePath: input.storagePath ?? null,
        mimeType: input.mimeType ?? null,
        fileSizeBytes: input.fileSizeBytes ?? null,
        sha256: input.sha256 ?? null,
        usageRoles,
        parentAssetId: input.sourceAssetIds?.[0] ?? null,
        completeness: input.backgroundTransparent ? 96 : 100,
        isThreeDReady: false,
        workflowNode: input.workflowNode ?? 'creative.generated',
        tags: derivedTags,
        watermarkProfile: input.watermarkProfile ?? null,
        backgroundTransparent: input.backgroundTransparent ?? null,
      } as Prisma.ProductAssetUncheckedCreateInput,
    });

    if (linkedProduct?.id) {
      await tx.assetLink.create({
        data: {
          assetId: asset.id,
          linkType: 'PRODUCT',
          productId: linkedProduct.id,
        },
      });
    }

    if (input.campaignId) {
      const campaign = await tx.marketingCampaign.findUnique({
        where: { id: input.campaignId },
        select: { campaignKey: true },
      });

      if (campaign) {
        await tx.marketingCampaignAsset.create({
          data: {
            campaignId: input.campaignId,
            assetId: asset.id,
          },
        });

        await tx.assetLink.create({
          data: {
            assetId: asset.id,
            linkType: 'CAMPAIGN',
            campaignKey: campaign.campaignKey,
          },
        });
      }
    }

    return asset;
  });

  emitMarketingEvent({ type: 'asset.created', entityId: createdAsset.id });
  emitMarketingEvent({ type: 'dashboard.updated' });

  return mapAsset(await loadAssetById(createdAsset.id));
}

async function loadPublishingJobForBridge(jobId: string) {
  return prisma.marketingPublishingJob.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      campaign: true,
      calendarEntry: true,
      asset: true,
    },
  });
}

function inferPublishingMediaType(job: Awaited<ReturnType<typeof loadPublishingJobForBridge>>) {
  const mimeType = job.asset?.mimeType?.toLowerCase() ?? '';
  if (mimeType.startsWith('image/')) {
    return 'IMAGE' as const;
  }
  if (mimeType.startsWith('video/')) {
    return 'VIDEO' as const;
  }
  return 'UNKNOWN' as const;
}

function buildPublishingBridgeContext(job: Awaited<ReturnType<typeof loadPublishingJobForBridge>>) {
  const title = job.calendarEntry?.title?.trim() || job.creativeName;
  const description = job.calendarEntry?.description?.trim() || job.campaign?.description?.trim() || '';
  const caption = [title, description].filter((value) => value.length > 0).join('\n\n');

  return {
    jobId: job.id,
    channel: job.channel,
    creativeName: job.creativeName,
    title,
    caption,
    scheduledFor: job.calendarEntry?.scheduledFor ?? null,
    mediaUrl: job.asset?.imageUrl ?? null,
    mediaType: inferPublishingMediaType(job),
    existingExternalPostId: job.externalPostId ?? null,
    existingExternalPostUrl: job.externalPostUrl ?? null,
  };
}

async function applyPublishingBridgeResult(
  job: Awaited<ReturnType<typeof loadPublishingJobForBridge>>,
  result: Awaited<ReturnType<ReturnType<typeof resolveMarketingPlatformBridge>['publish']>>,
) {
  const updatedJob = await prisma.marketingPublishingJob.update({
    where: { id: job.id },
    data: {
      status: result.status,
      progress: result.progress ?? (result.status === 'PUBLISHED' ? 100 : result.status === 'FAILED' ? 0 : 55),
      errorMessage: result.errorMessage ?? (result.status === 'FAILED' ? 'Publishing bridge failed.' : null),
      syncError: result.syncError ?? null,
      externalProvider: result.provider,
      externalPostId: result.externalPostId ?? job.externalPostId ?? null,
      externalPostUrl: result.externalPostUrl ?? job.externalPostUrl ?? null,
      externalStatus: result.externalStatus ?? null,
      externalMetrics: result.metrics ? (result.metrics as unknown as Prisma.InputJsonValue) : undefined,
      publishedAt: result.publishedAt ?? (result.status === 'PUBLISHED' ? new Date() : undefined),
      lastSyncedAt: result.lastSyncedAt ?? new Date(),
      workflowNode:
        result.status === 'PUBLISHED'
          ? 'publish.succeeded'
          : result.status === 'FAILED'
            ? 'publish.failed'
            : 'publish.queued',
    },
  });

  if (updatedJob.status === 'PUBLISHED' && job.calendarEntryId) {
    await prisma.marketingCalendarEntry.update({
      where: { id: job.calendarEntryId },
      data: {
        status: 'PUBLISHED',
      },
    });
  }

  return updatedJob;
}

async function advancePublishingJobExternally(jobId: string) {
  const job = await loadPublishingJobForBridge(jobId);
  const bridge = resolveMarketingPlatformBridge(job.channel);
  const context = buildPublishingBridgeContext(job);

  try {
    const result =
      job.status === 'QUEUED' || !job.externalPostId ? await bridge.publish(context) : await bridge.sync(context);
    return await applyPublishingBridgeResult(job, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'External publishing bridge failed.';
    const nextStatus = job.status === 'QUEUED' ? 'FAILED' : 'RETRYING';
    return prisma.marketingPublishingJob.update({
      where: { id: job.id },
      data: {
        status: nextStatus,
        progress: nextStatus === 'FAILED' ? 0 : Math.max(job.progress ?? 35, 45),
        errorMessage: nextStatus === 'FAILED' ? message : job.errorMessage,
        syncError: message,
        lastSyncedAt: new Date(),
        workflowNode: nextStatus === 'FAILED' ? 'publish.failed' : job.workflowNode ?? 'publish.queued',
      },
    });
  }
}

export async function refreshMarketingPublishing() {
  const jobToAdvance =
    (await prisma.marketingPublishingJob.findFirst({
      where: {
        status: { in: ['PUBLISHING', 'RETRYING'] },
      },
      orderBy: { queuedAt: 'asc' },
    })) ??
    (await prisma.marketingPublishingJob.findFirst({
      where: { status: 'QUEUED' },
      orderBy: { queuedAt: 'asc' },
    })) ??
    (await prisma.marketingPublishingJob.findFirst({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: [{ lastSyncedAt: 'asc' }, { queuedAt: 'asc' }],
    }));

  if (jobToAdvance) {
    await advancePublishingJobExternally(jobToAdvance.id);
  }

  await syncMarketingCommunityPostsFromPublishingJobs();
  await ensureChannelHealthSnapshots();

  emitMarketingEvent({ type: 'publishing.updated', entityId: jobToAdvance?.id });
  emitMarketingEvent({ type: 'dashboard.updated' });
  emitMarketingEvent({ type: 'analytics.updated' });
  emitMarketingEvent({ type: 'community.updated' });

  return getMarketingStudioSnapshot();
}

export async function likeMarketingCommunityPost(postId: string, input: CreateMarketingCommunityLikeInput) {
  const actorKey = input.actor.key.trim();
  if (!actorKey) {
    throw new Error('Like actor key is required.');
  }

  const actor: MarketingCommunityLikeActor = {
    key: actorKey,
    name: input.actor.name.trim() || 'BTS Team',
    role: input.actor.role.trim() || 'Marketing Ops',
  };

  const existingPost = await prisma.marketingCommunityPost.findUniqueOrThrow({
    where: { id: postId },
  });
  const existingActors = parseJsonArray<MarketingCommunityLikeActor>(existingPost.internalLikeActors);
  const baselineLikeCount = Math.max(existingPost.internalLikes, existingActors.length);
  const hasLiked = existingActors.some((entry) => entry.key === actor.key);
  const nextActors = hasLiked
    ? existingActors.filter((entry) => entry.key !== actor.key)
    : [...existingActors, actor];
  const nextLikeCount = hasLiked ? Math.max(0, baselineLikeCount - 1) : baselineLikeCount + 1;

  const updatedPost = await prisma.marketingCommunityPost.update({
    where: { id: postId },
    data: {
      internalLikes: nextLikeCount,
      internalLikeActors: nextActors as unknown as Prisma.InputJsonValue,
    },
  });

  emitMarketingEvent({ type: 'community.updated', entityId: updatedPost.id });
  return getMarketingStudioSnapshot();
}

export async function addMarketingCommunityPostComment(postId: string, input: CreateMarketingCommunityCommentInput) {
  const trimmedContent = input.content.trim();
  if (!trimmedContent) {
    throw new Error('Comment content is required.');
  }

  const existingPost = await prisma.marketingCommunityPost.findUniqueOrThrow({
    where: { id: postId },
  });
  const currentComments = parseJsonArray<MarketingCommunityComment>(existingPost.internalComments);
  const nextComment: MarketingCommunityComment = {
    id: createKey('COM'),
    user: {
      name: input.user?.name?.trim() || 'BTS Team',
      avatar: input.user?.avatar?.trim() || 'https://i.pravatar.cc/150?u=bts-team',
      role: input.user?.role?.trim() || 'Marketing Ops',
    },
    content: trimmedContent,
    timestamp: 'Just now',
    likes: 0,
  };

  const updatedPost = await prisma.marketingCommunityPost.update({
    where: { id: postId },
    data: {
      internalComments: [...currentComments, nextComment] as unknown as Prisma.InputJsonValue,
    },
  });

  emitMarketingEvent({ type: 'community.updated', entityId: updatedPost.id });
  return getMarketingStudioSnapshot();
}
