import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  archiveCreativeDocument as archiveCreativeDocumentRequest,
  createCreativeAiJob as createCreativeAiJobRequest,
  createCreativeDocument as createCreativeDocumentRequest,
  createCreativeExportJob as createCreativeExportJobRequest,
  createCreativeLayer as createCreativeLayerRequest,
  duplicateCreativeDocument as duplicateCreativeDocumentRequest,
  fetchCreativeDocument,
  fetchCreativeStudioSnapshot,
  publishCreativeDocument as publishCreativeDocumentRequest,
  updateCreativeDocument as updateCreativeDocumentRequest,
  updateCreativeLayer as updateCreativeLayerRequest,
} from './api';
import type {
  CreateCreativeAiJobInput,
  CreateCreativeDocumentInput,
  CreateCreativeExportJobInput,
  CreateCreativeLayerInput,
  CreativeDocumentDetail,
  PublishCreativeDocumentInput,
  UpdateCreativeDocumentInput,
  UpdateCreativeLayerInput,
} from './contracts';

export function useCreativeStudioData() {
  const [documents, setDocuments] = useState<CreativeDocumentDetail[]>([]);
  const [activeDocument, setActiveDocument] = useState<CreativeDocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const snapshot = await fetchCreativeStudioSnapshot();
      const detailEntries = await Promise.all(
        snapshot.documents.map(async (document) => {
          try {
            return await fetchCreativeDocument(document.id);
          } catch {
            return null;
          }
        }),
      );

      const nextDocuments = detailEntries.filter(Boolean) as CreativeDocumentDetail[];
      setDocuments(nextDocuments);
      setActiveDocument((current) => {
        if (!current) {
          return nextDocuments[0] ?? null;
        }
        return nextDocuments.find((document) => document.id === current.id) ?? nextDocuments[0] ?? null;
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load Creative Studio.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const mutate = useCallback(
    async <T,>(operation: () => Promise<T>, options?: { documentId?: string; selectResult?: boolean }) => {
      setIsSaving(true);
      setError(null);

      try {
        const result = await operation();
        await hydrate();

        if (options?.documentId) {
          const fresh = await fetchCreativeDocument(options.documentId);
          setDocuments((current) => {
            const next = current.filter((item) => item.id !== fresh.id);
            return [fresh, ...next].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
          });
          if (options.selectResult !== false) {
            setActiveDocument(fresh);
          }
          return fresh as unknown as T;
        }

        if (options?.selectResult && result && typeof result === 'object' && 'id' in (result as object)) {
          const id = String((result as unknown as { id: string }).id);
          const fresh = await fetchCreativeDocument(id);
          setDocuments((current) => {
            const next = current.filter((item) => item.id !== fresh.id);
            return [fresh, ...next].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
          });
          setActiveDocument(fresh);
          return fresh as unknown as T;
        }

        return result;
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Creative Studio request failed.');
        throw nextError;
      } finally {
        setIsSaving(false);
      }
    },
    [hydrate],
  );

  const createDocument = useCallback(
    (input: CreateCreativeDocumentInput) => mutate(() => createCreativeDocumentRequest(input), { selectResult: true }),
    [mutate],
  );

  const updateDocument = useCallback(
    (documentId: string, input: UpdateCreativeDocumentInput) =>
      mutate(() => updateCreativeDocumentRequest(documentId, input), { documentId }),
    [mutate],
  );

  const duplicateDocument = useCallback(
    (documentId: string) => mutate(() => duplicateCreativeDocumentRequest(documentId), { selectResult: true }),
    [mutate],
  );

  const archiveDocument = useCallback(
    (documentId: string) => mutate(() => archiveCreativeDocumentRequest(documentId), { documentId, selectResult: false }),
    [mutate],
  );

  const createLayer = useCallback(
    (documentId: string, input: CreateCreativeLayerInput) =>
      mutate(() => createCreativeLayerRequest(documentId, input), { documentId }),
    [mutate],
  );

  const updateLayer = useCallback(
    (documentId: string, layerId: string, input: UpdateCreativeLayerInput) =>
      mutate(() => updateCreativeLayerRequest(documentId, layerId, input), { documentId }),
    [mutate],
  );

  const createAiJob = useCallback(
    (input: CreateCreativeAiJobInput) => mutate(() => createCreativeAiJobRequest(input), { selectResult: false }),
    [mutate],
  );

  const createExportJob = useCallback(
    (documentId: string, input: CreateCreativeExportJobInput) =>
      mutate(() => createCreativeExportJobRequest(documentId, input), { documentId }),
    [mutate],
  );

  const publishDocument = useCallback(
    (documentId: string, input: PublishCreativeDocumentInput) =>
      mutate(() => publishCreativeDocumentRequest(documentId, input), { documentId }),
    [mutate],
  );

  const documentsById = useMemo(
    () => Object.fromEntries(documents.map((document) => [document.id, document])),
    [documents],
  );

  return {
    documents,
    documentsById,
    activeDocument,
    setActiveDocument,
    isLoading,
    isSaving,
    error,
    refresh: hydrate,
    createDocument,
    updateDocument,
    duplicateDocument,
    archiveDocument,
    createLayer,
    updateLayer,
    createAiJob,
    createExportJob,
    publishDocument,
  };
}
