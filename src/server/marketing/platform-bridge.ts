type MarketingChannelKey = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'LINKEDIN' | 'EMAIL' | 'WHATSAPP' | 'PINTEREST';

export interface ExternalPlatformMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  saves?: number;
  opens?: number;
  reach?: number;
  impressions?: number;
}

export interface MarketingPublishBridgeContext {
  jobId: string;
  channel: MarketingChannelKey;
  creativeName: string;
  title: string;
  caption: string;
  scheduledFor?: Date | null;
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO' | 'UNKNOWN';
  existingExternalPostId?: string | null;
  existingExternalPostUrl?: string | null;
}

export interface MarketingPublishBridgeResult {
  provider: string;
  status: 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  progress?: number;
  externalStatus?: string;
  externalPostId?: string;
  externalPostUrl?: string;
  publishedAt?: Date;
  lastSyncedAt?: Date;
  metrics?: ExternalPlatformMetrics;
  errorMessage?: string;
  syncError?: string;
}

interface MarketingPlatformBridge {
  publish(context: MarketingPublishBridgeContext): Promise<MarketingPublishBridgeResult>;
  sync(context: MarketingPublishBridgeContext): Promise<MarketingPublishBridgeResult>;
}

function optionalBearer(token: string | undefined) {
  return token && token.trim().length > 0 ? { Authorization: `Bearer ${token.trim()}` } : {};
}

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function expectOk(response: Response) {
  if (response.ok) {
    return;
  }

  const body = await response.text();
  throw new Error(`${response.status} ${response.statusText}${body ? `: ${body.slice(0, 280)}` : ''}`);
}

function normalizeMetrics(input: unknown): ExternalPlatformMetrics | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return undefined;
  }

  const source = input as Record<string, unknown>;
  const metricKeys = ['likes', 'comments', 'shares', 'clicks', 'saves', 'opens', 'reach', 'impressions'] as const;
  const next: ExternalPlatformMetrics = {};

  for (const key of metricKeys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      next[key] = value;
      continue;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        next[key] = parsed;
      }
    }
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

class SimulatorMarketingPlatformBridge implements MarketingPlatformBridge {
  async publish(_context: MarketingPublishBridgeContext): Promise<MarketingPublishBridgeResult> {
    return {
      provider: 'INTERNAL_SIMULATOR',
      status: 'PUBLISHING',
      progress: 35,
      externalStatus: 'SIMULATED_QUEUE',
    };
  }

  async sync(context: MarketingPublishBridgeContext): Promise<MarketingPublishBridgeResult> {
    const published = Boolean(context.existingExternalPostId);
    return {
      provider: 'INTERNAL_SIMULATOR',
      status: published ? 'PUBLISHED' : 'PUBLISHING',
      progress: published ? 100 : 70,
      externalStatus: published ? 'SIMULATED_PUBLISHED' : 'SIMULATED_PROGRESS',
      externalPostId: context.existingExternalPostId ?? `sim_${context.jobId}`,
      externalPostUrl: context.existingExternalPostUrl ?? undefined,
      publishedAt: published ? new Date() : undefined,
      lastSyncedAt: new Date(),
    };
  }
}

class WebhookMarketingPlatformBridge implements MarketingPlatformBridge {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  private async invoke(
    path: 'publish' | 'sync',
    context: MarketingPublishBridgeContext,
  ): Promise<MarketingPublishBridgeResult> {
    const response = await fetch(`${this.baseUrl.replace(/\/+$/, '')}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...optionalBearer(this.apiKey),
      },
      body: JSON.stringify({
        jobId: context.jobId,
        channel: context.channel,
        creativeName: context.creativeName,
        title: context.title,
        caption: context.caption,
        scheduledFor: context.scheduledFor?.toISOString() ?? null,
        mediaUrl: context.mediaUrl ?? null,
        mediaType: context.mediaType ?? 'UNKNOWN',
        externalPostId: context.existingExternalPostId ?? null,
        externalPostUrl: context.existingExternalPostUrl ?? null,
      }),
    });
    await expectOk(response);
    const payload = (await parseJsonResponse(response)) as Record<string, unknown> | null;

    return {
      provider: 'WEBHOOK_BRIDGE',
      status:
        payload?.status === 'FAILED'
          ? 'FAILED'
          : payload?.status === 'PUBLISHED' || payload?.published === true
            ? 'PUBLISHED'
            : 'PUBLISHING',
      progress:
        typeof payload?.progress === 'number'
          ? payload.progress
          : payload?.status === 'PUBLISHED' || payload?.published === true
            ? 100
            : 55,
      externalStatus: typeof payload?.externalStatus === 'string' ? payload.externalStatus : undefined,
      externalPostId: typeof payload?.externalPostId === 'string' ? payload.externalPostId : undefined,
      externalPostUrl: typeof payload?.externalPostUrl === 'string' ? payload.externalPostUrl : undefined,
      publishedAt:
        typeof payload?.publishedAt === 'string' && payload.publishedAt.length > 0
          ? new Date(payload.publishedAt)
          : undefined,
      lastSyncedAt: new Date(),
      metrics: normalizeMetrics(payload?.metrics),
      errorMessage: typeof payload?.errorMessage === 'string' ? payload.errorMessage : undefined,
      syncError: typeof payload?.syncError === 'string' ? payload.syncError : undefined,
    };
  }

  publish(context: MarketingPublishBridgeContext) {
    return this.invoke('publish', context);
  }

  sync(context: MarketingPublishBridgeContext) {
    return this.invoke('sync', context);
  }
}

class LinkedInMarketingPlatformBridge implements MarketingPlatformBridge {
  private readonly baseUrl = 'https://api.linkedin.com/rest';

  constructor(
    private readonly accessToken: string,
    private readonly organizationUrn: string,
    private readonly version: string,
  ) {}

  private headers(contentType = 'application/json') {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Linkedin-Version': this.version,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': contentType,
    };
  }

  private async uploadImage(mediaUrl: string) {
    const initializeResponse = await fetch(`${this.baseUrl}/images?action=initializeUpload`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: this.organizationUrn,
        },
      }),
    });
    await expectOk(initializeResponse);
    const initializePayload = (await parseJsonResponse(initializeResponse)) as
      | {
          value?: {
            uploadUrl?: string;
            image?: string;
          };
        }
      | null;
    const uploadUrl = initializePayload?.value?.uploadUrl;
    const imageUrn = initializePayload?.value?.image;

    if (!uploadUrl || !imageUrn) {
      throw new Error('LinkedIn image upload initialization did not return an upload URL and image URN.');
    }

    const assetResponse = await fetch(mediaUrl);
    await expectOk(assetResponse);
    const contentType = assetResponse.headers.get('content-type') ?? 'application/octet-stream';
    const binary = await assetResponse.arrayBuffer();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: binary,
    });
    await expectOk(uploadResponse);

    return imageUrn;
  }

  async publish(context: MarketingPublishBridgeContext): Promise<MarketingPublishBridgeResult> {
    const payload: Record<string, unknown> = {
      author: this.organizationUrn,
      commentary: context.caption || context.title || context.creativeName,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    if (context.mediaUrl && context.mediaType === 'IMAGE') {
      const imageUrn = await this.uploadImage(context.mediaUrl);
      payload.content = {
        media: {
          id: imageUrn,
          altText: context.title || context.creativeName,
        },
      };
    }

    const publishResponse = await fetch(`${this.baseUrl}/posts`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    await expectOk(publishResponse);
    const externalPostId = publishResponse.headers.get('x-restli-id') ?? undefined;

    return {
      provider: 'LINKEDIN_DIRECT',
      status: 'PUBLISHED',
      progress: 100,
      externalStatus: 'PUBLISHED',
      externalPostId,
      publishedAt: new Date(),
      lastSyncedAt: new Date(),
    };
  }

  async sync(context: MarketingPublishBridgeContext): Promise<MarketingPublishBridgeResult> {
    if (!context.existingExternalPostId) {
      throw new Error('LinkedIn sync requires an external post ID.');
    }

    const encodedId = encodeURIComponent(context.existingExternalPostId);
    const summaryResponse = await fetch(`${this.baseUrl}/socialActions/${encodedId}`, {
      method: 'GET',
      headers: this.headers(),
    });
    await expectOk(summaryResponse);
    const summaryPayload = (await parseJsonResponse(summaryResponse)) as
      | {
          likesSummary?: {
            totalLikes?: number;
            aggregatedTotalLikes?: number;
          };
          commentsSummary?: {
            totalFirstLevelComments?: number;
            aggregatedTotalComments?: number;
          };
        }
      | null;

    const postResponse = await fetch(`${this.baseUrl}/posts/${encodedId}`, {
      method: 'GET',
      headers: this.headers(),
    });
    await expectOk(postResponse);
    const postPayload = (await parseJsonResponse(postResponse)) as
      | {
          publishedAt?: number;
          lifecycleState?: string;
        }
      | null;

    return {
      provider: 'LINKEDIN_DIRECT',
      status: postPayload?.lifecycleState === 'PUBLISHED' ? 'PUBLISHED' : 'PUBLISHING',
      progress: postPayload?.lifecycleState === 'PUBLISHED' ? 100 : 70,
      externalStatus: typeof postPayload?.lifecycleState === 'string' ? postPayload.lifecycleState : 'SYNCED',
      externalPostId: context.existingExternalPostId,
      externalPostUrl: context.existingExternalPostUrl ?? undefined,
      publishedAt:
        typeof postPayload?.publishedAt === 'number' && Number.isFinite(postPayload.publishedAt)
          ? new Date(postPayload.publishedAt)
          : undefined,
      lastSyncedAt: new Date(),
      metrics: {
        likes: summaryPayload?.likesSummary?.totalLikes ?? summaryPayload?.likesSummary?.aggregatedTotalLikes ?? 0,
        comments:
          summaryPayload?.commentsSummary?.aggregatedTotalComments ??
          summaryPayload?.commentsSummary?.totalFirstLevelComments ??
          0,
      },
    };
  }
}

function getWebhookBridge() {
  const baseUrl = process.env.MARKETING_PLATFORM_BRIDGE_BASE_URL?.trim();
  if (!baseUrl) {
    return null;
  }
  return new WebhookMarketingPlatformBridge(baseUrl, process.env.MARKETING_PLATFORM_BRIDGE_API_KEY?.trim());
}

function getLinkedInBridge() {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const organizationUrn = process.env.LINKEDIN_ORGANIZATION_URN?.trim();
  const version = process.env.LINKEDIN_API_VERSION?.trim() || '202506';

  if (!accessToken || !organizationUrn) {
    return null;
  }

  return new LinkedInMarketingPlatformBridge(accessToken, organizationUrn, version);
}

export function resolveMarketingPlatformBridge(channel: MarketingChannelKey): MarketingPlatformBridge {
  if (channel === 'LINKEDIN') {
    const linkedInBridge = getLinkedInBridge();
    if (linkedInBridge) {
      return linkedInBridge;
    }
  }

  const webhookBridge = getWebhookBridge();
  if (webhookBridge) {
    return webhookBridge;
  }

  return new SimulatorMarketingPlatformBridge();
}

export function hasLiveMarketingPlatformBridge(channel: MarketingChannelKey) {
  if (channel === 'LINKEDIN' && getLinkedInBridge()) {
    return true;
  }

  return Boolean(getWebhookBridge());
}
