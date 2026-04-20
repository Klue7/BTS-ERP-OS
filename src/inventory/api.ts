import type {
  CompleteCustomerOrderInput,
  CustomerDocumentHistory,
  CustomerWorkflowProgressResult,
  CreateCustomerQuoteInput,
  CreateSupplierContactInput,
  CreateSupplierDocumentInput,
  CreateInventoryProductInput,
  CreatePriceListImportInput,
  CreateSupplierInput,
  DeleteSupplierResult,
  InventoryDashboardSnapshot,
  InventoryProductDetail,
  InventoryProductSummary,
  LinkSupplierProductsInput,
  LogisticsQuote,
  PriceListImportResult,
  StockPosition,
  SupplierSummary,
  SupplierPortalSession,
  UpdateSupplierInput,
  UpdateInventoryProductInput,
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

export interface InventoryUploadResponse {
  ok: true;
  filename: string;
  originalFilename: string;
  storedFilename: string;
  storagePath: string;
  mimeType: string;
  size: number;
  sha256: string;
  extension: string;
  kind: 'image' | 'video' | 'model' | 'document' | 'other';
  reuse: {
    marketing: boolean;
    publicCatalog: boolean;
    imageGeneration: boolean;
    threeDPipeline: boolean;
    specSheets: boolean;
  };
  url: string;
}

export interface PrivateSupplierDocumentUploadResponse {
  ok: true;
  filename: string;
  storedFileName: string;
  mimeType: string;
  size: number;
  storagePath: string;
}

export function fetchInventoryDashboard() {
  return request<InventoryDashboardSnapshot>('/api/inventory/dashboard');
}

export function fetchInventoryProducts() {
  return request<InventoryProductSummary[]>('/api/inventory/products');
}

export function fetchInventoryProductDetails() {
  return request<InventoryProductDetail[]>('/api/inventory/products?details=full');
}

export function fetchInventoryProduct(id: string) {
  return request<InventoryProductDetail>(`/api/inventory/products/${id}`);
}

export function createInventoryProduct(input: CreateInventoryProductInput) {
  return request<InventoryProductDetail>('/api/inventory/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function uploadInventoryFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return request<InventoryUploadResponse>('/api/inventory/uploads', {
    method: 'POST',
    body: formData,
  });
}

export function updateInventoryProduct(id: string, input: UpdateInventoryProductInput) {
  return request<InventoryProductDetail>(`/api/inventory/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function publishInventoryProduct(id: string) {
  return updateInventoryProduct(id, {
    publishStatus: 'Published',
    status: 'Active',
  });
}

export function fetchInventorySuppliers() {
  return request<SupplierSummary[]>('/api/inventory/suppliers');
}

export function fetchInventorySupplier(id: string) {
  return request<SupplierSummary>(`/api/inventory/suppliers/${id}`);
}

export function fetchInventoryCustomerDocuments(id: string) {
  return request<CustomerDocumentHistory>(`/api/inventory/customers/${id}/documents`);
}

export function createCustomerQuoteDocument(id: string, input: CreateCustomerQuoteInput) {
  return request<CustomerWorkflowProgressResult>(`/api/inventory/customers/${id}/workflow/quotes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function markCustomerQuotePaid(documentKey: string) {
  return request<CustomerWorkflowProgressResult>(`/api/inventory/documents/${documentKey}/workflow/quote-paid`, {
    method: 'POST',
  });
}

export function completeCustomerOrderWorkflow(documentKey: string, input: CompleteCustomerOrderInput = {}) {
  return request<CustomerWorkflowProgressResult>(`/api/inventory/documents/${documentKey}/workflow/complete-order`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createInventorySupplier(input: CreateSupplierInput) {
  return request<SupplierSummary>('/api/inventory/suppliers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateInventorySupplier(id: string, input: UpdateSupplierInput) {
  return request<SupplierSummary>(`/api/inventory/suppliers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteInventorySupplier(id: string) {
  return request<DeleteSupplierResult>(`/api/inventory/suppliers/${id}`, {
    method: 'DELETE',
  });
}

export function createInventorySupplierContact(id: string, input: CreateSupplierContactInput) {
  return request<SupplierSummary>(`/api/inventory/suppliers/${id}/contacts`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function uploadSupplierDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return request<PrivateSupplierDocumentUploadResponse>('/api/inventory/suppliers/documents/upload', {
    method: 'POST',
    body: formData,
  });
}

export function createInventorySupplierDocument(id: string, input: CreateSupplierDocumentInput) {
  return request<SupplierSummary>(`/api/inventory/suppliers/${id}/documents`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function linkInventorySupplierProducts(id: string, input: LinkSupplierProductsInput) {
  return request<SupplierSummary>(`/api/inventory/suppliers/${id}/products`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginSupplierPortal(input: { email: string; password: string }) {
  return request<{ ok: true; role: 'supplier' }>('/api/vendor-portal/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function logoutSupplierPortal() {
  return request<{ ok: true }>('/api/vendor-portal/logout', {
    method: 'POST',
  });
}

export function fetchSupplierPortalSession() {
  return request<SupplierPortalSession | { ok: false; session: null }>('/api/vendor-portal/session');
}

export function fetchSupplierPortalMe() {
  return request<SupplierPortalSession>('/api/vendor-portal/me');
}

export function createStockMovement(input: {
  productId: string;
  type: 'Receipt' | 'Reservation' | 'Release' | 'Issue' | 'Return' | 'Adjustment' | 'Cancellation';
  quantity: number;
  note?: string;
  referenceType?: string;
  referenceId?: string;
}) {
  return request<StockPosition>('/api/inventory/stock-movements', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createPriceListImport(input: CreatePriceListImportInput) {
  return request<PriceListImportResult>('/api/inventory/price-list-imports', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function applyPriceListImport(batchId: string) {
  return request<PriceListImportResult>(`/api/inventory/price-list-imports/${batchId}/apply`, {
    method: 'POST',
  });
}

export function createLogisticsQuote(input: {
  productId: string;
  distanceKm?: number;
  destinationLabel: string;
  destinationRegion?: string;
  destinationCity?: string;
  supplierId?: string;
}) {
  return request<LogisticsQuote>('/api/inventory/logistics-quotes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
