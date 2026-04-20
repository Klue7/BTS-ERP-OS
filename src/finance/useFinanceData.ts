import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFinanceStudio } from './api';
import type { FinanceStudioSnapshot } from './contracts';

let cachedFinanceStudio: FinanceStudioSnapshot | null = null;
let financeStudioFetchInFlight: Promise<FinanceStudioSnapshot> | null = null;
const financeStudioSubscribers = new Set<(snapshot: FinanceStudioSnapshot) => void>();
const financeServerEventSubscribers = new Set<() => void>();
let financeEventSource: EventSource | null = null;
let financeEventReconnectTimer: number | null = null;

function publishFinanceStudioSnapshot(snapshot: FinanceStudioSnapshot) {
  cachedFinanceStudio = snapshot;
  financeStudioSubscribers.forEach((subscriber) => subscriber(snapshot));
}

function subscribeFinanceStudioSnapshot(subscriber: (snapshot: FinanceStudioSnapshot) => void) {
  financeStudioSubscribers.add(subscriber);
  return () => {
    financeStudioSubscribers.delete(subscriber);
  };
}

function loadFinanceStudioSnapshot() {
  if (!financeStudioFetchInFlight) {
    financeStudioFetchInFlight = fetchFinanceStudio()
      .then((snapshot) => {
        publishFinanceStudioSnapshot(snapshot);
        return snapshot;
      })
      .finally(() => {
        financeStudioFetchInFlight = null;
      });
  }

  return financeStudioFetchInFlight;
}

function closeFinanceEventSource() {
  if (financeEventReconnectTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(financeEventReconnectTimer);
  }
  financeEventReconnectTimer = null;
  financeEventSource?.close();
  financeEventSource = null;
}

function connectFinanceEventSource() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined' || financeEventSource) {
    return;
  }

  const source = new EventSource('/api/finance/events');
  financeEventSource = source;
  source.onmessage = () => {
    financeServerEventSubscribers.forEach((subscriber) => subscriber());
  };
  source.onerror = () => {
    source.close();
    if (financeEventSource === source) {
      financeEventSource = null;
    }
    if (financeServerEventSubscribers.size === 0 || financeEventReconnectTimer !== null) {
      return;
    }

    financeEventReconnectTimer = window.setTimeout(() => {
      financeEventReconnectTimer = null;
      financeServerEventSubscribers.forEach((subscriber) => subscriber());
      connectFinanceEventSource();
    }, 1200);
  };
}

function subscribeFinanceServerEvents(listener: () => void) {
  financeServerEventSubscribers.add(listener);
  connectFinanceEventSource();

  return () => {
    financeServerEventSubscribers.delete(listener);
    if (financeServerEventSubscribers.size === 0) {
      closeFinanceEventSource();
    }
  };
}

export function useFinanceData() {
  const [studio, setStudio] = useState<FinanceStudioSnapshot | null>(cachedFinanceStudio);
  const [isLoading, setIsLoading] = useState(!cachedFinanceStudio);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);
  const queuedRefreshRef = useRef(false);
  const studioRef = useRef<FinanceStudioSnapshot | null>(cachedFinanceStudio);

  const setStudioSnapshot = useCallback((snapshot: FinanceStudioSnapshot) => {
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
      const snapshot = await loadFinanceStudioSnapshot();
      if (!isMountedRef.current) {
        return;
      }
      setStudioSnapshot(snapshot);
    } catch (refreshError) {
      if (isMountedRef.current && !studioRef.current) {
        setError(refreshError instanceof Error ? refreshError.message : 'Failed to load finance studio.');
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

  useEffect(() => {
    isMountedRef.current = true;
    void refresh();

    return () => {
      isMountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => (
    subscribeFinanceStudioSnapshot((snapshot) => {
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

    const unsubscribe = subscribeFinanceServerEvents(scheduleRefresh);

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
  };
}
