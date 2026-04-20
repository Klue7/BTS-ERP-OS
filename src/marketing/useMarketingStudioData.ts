import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  archiveMarketingTemplate as archiveMarketingTemplateRequest,
  archiveMarketingAsset as archiveMarketingAssetRequest,
  createMarketingAsset as createMarketingAssetRequest,
  createMarketingCreativeOutput as createMarketingCreativeOutputRequest,
  createMarketingAssetVariant as createMarketingAssetVariantRequest,
  createMarketingCalendarEntry as createMarketingCalendarEntryRequest,
  createMarketingCampaign as createMarketingCampaignRequest,
  createMarketingContentPost as createMarketingContentPostRequest,
  commentOnMarketingCommunityPost as commentOnMarketingCommunityPostRequest,
  createMarketingRender as createMarketingRenderRequest,
  createMarketingTemplate as createMarketingTemplateRequest,
  duplicateMarketingTemplate as duplicateMarketingTemplateRequest,
  duplicateMarketingAsset as duplicateMarketingAssetRequest,
  fetchMarketingTemplates,
  fetchMarketingStudio,
  likeMarketingCommunityPost as likeMarketingCommunityPostRequest,
  refreshMarketingPublishing as refreshMarketingPublishingRequest,
  restoreMarketingTemplate as restoreMarketingTemplateRequest,
  updateMarketingTemplate as updateMarketingTemplateRequest,
  updateMarketingAsset as updateMarketingAssetRequest,
} from './api';
import type {
  CreateMarketingAssetInput,
  CreateMarketingCreativeOutputInput,
  CreateMarketingCalendarEntryInput,
  CreateMarketingCampaignInput,
  CreateMarketingContentPostInput,
  CreateMarketingCommunityCommentInput,
  CreateMarketingRenderInput,
  CreateMarketingTemplateInput,
  CreateMarketingVariantInput,
  MarketingStudioSnapshot,
  UpdateMarketingTemplateInput,
  UpdateMarketingAssetInput,
} from './contracts';

export function useMarketingStudioData() {
  const [studio, setStudio] = useState<MarketingStudioSnapshot | null>(null);
  const [archivedTemplates, setArchivedTemplates] = useState<MarketingStudioSnapshot['templates']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextStudio, nextArchivedTemplates] = await Promise.all([
        fetchMarketingStudio(),
        fetchMarketingTemplates('archived'),
      ]);
      setStudio(nextStudio);
      setArchivedTemplates(nextArchivedTemplates);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to load marketing studio data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return undefined;
    }

    const scheduleRefresh = () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        void refresh();
      }, 180);
    };

    let eventSource: EventSource | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) {
        return;
      }

      eventSource = new EventSource('/api/marketing/events');
      eventSource.onmessage = () => {
        scheduleRefresh();
      };
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;

        if (cancelled) {
          return;
        }

        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
        }

        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          void refresh();
          connect();
        }, 1200);
      };
    };

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleRefresh();
      }
    };

    window.addEventListener('focus', scheduleRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      eventSource?.close();
      window.removeEventListener('focus', scheduleRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  const mutate = useCallback(async <T,>(action: () => Promise<T>) => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await action();
      await refresh();
      return result;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update marketing studio.');
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  }, [refresh]);

  const createTemplate = useCallback(
    (input: CreateMarketingTemplateInput) => mutate(() => createMarketingTemplateRequest(input)),
    [mutate],
  );

  const updateTemplate = useCallback(
    (templateId: string, input: UpdateMarketingTemplateInput) =>
      mutate(() => updateMarketingTemplateRequest(templateId, input)),
    [mutate],
  );

  const duplicateTemplate = useCallback(
    (templateId: string) => mutate(() => duplicateMarketingTemplateRequest(templateId)),
    [mutate],
  );

  const archiveTemplate = useCallback(
    (templateId: string) => mutate(() => archiveMarketingTemplateRequest(templateId)),
    [mutate],
  );

  const restoreTemplate = useCallback(
    (templateId: string) => mutate(() => restoreMarketingTemplateRequest(templateId)),
    [mutate],
  );

  const createCampaign = useCallback(
    (input: CreateMarketingCampaignInput) => mutate(() => createMarketingCampaignRequest(input)),
    [mutate],
  );

  const createContentPost = useCallback(
    (input: CreateMarketingContentPostInput) => mutate(() => createMarketingContentPostRequest(input)),
    [mutate],
  );

  const createAsset = useCallback(
    (input: CreateMarketingAssetInput) => mutate(() => createMarketingAssetRequest(input)),
    [mutate],
  );

  const createAssetVariant = useCallback(
    (assetId: string, input: CreateMarketingVariantInput) =>
      mutate(() => createMarketingAssetVariantRequest(assetId, input)),
    [mutate],
  );

  const updateAsset = useCallback(
    (assetId: string, input: UpdateMarketingAssetInput) =>
      mutate(() => updateMarketingAssetRequest(assetId, input)),
    [mutate],
  );

  const duplicateAsset = useCallback(
    (assetId: string) => mutate(() => duplicateMarketingAssetRequest(assetId)),
    [mutate],
  );

  const archiveAsset = useCallback(
    (assetId: string) => mutate(() => archiveMarketingAssetRequest(assetId)),
    [mutate],
  );

  const createRender = useCallback(
    (input: CreateMarketingRenderInput) => mutate(() => createMarketingRenderRequest(input)),
    [mutate],
  );

  const createCreativeOutput = useCallback(
    (input: CreateMarketingCreativeOutputInput) => mutate(() => createMarketingCreativeOutputRequest(input)),
    [mutate],
  );

  const createCalendarEntry = useCallback(
    (input: CreateMarketingCalendarEntryInput) => mutate(() => createMarketingCalendarEntryRequest(input)),
    [mutate],
  );

  const refreshPublishing = useCallback(
    () => mutate(() => refreshMarketingPublishingRequest()),
    [mutate],
  );

  const likeCommunityPost = useCallback(
    (postId: string, input: Parameters<typeof likeMarketingCommunityPostRequest>[1]) =>
      mutate(() => likeMarketingCommunityPostRequest(postId, input)),
    [mutate],
  );

  const commentOnCommunityPost = useCallback(
    (postId: string, input: CreateMarketingCommunityCommentInput) =>
      mutate(() => commentOnMarketingCommunityPostRequest(postId, input)),
    [mutate],
  );

  const assetsById = useMemo(
    () => Object.fromEntries((studio?.assets ?? []).map((asset) => [asset.id, asset])),
    [studio?.assets],
  );

  const campaignsById = useMemo(
    () => Object.fromEntries((studio?.campaigns ?? []).map((campaign) => [campaign.id, campaign])),
    [studio?.campaigns],
  );

  return {
    studio,
    dashboard: studio?.dashboard ?? null,
    assets: studio?.assets ?? [],
    templates: studio?.templates ?? [],
    archivedTemplates,
    campaigns: studio?.campaigns ?? [],
    contentPosts: studio?.contentPosts ?? [],
    calendarEntries: studio?.calendarEntries ?? [],
    publishingJobs: studio?.publishingJobs ?? [],
    channelHealth: studio?.channelHealth ?? [],
    analytics: studio?.analytics ?? null,
    communityPosts: studio?.communityPosts ?? [],
    assetsById,
    campaignsById,
    isLoading,
    isSaving,
    error,
    refresh,
    createTemplate,
    updateTemplate,
    duplicateTemplate,
    archiveTemplate,
    restoreTemplate,
    createCampaign,
    createContentPost,
    createAsset,
    createAssetVariant,
    updateAsset,
    duplicateAsset,
    archiveAsset,
    createRender,
    createCreativeOutput,
    createCalendarEntry,
    refreshPublishing,
    likeCommunityPost,
    commentOnCommunityPost,
  };
}
