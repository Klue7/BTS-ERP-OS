import type {
  CreateMarketingAssetInput,
  CreateMarketingCalendarEntryInput,
  CreateMarketingCampaignInput,
  CreateMarketingContentPostInput,
  CreateMarketingCommunityLikeInput,
  CreateMarketingCommunityCommentInput,
  CreateMarketingCreativeOutputInput,
  CreateMarketingRenderInput,
  CreateMarketingTemplateInput,
  CreateMarketingVariantInput,
  MarketingAssetSummary,
  MarketingCalendarEntry,
  MarketingCampaignSummary,
  MarketingContentPostSummary,
  PublicMarketingBlueprintSnapshot,
  MarketingStudioSnapshot,
  MarketingTemplateSummary,
  UpdateMarketingTemplateInput,
  UpdateMarketingAssetInput,
} from './contracts';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const headers = new Headers(init?.headers ?? undefined);

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    headers,
    ...init,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchMarketingStudio() {
  return request<MarketingStudioSnapshot>('/api/marketing/studio');
}

export function fetchPublishedMarketingContent() {
  return request<MarketingContentPostSummary[]>('/api/marketing/public-content');
}

export function fetchPublicMarketingBlueprints() {
  return request<PublicMarketingBlueprintSnapshot>('/api/marketing/public-blueprints');
}

export function fetchMarketingTemplates(status: 'active' | 'archived' | 'all' = 'active') {
  return request<MarketingTemplateSummary[]>(`/api/marketing/templates?status=${status}`);
}

export function createMarketingTemplate(input: CreateMarketingTemplateInput) {
  return request<MarketingTemplateSummary>('/api/marketing/templates', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMarketingTemplate(templateId: string, input: UpdateMarketingTemplateInput) {
  return request<MarketingTemplateSummary>(`/api/marketing/templates/${templateId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function duplicateMarketingTemplate(templateId: string) {
  return request<MarketingTemplateSummary>(`/api/marketing/templates/${templateId}/duplicate`, {
    method: 'POST',
  });
}

export function archiveMarketingTemplate(templateId: string) {
  return request<MarketingTemplateSummary>(`/api/marketing/templates/${templateId}/archive`, {
    method: 'POST',
  });
}

export function restoreMarketingTemplate(templateId: string) {
  return request<MarketingTemplateSummary>(`/api/marketing/templates/${templateId}/restore`, {
    method: 'POST',
  });
}

export function createMarketingCampaign(input: CreateMarketingCampaignInput) {
  return request<MarketingCampaignSummary>('/api/marketing/campaigns', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createMarketingContentPost(input: CreateMarketingContentPostInput) {
  return request<MarketingContentPostSummary>('/api/marketing/content-posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createMarketingAsset(input: CreateMarketingAssetInput) {
  return request<MarketingAssetSummary>('/api/marketing/assets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createMarketingAssetVariant(assetId: string, input: CreateMarketingVariantInput) {
  return request<MarketingAssetSummary>(`/api/marketing/assets/${assetId}/variants`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMarketingAsset(assetId: string, input: UpdateMarketingAssetInput) {
  return request<MarketingAssetSummary>(`/api/marketing/assets/${assetId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function duplicateMarketingAsset(assetId: string) {
  return request<MarketingAssetSummary>(`/api/marketing/assets/${assetId}/duplicate`, {
    method: 'POST',
  });
}

export function archiveMarketingAsset(assetId: string) {
  return request<MarketingAssetSummary>(`/api/marketing/assets/${assetId}/archive`, {
    method: 'POST',
  });
}

export function createMarketingRender(input: CreateMarketingRenderInput) {
  return request<MarketingAssetSummary>('/api/marketing/creative-renders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createMarketingCreativeOutput(input: CreateMarketingCreativeOutputInput) {
  return request<MarketingAssetSummary>('/api/marketing/creative-outputs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createMarketingCalendarEntry(input: CreateMarketingCalendarEntryInput) {
  return request<MarketingCalendarEntry>('/api/marketing/calendar-entries', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function refreshMarketingPublishing() {
  return request<MarketingStudioSnapshot>('/api/marketing/publishing/refresh', {
    method: 'POST',
  });
}

export function likeMarketingCommunityPost(postId: string, input: CreateMarketingCommunityLikeInput) {
  return request<MarketingStudioSnapshot>(`/api/marketing/community-posts/${postId}/likes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function commentOnMarketingCommunityPost(postId: string, input: CreateMarketingCommunityCommentInput) {
  return request<MarketingStudioSnapshot>(`/api/marketing/community-posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
