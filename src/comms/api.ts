import type {
  CommsAttachmentSummary,
  AssignCommsConversationInput,
  CommsStudioSnapshot,
  CommsWorkflowActionInput,
  CreateCommsCustomerInput,
  InboundCommsMessageInput,
  LinkCommsCustomerInput,
  SendCommsReplyInput,
} from './contracts';

const DEFAULT_TIMEOUT_MS = 20_000;
const GET_TIMEOUT_MS = 6_000;
const GET_RETRY_COUNT = 1;

function isAbortError(error: unknown) {
  return typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError';
}

async function requestOnce<T>(path: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  const forwardAbort = () => controller.abort();
  if (init?.signal) {
    if (init.signal.aborted) {
      controller.abort();
    } else {
      init.signal.addEventListener('abort', forwardAbort, { once: true });
    }
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(`Request timed out while loading ${path}. Confirm the API is listening on port 4010, then retry.`);
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
    init?.signal?.removeEventListener('abort', forwardAbort);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
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
  const directApiPath = method === 'GET' ? getDirectApiPath(path) : null;
  const requestPaths = Array.from(new Set([path, directApiPath].filter((entry): entry is string => Boolean(entry))));
  let lastError: unknown;

  for (const requestPath of requestPaths) {
    const maxAttempts = method === 'GET' && !directApiPath ? GET_RETRY_COUNT + 1 : 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await requestOnce<T>(requestPath, init, method === 'GET' ? GET_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
      } catch (error) {
        lastError = error;
        const canRetry = method === 'GET' && attempt < maxAttempts && (
          isAbortError(error)
          || error instanceof TypeError
          || (error instanceof Error && /timed out|fetch/i.test(error.message))
        );
        if (!canRetry) {
          break;
        }

        await new Promise((resolve) => globalThis.setTimeout(resolve, 350 * attempt));
      }
    }
  }

  throw lastError;
}

function jsonInit(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export function fetchCommsStudio() {
  return request<CommsStudioSnapshot>('/api/comms/studio');
}

export async function uploadCommsAttachment(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<CommsAttachmentSummary>('/api/comms/uploads', {
    method: 'POST',
    body: formData,
  });
}

export function sendCommsReply(conversationId: string, input: SendCommsReplyInput) {
  return request<CommsStudioSnapshot>(`/api/comms/conversations/${conversationId}/reply`, jsonInit('POST', input));
}

export function resolveCommsConversation(conversationId: string, input: CommsWorkflowActionInput = {}) {
  return request<CommsStudioSnapshot>(`/api/comms/conversations/${conversationId}/resolve`, jsonInit('POST', input));
}

export function assignCommsConversation(conversationId: string, input: AssignCommsConversationInput) {
  return request<CommsStudioSnapshot>(`/api/comms/conversations/${conversationId}/assign`, jsonInit('POST', input));
}

export function linkCommsCustomer(conversationId: string, input: LinkCommsCustomerInput = {}) {
  return request<CommsStudioSnapshot>(`/api/comms/conversations/${conversationId}/link-customer`, jsonInit('POST', input));
}

export function createCommsCustomer(input: CreateCommsCustomerInput) {
  return request<CommsStudioSnapshot>('/api/comms/customers', jsonInit('POST', input));
}

export function createCommsLead(conversationId: string, input: CommsWorkflowActionInput = {}) {
  return request<CommsStudioSnapshot>(`/api/comms/conversations/${conversationId}/create-lead`, jsonInit('POST', input));
}

export function createCommsTask(conversationId: string, input: CommsWorkflowActionInput = {}) {
  return request<CommsStudioSnapshot>(`/api/comms/conversations/${conversationId}/create-task`, jsonInit('POST', input));
}

export function requestCommsInfo(conversationId: string, input: CommsWorkflowActionInput = {}) {
  return request<CommsStudioSnapshot>(`/api/comms/conversations/${conversationId}/request-info`, jsonInit('POST', input));
}

export function requestCustomerCommsInfo(customerId: string, input: CommsWorkflowActionInput = {}) {
  return request<CommsStudioSnapshot>(`/api/comms/customers/${customerId}/request-info`, jsonInit('POST', input));
}

export function createCommsSupportIssue(conversationId: string, input: CommsWorkflowActionInput = {}) {
  return request<CommsStudioSnapshot>(`/api/comms/conversations/${conversationId}/support-issue`, jsonInit('POST', input));
}

export function convertCommsQuote(conversationId: string, input: CommsWorkflowActionInput = {}) {
  return request<CommsStudioSnapshot>(`/api/comms/conversations/${conversationId}/convert-quote`, jsonInit('POST', input));
}

export function ingestCommsMessage(provider: string, input: InboundCommsMessageInput) {
  return request<CommsStudioSnapshot>(`/api/comms/inbound/${provider}`, jsonInit('POST', input));
}
