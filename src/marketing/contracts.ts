export type MarketingAssetStatus = 'Draft' | 'Review' | 'Approved' | 'Archived' | 'Restricted';
export type MarketingAssetType = 'Image' | 'Video' | '2.5D Asset' | '3D Asset' | '3D Render' | 'Model';
export type MarketingAssetProtectionLevel = 'Protected Original' | 'Managed Variant' | 'Publishable Variant';
export type MarketingTemplateType = 'Product Card' | 'Collection Highlight' | 'Quote CTA';
export type MarketingTemplateStatus = 'Draft' | 'Active' | 'Archived';
export type MarketingTemplateDestination =
  | 'Public Site Hero'
  | 'Public Product Section'
  | 'Instagram Post'
  | 'Story / Reel Cover'
  | 'Facebook Banner'
  | 'LinkedIn Promo'
  | 'WhatsApp Share Card'
  | 'Seasonal Special'
  | 'Holiday Promotion'
  | 'Campaign Landing Visual';
export type MarketingCampaignStatus = 'Active' | 'Draft' | 'Completed' | 'Scheduled';
export type MarketingCalendarStatus = 'Scheduled' | 'Published' | 'Failed' | 'Draft';
export type MarketingCalendarEntryType = 'Post' | 'Note' | 'Reminder';
export type MarketingPublishingStatus = 'Queued' | 'Publishing' | 'Published' | 'Failed' | 'Retrying';
export type MarketingChannelHealthStatus = 'Healthy' | 'Degraded' | 'Down';
export type MarketingMediaType = 'image' | 'video';
export type MarketingAnalyticsSourceModule = 'Analytics' | 'Campaigns' | 'Publishing' | 'AssetLab' | 'CommunityFeed' | 'Calendar';
export type MarketingChannel =
  | 'Instagram'
  | 'Facebook'
  | 'TikTok'
  | 'LinkedIn'
  | 'Email'
  | 'WhatsApp'
  | 'Pinterest';
export type PublicMarketingBlueprintTarget = 'home.hero' | 'products.journey';
export type MarketingContentSurface = 'Knowledge & Insights' | 'Design & Build';
export type MarketingContentType = 'guide' | 'trend' | 'news' | 'tips' | 'blog' | 'editorial' | 'concept' | 'built';
export type MarketingContentStatus = 'Draft' | 'Published' | 'Archived';

export type MarketingBlueprintSlotKind = 'image' | 'supporting-image' | 'title' | 'copy' | 'price' | 'cta' | 'logo' | 'badge' | 'collection' | 'spec-strip';
export type MarketingBlueprintXAlign = 'left' | 'center' | 'right';
export type MarketingBlueprintYAlign = 'top' | 'center' | 'bottom';
export type MarketingBlueprintTypographyPreset = 'Serif Display' | 'Editorial Contrast' | 'Campaign Sans';
export type MarketingBlueprintOverlayMode = 'Gradient Lift' | 'Glass Panel' | 'Solid Wash' | 'None';
export type MarketingBlueprintColorTreatment = 'Brand Dark' | 'Seasonal Warm' | 'Stone Neutral' | 'Emerald Promo';
export type MarketingBlueprintBadgeStyle = 'Price Pill' | 'Corner Flag' | 'Inline Chip' | 'None';
export type MarketingBlueprintBackgroundTreatment = 'Source Image' | 'Texture Wash' | 'Soft Vignette' | 'Blurred Backplate';

export interface MarketingBlueprintCanvas {
  width: number;
  height: number;
  aspectRatio: string;
  safeZone: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface MarketingBlueprintSlot {
  id: string;
  kind: MarketingBlueprintSlotKind;
  label: string;
  enabled: boolean;
  xAlign: MarketingBlueprintXAlign;
  yAlign: MarketingBlueprintYAlign;
  widthPct: number;
  heightPct: number;
  maxLines?: number;
}

export interface MarketingBlueprintStyle {
  typographyPreset: MarketingBlueprintTypographyPreset;
  overlayMode: MarketingBlueprintOverlayMode;
  colorTreatment: MarketingBlueprintColorTreatment;
  badgeStyle: MarketingBlueprintBadgeStyle;
  backgroundTreatment: MarketingBlueprintBackgroundTreatment;
}

export interface MarketingBlueprintBehavior {
  showPrice: boolean;
  showCta: boolean;
  showCollectionLabel: boolean;
  showSpecStrip: boolean;
  requiredProductFields: string[];
  requiredAssetRoles: string[];
}

export interface MarketingBlueprintConfig {
  canvas: MarketingBlueprintCanvas;
  slots: MarketingBlueprintSlot[];
  style: MarketingBlueprintStyle;
  behavior: MarketingBlueprintBehavior;
}

export const marketingTemplateDestinationOptions: MarketingTemplateDestination[] = [
  'Public Site Hero',
  'Public Product Section',
  'Instagram Post',
  'Story / Reel Cover',
  'Facebook Banner',
  'LinkedIn Promo',
  'WhatsApp Share Card',
  'Seasonal Special',
  'Holiday Promotion',
  'Campaign Landing Visual',
];

export function createDefaultBlueprintConfig(
  type: MarketingTemplateType = 'Product Card',
  destination: MarketingTemplateDestination = 'Instagram Post',
): MarketingBlueprintConfig {
  if (type === 'Collection Highlight') {
    return {
      canvas: {
        width: destination === 'Facebook Banner' ? 1200 : 1080,
        height: destination === 'Facebook Banner' ? 630 : 1080,
        aspectRatio: destination === 'Facebook Banner' ? '1200:630' : '1:1',
        safeZone: { top: 8, right: 8, bottom: 10, left: 8 },
      },
      slots: [
        { id: 'hero-image', kind: 'image', label: 'Hero Image', enabled: true, xAlign: 'center', yAlign: 'center', widthPct: 100, heightPct: 100 },
        { id: 'collection', kind: 'collection', label: 'Collection Label', enabled: true, xAlign: 'center', yAlign: 'top', widthPct: 70, heightPct: 12, maxLines: 1 },
        { id: 'title', kind: 'title', label: 'Title', enabled: true, xAlign: 'center', yAlign: 'center', widthPct: 78, heightPct: 18, maxLines: 2 },
        { id: 'copy', kind: 'copy', label: 'Copy', enabled: true, xAlign: 'center', yAlign: 'bottom', widthPct: 74, heightPct: 12, maxLines: 3 },
      ],
      style: {
        typographyPreset: 'Editorial Contrast',
        overlayMode: 'Glass Panel',
        colorTreatment: 'Stone Neutral',
        badgeStyle: 'Inline Chip',
        backgroundTreatment: 'Blurred Backplate',
      },
      behavior: {
        showPrice: false,
        showCta: false,
        showCollectionLabel: true,
        showSpecStrip: false,
        requiredProductFields: ['name', 'category'],
        requiredAssetRoles: ['hero_image'],
      },
    };
  }

  if (type === 'Quote CTA') {
    return {
      canvas: {
        width: destination === 'Story / Reel Cover' ? 1080 : 1080,
        height: destination === 'Story / Reel Cover' ? 1920 : 1080,
        aspectRatio: destination === 'Story / Reel Cover' ? '9:16' : '1:1',
        safeZone: { top: 10, right: 10, bottom: 12, left: 10 },
      },
      slots: [
        { id: 'hero-image', kind: 'image', label: 'Hero Image', enabled: true, xAlign: 'center', yAlign: 'center', widthPct: 100, heightPct: 100 },
        { id: 'title', kind: 'title', label: 'Quote Copy', enabled: true, xAlign: 'center', yAlign: 'center', widthPct: 72, heightPct: 22, maxLines: 4 },
        { id: 'copy', kind: 'copy', label: 'Support Copy', enabled: true, xAlign: 'center', yAlign: 'bottom', widthPct: 60, heightPct: 10, maxLines: 2 },
        { id: 'cta', kind: 'cta', label: 'CTA', enabled: true, xAlign: 'center', yAlign: 'bottom', widthPct: 34, heightPct: 8, maxLines: 1 },
        { id: 'logo', kind: 'logo', label: 'Brand Stamp', enabled: true, xAlign: 'center', yAlign: 'bottom', widthPct: 20, heightPct: 6, maxLines: 1 },
      ],
      style: {
        typographyPreset: 'Serif Display',
        overlayMode: 'Solid Wash',
        colorTreatment: 'Brand Dark',
        badgeStyle: 'None',
        backgroundTreatment: 'Soft Vignette',
      },
      behavior: {
        showPrice: false,
        showCta: true,
        showCollectionLabel: false,
        showSpecStrip: false,
        requiredProductFields: ['name'],
        requiredAssetRoles: ['primary_image'],
      },
    };
  }

  return {
    canvas: {
      width: destination === 'Public Site Hero' || destination === 'Facebook Banner' ? 1200 : 1080,
      height: destination === 'Public Site Hero' || destination === 'Facebook Banner' ? 630 : 1080,
      aspectRatio: destination === 'Public Site Hero' || destination === 'Facebook Banner' ? '1200:630' : '1:1',
      safeZone: { top: 8, right: 8, bottom: 10, left: 8 },
    },
    slots: [
      { id: 'hero-image', kind: 'image', label: 'Hero Image', enabled: true, xAlign: 'center', yAlign: 'center', widthPct: 100, heightPct: 100 },
      { id: 'title', kind: 'title', label: 'Title', enabled: true, xAlign: 'left', yAlign: 'bottom', widthPct: 56, heightPct: 16, maxLines: 2 },
      { id: 'copy', kind: 'copy', label: 'Copy', enabled: true, xAlign: 'left', yAlign: 'bottom', widthPct: 48, heightPct: 12, maxLines: 3 },
      { id: 'price', kind: 'price', label: 'Price Badge', enabled: true, xAlign: 'right', yAlign: 'bottom', widthPct: 20, heightPct: 10, maxLines: 1 },
      { id: 'cta', kind: 'cta', label: 'Primary CTA', enabled: true, xAlign: 'left', yAlign: 'bottom', widthPct: 24, heightPct: 8, maxLines: 1 },
    ],
    style: {
      typographyPreset: 'Serif Display',
      overlayMode: 'Gradient Lift',
      colorTreatment: destination === 'Seasonal Special' || destination === 'Holiday Promotion' ? 'Seasonal Warm' : 'Brand Dark',
      badgeStyle: 'Price Pill',
      backgroundTreatment: 'Source Image',
    },
    behavior: {
      showPrice: true,
      showCta: true,
      showCollectionLabel: false,
      showSpecStrip: false,
      requiredProductFields: ['name', 'price'],
      requiredAssetRoles: ['primary_image'],
    },
  };
}

export function summarizeBlueprintConfig(config: MarketingBlueprintConfig, destination: MarketingTemplateDestination) {
  const enabledSlotCount = config.slots.filter((slot) => slot.enabled).length;
  return `${config.canvas.aspectRatio} | ${destination} | ${enabledSlotCount} slots | ${config.style.overlayMode}`;
}

export interface MarketingDashboardKpi {
  label: string;
  value: string;
  trend: string;
  route:
    | 'Dashboard'
    | 'AssetLab'
    | 'Templates'
    | 'CreativeGenerator'
    | 'Campaigns'
    | 'Calendar'
    | 'Publishing'
    | 'Analytics'
    | 'CommunityFeed'
    | 'ContentStudio';
}

export interface MarketingLiveCampaign {
  id: string;
  name: string;
  status: MarketingCampaignStatus;
  progress: number;
}

export interface MarketingAssetLabStat {
  label: string;
  value: string;
  route: 'AssetLab' | 'CreativeGenerator' | 'Publishing';
}

export interface MarketingDashboardSnapshot {
  kpis: MarketingDashboardKpi[];
  liveCampaigns: MarketingLiveCampaign[];
  assetLabStats: MarketingAssetLabStat[];
  totalAssets: number;
  renderedVariants: number;
  publishableVariants: number;
  generatedAt: string;
}

export interface MarketingAssetSummary {
  id: string;
  name: string;
  type: MarketingAssetType;
  protectionLevel: MarketingAssetProtectionLevel;
  size: string;
  status: MarketingAssetStatus;
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

export interface MarketingTemplateSummary {
  id: string;
  name: string;
  description: string;
  type: MarketingTemplateType;
  thumbnail: string;
  blueprint: string;
  status: MarketingTemplateStatus;
  destination: MarketingTemplateDestination;
  tags: string[];
  publicSurfaceEligible: boolean;
  allowedTargets: string[];
  blueprintConfig: MarketingBlueprintConfig;
}

export interface MarketingCampaignSummary {
  id: string;
  name: string;
  owner: string;
  description: string;
  status: MarketingCampaignStatus;
  startDate: string;
  endDate: string;
  channels: MarketingChannel[];
  linkedAssetIds: string[];
  productIds: string[];
  budget: string;
  workflowNode?: string;
}

export interface MarketingCalendarEntry {
  id: string;
  entryType: MarketingCalendarEntryType;
  title: string;
  description?: string;
  channel?: MarketingChannel;
  time: string;
  date: string;
  status: MarketingCalendarStatus;
  assetId?: string;
  campaignId?: string;
  workflowNode?: 'post.scheduled' | 'note.scheduled' | 'reminder.scheduled';
}

export interface MarketingPublishingJob {
  id: string;
  creativeName: string;
  channel: MarketingChannel;
  status: MarketingPublishingStatus;
  timestamp: string;
  progress?: number;
  error?: string;
  syncError?: string;
  assetId?: string;
  campaignId?: string;
  postId?: string;
  externalProvider?: string;
  externalPostId?: string;
  externalPostUrl?: string;
  externalStatus?: string;
  lastSyncedAt?: string;
  publishedAt?: string;
  metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    clicks?: number;
    saves?: number;
    opens?: number;
    reach?: number;
    impressions?: number;
  };
  workflowNode?: 'publish.queued' | 'publish.succeeded' | 'publish.failed';
}

export interface MarketingChannelHealthSnapshot {
  name: MarketingChannel;
  status: MarketingChannelHealthStatus;
  latency: string;
  uptime: string;
}

export interface MarketingCampaignPerformance {
  id: string;
  name: string;
  leads: number;
  quotes: number;
  conversion: string;
  spend: string;
  roas: string;
  publishedCount: number;
  workflowNode?: 'analytics.updated';
}

export interface MarketingAnalyticsSnapshot {
  kpis: Array<{
    label: string;
    value: string;
    trend: string;
    kind: 'leads' | 'quotes' | 'cac' | 'roas';
    sourceModule?: MarketingAnalyticsSourceModule;
    campaignId?: string;
    channel?: MarketingChannel;
  }>;
  trend: Array<{
    label: string;
    leads: number;
    quotes: number;
    sourceModule?: MarketingAnalyticsSourceModule;
    campaignId?: string;
  }>;
  channelAttribution: Array<{
    name: string;
    value: number;
    color: 'blue' | 'red' | 'green' | 'purple';
    sourceModule?: MarketingAnalyticsSourceModule;
    channel?: MarketingChannel;
    campaignId?: string;
  }>;
  topAsset: {
    id?: string;
    name: string;
    imageUrl: string;
    quotesGenerated: number;
    campaignId?: string;
    sourceModule?: MarketingAnalyticsSourceModule;
  } | null;
  performance: MarketingCampaignPerformance[];
}

export interface MarketingCommunityComment {
  id: string;
  user: {
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies?: MarketingCommunityComment[];
}

export interface MarketingCommunityLikeActor {
  key: string;
  name: string;
  role: string;
}

export interface MarketingCommunityChannelStats {
  channel: MarketingChannel;
  status: 'Published' | 'Scheduled' | 'Draft' | 'Failed';
  publishedAt?: string;
  publishedAtIso?: string;
  assetId?: string;
  calendarEntryId?: string;
  publishingJobId?: string;
  externalProvider?: string;
  externalPostId?: string;
  externalPostUrl?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  saves?: number;
  opens?: number;
  reach?: number;
  impressions?: number;
}

export interface MarketingCommunityPostSummary {
  id: string;
  campaignId: string;
  campaignName: string;
  assetId?: string;
  calendarEntryIds: string[];
  publishingJobIds: string[];
  creator: {
    name: string;
    avatar: string;
  };
  mediaUrl: string;
  mediaType: MarketingMediaType;
  caption: string;
  createdAt: string;
  channels: MarketingCommunityChannelStats[];
  internalComments: MarketingCommunityComment[];
  internalLikes: number;
  internalLikeActors: MarketingCommunityLikeActor[];
  workflowNode?: 'community.synced' | 'publish.succeeded' | 'publish.queued';
}

export interface MarketingContentPostSummary {
  id: string;
  targetSurface: MarketingContentSurface;
  type: MarketingContentType;
  status: MarketingContentStatus;
  title: string;
  excerpt: string;
  coverImage: string;
  readTime: string;
  category: string;
  author: string;
  authorRole?: string;
  featured: boolean;
  date: string;
  body: string[];
  takeaways: string[];
  tags: string[];
  relatedCategoryKeys: string[];
  relatedProductKeywords: string[];
  sourceAssetId?: string;
  campaignId?: string;
  topic?: string;
  aiDirection?: string;
  createdAt: string;
  publishedAt?: string;
  workflowNode?: 'content.generated' | 'content.published';
}

export interface CreateMarketingContentPostInput {
  targetSurface?: MarketingContentSurface;
  type?: MarketingContentType;
  status?: MarketingContentStatus;
  title?: string;
  topic?: string;
  excerpt?: string;
  body?: string[];
  takeaways?: string[];
  coverImage?: string;
  category?: string;
  author?: string;
  authorRole?: string;
  tags?: string[];
  relatedCategoryKeys?: string[];
  relatedProductKeywords?: string[];
  sourceAssetId?: string;
  campaignId?: string;
  aiDirection?: string;
}

export interface CreateMarketingCommunityLikeInput {
  actor: MarketingCommunityLikeActor;
}

export interface CreateMarketingCommunityCommentInput {
  content: string;
  user?: {
    name?: string;
    avatar?: string;
    role?: string;
  };
}

export interface MarketingStudioSnapshot {
  dashboard: MarketingDashboardSnapshot;
  assets: MarketingAssetSummary[];
  templates: MarketingTemplateSummary[];
  campaigns: MarketingCampaignSummary[];
  calendarEntries: MarketingCalendarEntry[];
  publishingJobs: MarketingPublishingJob[];
  channelHealth: MarketingChannelHealthSnapshot[];
  analytics: MarketingAnalyticsSnapshot;
  communityPosts: MarketingCommunityPostSummary[];
  contentPosts: MarketingContentPostSummary[];
}

export interface PublicMarketingBlueprintSnapshot {
  generatedAt: string;
  surfaces: Record<PublicMarketingBlueprintTarget, MarketingTemplateSummary | null>;
}

export interface CreateMarketingTemplateInput {
  name?: string;
  description?: string;
  type?: MarketingTemplateType;
  thumbnail?: string;
  blueprint?: string;
  status?: MarketingTemplateStatus;
  destination?: MarketingTemplateDestination;
  tags?: string[];
  publicSurfaceEligible?: boolean;
  allowedTargets?: string[];
  blueprintConfig?: MarketingBlueprintConfig;
}

export interface UpdateMarketingTemplateInput {
  name?: string;
  description?: string;
  type?: MarketingTemplateType;
  thumbnail?: string;
  blueprint?: string;
  status?: MarketingTemplateStatus;
  destination?: MarketingTemplateDestination;
  tags?: string[];
  publicSurfaceEligible?: boolean;
  allowedTargets?: string[];
  blueprintConfig?: MarketingBlueprintConfig;
}

export interface CreateMarketingCampaignInput {
  name: string;
  owner: string;
  description: string;
  status: MarketingCampaignStatus;
  startDate: string;
  endDate: string;
  channels: MarketingChannel[];
  linkedAssetIds: string[];
  productIds: string[];
  budget: string;
}

export interface CreateMarketingAssetInput {
  name: string;
  imageUrl: string;
  size: string;
  type: MarketingAssetType;
  productId?: string;
  tags?: string[];
  originalFilename?: string;
  storedFilename?: string;
  storagePath?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  sha256?: string;
}

export interface UpdateMarketingAssetInput {
  name?: string;
  tags?: string[];
}

export interface CreateMarketingVariantInput {
  transparentBg: boolean;
  watermarkProfile: string;
  usagePurpose: string;
  channelSize: string;
}

export interface CreateMarketingRenderInput {
  templateId: string;
  productId: string;
  copy: string;
  transparentBg: boolean;
  watermarkProfile: string;
  usagePurpose: string;
  channelSize: string;
}

export interface CreateMarketingCreativeOutputInput {
  name: string;
  imageUrl: string;
  size: string;
  type: MarketingAssetType;
  productId?: string;
  campaignId?: string;
  templateId?: string;
  sourceAssetIds?: string[];
  tags?: string[];
  usagePurpose: string;
  protectionLevel: MarketingAssetProtectionLevel;
  status: MarketingAssetStatus;
  watermarkProfile?: string;
  backgroundTransparent?: boolean;
  workflowNode?: string;
  originalFilename?: string;
  storedFilename?: string;
  storagePath?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  sha256?: string;
}

export interface CreateMarketingCalendarEntryInput {
  entryType?: MarketingCalendarEntryType;
  campaignId?: string;
  assetId?: string;
  title?: string;
  description?: string;
  channel?: MarketingChannel;
  scheduledFor?: string;
}
