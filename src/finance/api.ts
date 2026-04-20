import type { FinanceStudioSnapshot } from './contracts';

const FINANCE_GET_TIMEOUT_MS = 6_000;

function isAbortError(error: unknown) {
  return typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError';
}

function getDirectApiPath(path: string) {
  if (!path.startsWith('/api/') || typeof window === 'undefined') {
    return null;
  }

  const { protocol, hostname, port } = window.location;
  if (!hostname || port === '4010') {
    return null;
  }

  const isLocalHost = hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '0.0.0.0'
    || /^10\./.test(hostname)
    || /^192\.168\./.test(hostname)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

  return isLocalHost ? `${protocol}//${hostname}:4010${path}` : null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() ?? 'GET';
  const requestPaths = Array.from(new Set([
    path,
    method === 'GET' ? getDirectApiPath(path) : null,
  ].filter((entry): entry is string => Boolean(entry))));
  let lastError: unknown;

  for (const requestPath of requestPaths) {
    const controller = new AbortController();
    const timeout = method === 'GET'
      ? globalThis.setTimeout(() => controller.abort(), FINANCE_GET_TIMEOUT_MS)
      : null;
    try {
      const response = await fetch(requestPath, {
        ...init,
        signal: init?.signal ?? controller.signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error ?? `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error;
      if (method !== 'GET' || (!isAbortError(error) && !(error instanceof TypeError))) {
        break;
      }
    } finally {
      if (timeout !== null) {
        globalThis.clearTimeout(timeout);
      }
    }
  }

  throw lastError;
}

export function fetchFinanceStudio() {
  return request<FinanceStudioSnapshot>('/api/finance/studio');
}
