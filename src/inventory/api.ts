import type {
  CreateInventoryProductInput,
  CreatePriceListImportInput,
  InventoryDashboardSnapshot,
  InventoryProductDetail,
  InventoryProductSummary,
  LogisticsQuote,
  PriceListImportResult,
  StockPosition,
  SupplierSummary,
  UpdateInventoryProductInput,
} from './contracts';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
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

export function updateInventoryProduct(id: string, input: UpdateInventoryProductInput) {
  return request<InventoryProductDetail>(`/api/inventory/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function fetchInventorySuppliers() {
  return request<SupplierSummary[]>('/api/inventory/suppliers');
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
  distanceKm: number;
  destinationLabel: string;
  supplierId?: string;
}) {
  return request<LogisticsQuote>('/api/inventory/logistics-quotes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
