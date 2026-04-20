import { useCallback, useEffect, useRef, useState } from 'react';
import {
  assignCommsConversation,
  createCommsCustomer,
  convertCommsQuote,
  createCommsLead,
  createCommsSupportIssue,
  createCommsTask,
  fetchCommsStudio,
  linkCommsCustomer,
  requestCommsInfo,
  requestCustomerCommsInfo,
  resolveCommsConversation,
  sendCommsReply,
  uploadCommsAttachment,
} from './api';
import type {
  AssignCommsConversationInput,
  CommsStudioSnapshot,
  CommsWorkflowActionInput,
  CreateCommsCustomerInput,
  LinkCommsCustomerInput,
  SendCommsReplyInput,
} from './contracts';

let cachedCommsStudio: CommsStudioSnapshot | null = null;
let commsStudioFetchInFlight: Promise<CommsStudioSnapshot> | null = null;
const commsStudioSubscribers = new Set<(snapshot: CommsStudioSnapshot) => void>();
const commsServerEventSubscribers = new Set<() => void>();
let commsEventSource: EventSource | null = null;
let commsEventReconnectTimer: number | null = null;

function publishCommsStudioSnapshot(snapshot: CommsStudioSnapshot) {
  cachedCommsStudio = snapshot;
  commsStudioSubscribers.forEach((subscriber) => subscriber(snapshot));
}

function subscribeCommsStudioSnapshot(subscriber: (snapshot: CommsStudioSnapshot) => void) {
  commsStudioSubscribers.add(subscriber);
  return () => {
    commsStudioSubscribers.delete(subscriber);
  };
}

function loadCommsStudioSnapshot() {
  if (!commsStudioFetchInFlight) {
    commsStudioFetchInFlight = fetchCommsStudio()
      .then((snapshot) => {
        publishCommsStudioSnapshot(snapshot);
        return snapshot;
      })
      .finally(() => {
        commsStudioFetchInFlight = null;
      });
  }

  return commsStudioFetchInFlight;
}

function closeCommsEventSource() {
  if (commsEventReconnectTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(commsEventReconnectTimer);
  }
  commsEventReconnectTimer = null;
  commsEventSource?.close();
  commsEventSource = null;
}

function connectCommsEventSource() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined' || commsEventSource) {
    return;
  }

  const source = new EventSource('/api/comms/events');
  commsEventSource = source;
  source.onmessage = () => {
    commsServerEventSubscribers.forEach((subscriber) => subscriber());
  };
  source.onerror = () => {
    source.close();
    if (commsEventSource === source) {
      commsEventSource = null;
    }
    if (commsServerEventSubscribers.size === 0 || commsEventReconnectTimer !== null) {
      return;
    }

    commsEventReconnectTimer = window.setTimeout(() => {
      commsEventReconnectTimer = null;
      commsServerEventSubscribers.forEach((subscriber) => subscriber());
      connectCommsEventSource();
    }, 1200);
  };
}

function subscribeCommsServerEvents(listener: () => void) {
  commsServerEventSubscribers.add(listener);
  connectCommsEventSource();

  return () => {
    commsServerEventSubscribers.delete(listener);
    if (commsServerEventSubscribers.size === 0) {
      closeCommsEventSource();
    }
  };
}

export function useCommsData() {
  const [studio, setStudio] = useState<CommsStudioSnapshot | null>(cachedCommsStudio);
  const [isLoading, setIsLoading] = useState(!cachedCommsStudio);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);
  const queuedRefreshRef = useRef(false);
  const studioRef = useRef<CommsStudioSnapshot | null>(cachedCommsStudio);

  const setStudioSnapshot = useCallback((snapshot: CommsStudioSnapshot) => {
    studioRef.current = snapshot;
    setStudio(snapshot);
  }, []);

  const refresh = useCallback(async (options: { background?: boolean } = {}) => {
    if (isRefreshingRef.current) {
      queuedRefreshRef.current = true;
      return;
    }

    isRefreshingRef.current = true;
    if (!studioRef.current && !options.background) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const snapshot = await loadCommsStudioSnapshot();
      if (!isMountedRef.current) {
        return;
      }
      setStudioSnapshot(snapshot);
    } catch (refreshError) {
      if (isMountedRef.current && !studioRef.current) {
        setError(refreshError instanceof Error ? refreshError.message : 'Failed to load comms centre.');
      }
    } finally {
      isRefreshingRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
      }

      if (queuedRefreshRef.current && isMountedRef.current) {
        queuedRefreshRef.current = false;
        void refresh({ background: true });
      }
    }
  }, [setStudioSnapshot]);

  const mutate = useCallback(async (operation: () => Promise<CommsStudioSnapshot>) => {
    setError(null);
    const snapshot = await operation();
    publishCommsStudioSnapshot(snapshot);
    setStudioSnapshot(snapshot);
    return snapshot;
  }, [setStudioSnapshot]);

  useEffect(() => {
    isMountedRef.current = true;
    void refresh();

    return () => {
      isMountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => (
    subscribeCommsStudioSnapshot((snapshot) => {
      if (!isMountedRef.current) {
        return;
      }

      setStudioSnapshot(snapshot);
      setIsLoading(false);
      setError(null);
    })
  ), [setStudioSnapshot]);

  useEffect(() => {
    if (!studio || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return undefined;
    }

    const scheduleRefresh = () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        void refresh({ background: true });
      }, 180);
    };

    const unsubscribe = subscribeCommsServerEvents(scheduleRefresh);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleRefresh();
      }
    };

    window.addEventListener('focus', scheduleRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
      unsubscribe();
      window.removeEventListener('focus', scheduleRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh, studio]);

  return {
    studio,
    isLoading,
    error,
    refresh,
    sendReply: (conversationId: string, input: SendCommsReplyInput) => mutate(() => sendCommsReply(conversationId, input)),
    resolveConversation: (conversationId: string, input: CommsWorkflowActionInput = {}) => mutate(() => resolveCommsConversation(conversationId, input)),
    assignConversation: (conversationId: string, input: AssignCommsConversationInput) => mutate(() => assignCommsConversation(conversationId, input)),
    linkCustomer: (conversationId: string, input: LinkCommsCustomerInput = {}) => mutate(() => linkCommsCustomer(conversationId, input)),
    createCustomer: (input: CreateCommsCustomerInput) => mutate(() => createCommsCustomer(input)),
    createLead: (conversationId: string, input: CommsWorkflowActionInput = {}) => mutate(() => createCommsLead(conversationId, input)),
    createTask: (conversationId: string, input: CommsWorkflowActionInput = {}) => mutate(() => createCommsTask(conversationId, input)),
    requestInfo: (conversationId: string, input: CommsWorkflowActionInput = {}) => mutate(() => requestCommsInfo(conversationId, input)),
    requestCustomerInfo: (customerId: string, input: CommsWorkflowActionInput = {}) => mutate(() => requestCustomerCommsInfo(customerId, input)),
    createSupportIssue: (conversationId: string, input: CommsWorkflowActionInput = {}) => mutate(() => createCommsSupportIssue(conversationId, input)),
    convertQuote: (conversationId: string, input: CommsWorkflowActionInput = {}) => mutate(() => convertCommsQuote(conversationId, input)),
    uploadAttachment: uploadCommsAttachment,
  };
}
