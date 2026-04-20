export interface FinanceMarginSnapshot {
  sellingValue: number;
  productCost: number;
  logisticsCost: number;
  otherCosts: number;
  projectedMargin: number;
  realizedMargin: number;
  status: 'Healthy' | 'At Risk' | 'Negative';
}

export interface FinanceLinkedDocument {
  key: string;
  title: string;
  type: string;
  status: string;
  amount: number;
  pdfUrl: string;
}

export interface FinanceHistoryEvent {
  date: string;
  user: string;
  action: string;
}

export interface FinanceRecord {
  id: string;
  sourceDocumentId?: string | null;
  sourceDocumentKey?: string | null;
  orderId: string;
  customerName: string;
  type: 'Receivable' | 'Payable';
  category: string;
  status: string;
  amount: number;
  balance: number;
  dueDate: string;
  issueDate: string;
  currency: string;
  summary?: string | null;
  pdfUrl?: string | null;
  customerKey?: string | null;
  supplierKey?: string | null;
  supplierName?: string | null;
  productId?: string | null;
  productName?: string | null;
  productSku?: string | null;
  workflowNode?: string | null;
  exceptions?: string[];
  margin?: FinanceMarginSnapshot | null;
  linkedDocuments: FinanceLinkedDocument[];
  history: FinanceHistoryEvent[];
}

export interface FinanceMetric {
  value: number;
  trendPct: number | null;
}

export interface FinanceOverviewMetrics {
  totalInvoiced: FinanceMetric;
  cashCollected: FinanceMetric;
  outstandingReceivables: FinanceMetric;
  committedPayables: FinanceMetric;
  projectedGrossMarginPct: FinanceMetric;
  negativeMarginRiskCount: FinanceMetric;
  overdueInvoiceCount: FinanceMetric;
  unbookedCosts: FinanceMetric;
}

export interface FinanceCashFlowPoint {
  label: string;
  inflow: number;
  outflow: number;
}

export interface FinanceCriticalAction {
  id: string;
  recordId: string;
  label: string;
  ref: string;
  type: string;
  amount: number;
  severity: 'Critical' | 'Warning';
}

export interface FinanceStudioSnapshot {
  currency: 'ZAR';
  currencySymbol: 'R';
  anchorDate: string;
  anchorMonthLabel: string;
  lastUpdatedAt: string;
  overview: FinanceOverviewMetrics;
  cashFlowProjection: FinanceCashFlowPoint[];
  criticalActions: FinanceCriticalAction[];
  receivables: FinanceRecord[];
  payables: FinanceRecord[];
  marginRecords: FinanceRecord[];
  exceptionRecords: FinanceRecord[];
}

export function formatFinanceCurrency(value: number) {
  const absolute = new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
  const sign = value < 0 ? '-' : '';
  return `${sign}R${absolute}`;
}

export function formatFinanceCompactCurrency(value: number) {
  const absolute = Math.abs(value);
  const formatter = new Intl.NumberFormat('en-ZA', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  const sign = value < 0 ? '-' : '';
  return `${sign}R${formatter.format(absolute)}`;
}

export function formatFinanceTrend(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return 'New';
  }

  if (value === 0) {
    return '0.0%';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

