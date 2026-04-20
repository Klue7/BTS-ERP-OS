import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWorkflowMapSnapshot } from './api';
import type { WorkflowMapSnapshot } from './contracts';

export function useWorkflowMapData() {
  const [snapshot, setSnapshot] = useState<WorkflowMapSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setSnapshot(await fetchWorkflowMapSnapshot());
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to load workflow map.');
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

    const eventSources: EventSource[] = [];
    let cancelled = false;

    const connect = (path: string) => {
      if (cancelled) {
        return;
      }

      const eventSource = new EventSource(path);
      eventSources.push(eventSource);
      eventSource.onmessage = scheduleRefresh;
      eventSource.onerror = () => {
        eventSource.close();

        if (cancelled) {
          return;
        }

        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
        }

        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          void refresh();
          connect(path);
        }, 1200);
      };
    };

    connect('/api/finance/events');
    connect('/api/comms/events');

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
      eventSources.forEach((eventSource) => eventSource.close());
      window.removeEventListener('focus', scheduleRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  return {
    snapshot,
    isLoading,
    error,
    refresh,
  };
}
