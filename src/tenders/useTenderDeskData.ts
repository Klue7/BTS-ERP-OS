import { useCallback, useEffect, useState } from 'react';
import {
  createTenderOpportunity as createTenderOpportunityRequest,
  createTenderQuoteDraft as createTenderQuoteDraftRequest,
  createTenderSubmission as createTenderSubmissionRequest,
  fetchTenderDeskSnapshot,
  importTenderSourcePack as importTenderSourcePackRequest,
  promoteTenderDocumentToBoq as promoteTenderDocumentToBoqRequest,
  syncEtenders as syncEtendersRequest,
  updateTenderBoqLine as updateTenderBoqLineRequest,
  uploadTenderBoq as uploadTenderBoqRequest,
  uploadTenderDocument as uploadTenderDocumentRequest,
} from './api';
import type {
  CreateTenderOpportunityInput,
  PromoteTenderDocumentToBoqInput,
  CreateTenderQuoteDraftInput,
  CreateTenderSubmissionInput,
  ImportTenderSourcePackResult,
  ParsedTenderUpload,
  SyncEtendersInput,
  TenderDeskSnapshot,
  TenderSyncResult,
  UpdateTenderBoqLineInput,
  UploadTenderBoqInput,
} from './contracts';

export function useTenderDeskData() {
  const [snapshot, setSnapshot] = useState<TenderDeskSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSnapshot(await fetchTenderDeskSnapshot());
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to load tenders workspace.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mutate = useCallback(async <T>(operation: () => Promise<T>, applySnapshot?: (result: T) => TenderDeskSnapshot | null) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await operation();
      const nextSnapshot = applySnapshot ? applySnapshot(result) : (result as TenderDeskSnapshot | null);
      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
      } else {
        await refresh();
      }
      return result;
    } finally {
      setIsSaving(false);
    }
  }, [refresh]);

  return {
    snapshot,
    isLoading,
    isSaving,
    error,
    refresh,
    createTenderOpportunity: (input: CreateTenderOpportunityInput) => mutate(() => createTenderOpportunityRequest(input), () => null),
    uploadTenderDocument: (file: File, aiDirection?: string) => uploadTenderDocumentRequest(file, aiDirection) as Promise<ParsedTenderUpload>,
    uploadTenderBoq: (opportunityId: string, file: File, input: UploadTenderBoqInput) => mutate(
      () => uploadTenderBoqRequest(opportunityId, file, input),
      (result) => result,
    ),
    updateTenderBoqLine: (boqId: string, lineId: string, input: UpdateTenderBoqLineInput) => mutate(
      () => updateTenderBoqLineRequest(boqId, lineId, input),
      (result) => result,
    ),
    promoteTenderDocumentToBoq: (opportunityId: string, input: PromoteTenderDocumentToBoqInput) => mutate(
      () => promoteTenderDocumentToBoqRequest(opportunityId, input),
      (result) => result,
    ),
    createTenderQuoteDraft: (input: CreateTenderQuoteDraftInput) => mutate(
      () => createTenderQuoteDraftRequest(input),
      (result) => result,
    ),
    createTenderSubmission: (input: CreateTenderSubmissionInput) => mutate(
      () => createTenderSubmissionRequest(input),
      (result) => result,
    ),
    syncEtenders: (input: SyncEtendersInput = {}) => mutate(
      () => syncEtendersRequest(input),
      (result: TenderSyncResult) => result.snapshot,
    ),
    importTenderSourcePack: (tenderId: string) => mutate(
      () => importTenderSourcePackRequest(tenderId),
      (result: ImportTenderSourcePackResult) => result.snapshot,
    ),
  };
}

export type TenderDeskData = ReturnType<typeof useTenderDeskData>;
