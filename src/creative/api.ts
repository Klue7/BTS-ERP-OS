import type {
  CreateCreativeAiJobInput,
  CreateCreativeDocumentInput,
  CreateCreativeExportJobInput,
  CreateCreativeLayerInput,
  CreativeAiJob,
  CreativeDocumentDetail,
  CreativeDocumentSummary,
  CreativeExportJob,
  CreativeStudioSnapshot,
  PublishCreativeDocumentInput,
  UpdateCreativeDocumentInput,
  UpdateCreativeLayerInput,
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

export function fetchCreativeStudioSnapshot() {
  return request<CreativeStudioSnapshot>('/api/creative/studio');
}

export function fetchCreativeDocument(documentId: string) {
  return request<CreativeDocumentDetail>(`/api/creative/documents/${documentId}`);
}

export function createCreativeDocument(input: CreateCreativeDocumentInput) {
  return request<CreativeDocumentDetail>('/api/creative/documents', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCreativeDocument(documentId: string, input: UpdateCreativeDocumentInput) {
  return request<CreativeDocumentDetail>(`/api/creative/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function duplicateCreativeDocument(documentId: string) {
  return request<CreativeDocumentDetail>(`/api/creative/documents/${documentId}/duplicate`, {
    method: 'POST',
  });
}

export function archiveCreativeDocument(documentId: string) {
  return request<CreativeDocumentDetail>(`/api/creative/documents/${documentId}/archive`, {
    method: 'POST',
  });
}

export function createCreativeLayer(documentId: string, input: CreateCreativeLayerInput) {
  return request<CreativeDocumentDetail>(`/api/creative/documents/${documentId}/layers`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCreativeLayer(documentId: string, layerId: string, input: UpdateCreativeLayerInput) {
  return request<CreativeDocumentDetail>(`/api/creative/documents/${documentId}/layers/${layerId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function createCreativeAiJob(input: CreateCreativeAiJobInput) {
  const path =
    input.type === 'Background Removal'
      ? '/api/creative/jobs/background-removal'
      : input.type === 'Room Segmentation'
        ? '/api/creative/jobs/room-segmentation'
        : input.type === 'Room Restyle'
          ? '/api/creative/jobs/room-restyle'
          : input.type === 'Image Expansion'
            ? '/api/creative/jobs/expand-image'
            : input.type === 'Auto Layout'
              ? '/api/creative/jobs/auto-layout'
              : input.type === 'Auto Caption'
                ? '/api/creative/jobs/auto-caption'
                : '/api/creative/jobs/object-cleanup';

  return request<CreativeAiJob>(path, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchCreativeJob(jobId: string) {
  return request<CreativeAiJob>(`/api/creative/jobs/${jobId}`);
}

export function createCreativeExportJob(documentId: string, input: CreateCreativeExportJobInput) {
  return request<CreativeExportJob>(`/api/creative/documents/${documentId}/exports`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function publishCreativeDocument(documentId: string, input: PublishCreativeDocumentInput) {
  return request<CreativeDocumentDetail>(`/api/creative/documents/${documentId}/publish`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
