import type { WorkflowMapSnapshot } from './contracts';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchWorkflowMapSnapshot() {
  return request<WorkflowMapSnapshot>('/api/workflows/map');
}
