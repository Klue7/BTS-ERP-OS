import { useCallback, useEffect, useState } from 'react';
import {
  createTenderMemberResponse as createTenderMemberResponseRequest,
  fetchTenderMemberPortalSnapshot,
} from './api';
import type {
  CreateTenderMemberResponseInput,
  TenderMemberPortalFilters,
  TenderMemberPortalSnapshot,
} from './contracts';

export function useTenderMemberAccess(initialFilters: TenderMemberPortalFilters = {}) {
  const [filters, setFilters] = useState<TenderMemberPortalFilters>(initialFilters);
  const [snapshot, setSnapshot] = useState<TenderMemberPortalSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (nextFilters: TenderMemberPortalFilters = filters) => {
    setIsLoading(true);
    setError(null);
    try {
      setSnapshot(await fetchTenderMemberPortalSnapshot(nextFilters));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to load member tender access.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void refresh(filters);
  }, [filters, refresh]);

  const updateFilters = useCallback((nextFilters: TenderMemberPortalFilters) => {
    setFilters((current) => ({ ...current, ...nextFilters }));
  }, []);

  const createResponse = useCallback(async (tenderId: string, input: CreateTenderMemberResponseInput) => {
    setIsSaving(true);
    setError(null);
    try {
      const nextSnapshot = await createTenderMemberResponseRequest(tenderId, input);
      setSnapshot(nextSnapshot);
      setFilters((current) => ({ ...current, role: input.memberRole }));
      return nextSnapshot;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    filters,
    setFilters: updateFilters,
    snapshot,
    isLoading,
    isSaving,
    error,
    refresh,
    createResponse,
  };
}
