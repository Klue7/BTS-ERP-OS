import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../../prisma/client.ts';
import type {
  FinanceCashFlowPoint,
  FinanceCriticalAction,
  FinanceHistoryEvent,
  FinanceLinkedDocument,
  FinanceMarginSnapshot,
  FinanceRecord,
  FinanceStudioSnapshot,
} from '../../finance/contracts.ts';

const financeDocumentArgs = {
  include: {
    customer: true,
    supplier: true,
    product: true,
    parentDocument: true,
  },
  orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
} satisfies Prisma.BusinessDocumentFindManyArgs;

type FinanceDocumentRecord = Prisma.BusinessDocumentGetPayload<typeof financeDocumentArgs>;
type FinanceSnapshotRecord = Record<string, unknown>;
type FinanceLineItem = {
  sku: string | null;
  quantity: number;
  unitPriceZar?: number;
  totalPriceZar?: number;
  unitCostZar?: number;
  totalCostZar?: number;
};

function toNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return Number(value);
}

function parseSnapshot(value: Prisma.JsonValue | null | undefined): FinanceSnapshotRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as FinanceSnapshotRecord;
}

function parseLineItems(snapshot: FinanceSnapshotRecord | null): FinanceLineItem[] {
  if (!snapshot || !Array.isArray(snapshot.lineItems)) {
    return [];
  }

  return snapshot.lineItems.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return [];
    }

    const record = item as Record<string, unknown>;
    const quantity = Number(record.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return [];
    }

    return [
      {
        sku: typeof record.sku === 'string' ? record.sku : null,
        quantity,
        unitPriceZar: Number.isFinite(Number(record.unitPriceZar)) ? Number(record.unitPriceZar) : undefined,
        totalPriceZar: Number.isFinite(Number(record.totalPriceZar)) ? Number(record.totalPriceZar) : undefined,
        unitCostZar: Number.isFinite(Number(record.unitCostZar)) ? Number(record.unitCostZar) : undefined,
        totalCostZar: Number.isFinite(Number(record.totalCostZar)) ? Number(record.totalCostZar) : undefined,
      },
    ];
  });
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function startOfUtcMonth(input: Date) {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), 1));
}

function addUtcMonths(input: Date, months: number) {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth() + months, 1));
}

function isWithinRange(date: Date, start: Date, end: Date) {
  return date.getTime() >= start.getTime() && date.getTime() < end.getTime();
}

function calculateTrendPct(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function getIsoWeek(date: Date) {
  const workingDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = workingDate.getUTCDay() || 7;
  workingDate.setUTCDate(workingDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(workingDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((workingDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function businessDocumentTypeLabel(value: FinanceDocumentRecord['documentType']) {
  switch (value) {
    case 'CUSTOMER_QUOTE':
      return 'Quote';
    case 'CUSTOMER_ORDER':
      return 'Sales Order';
    case 'CUSTOMER_INVOICE':
      return 'Invoice';
    case 'PURCHASE_ORDER':
      return 'PO';
    case 'SUPPLIER_INVOICE':
      return 'Supplier Invoice';
    case 'GOODS_RECEIPT':
      return 'Goods Receipt';
    case 'CREDIT_NOTE':
      return 'Credit';
    default:
      return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
  }
}

function financeStatusLabel(document: FinanceDocumentRecord) {
  if (document.documentType === 'PURCHASE_ORDER') {
    if (document.status === 'CONFIRMED' || document.status === 'DELIVERED') {
      return 'Committed';
    }
    if (document.status === 'OVERDUE') {
      return 'Overdue';
    }
  }

  switch (document.status) {
    case 'DRAFT':
      return 'Draft';
    case 'PENDING':
      return 'Pending';
    case 'ISSUED':
      return 'Issued';
    case 'SENT':
      return 'Issued';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'PARTIAL':
      return 'Partial';
    case 'OVERDUE':
      return 'Overdue';
    case 'PAID':
      return 'Paid';
    case 'RECEIVED':
      return 'Received';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Flagged';
    case 'EXPIRED':
      return 'Expired';
    case 'FLAGGED':
      return 'Flagged';
    default:
      return 'Pending';
  }
}

function financeTypeForDocument(documentType: FinanceDocumentRecord['documentType']) {
  switch (documentType) {
    case 'CUSTOMER_QUOTE':
    case 'CUSTOMER_ORDER':
    case 'CUSTOMER_INVOICE':
      return 'Receivable' as const;
    case 'PURCHASE_ORDER':
    case 'SUPPLIER_INVOICE':
    case 'CREDIT_NOTE':
      return 'Payable' as const;
    default:
      return null;
  }
}

function workflowNodeForDocument(document: FinanceDocumentRecord, status: string) {
  if (document.documentType === 'CUSTOMER_QUOTE') {
    return status === 'Expired' ? 'quote.expired' : 'quote.issued';
  }

  if (document.documentType === 'CUSTOMER_ORDER') {
    return status === 'Delivered' ? 'sales_order.fulfilled' : 'sales_order.confirmed';
  }

  if (document.documentType === 'CUSTOMER_INVOICE') {
    if (status === 'Paid') {
      return 'payment.applied';
    }
    if (status === 'Overdue') {
      return 'invoice.overdue';
    }
    return 'invoice.issued';
  }

  if (document.documentType === 'PURCHASE_ORDER') {
    return status === 'Overdue' ? 'purchase_order.overdue' : 'purchase_order.created';
  }

  if (document.documentType === 'SUPPLIER_INVOICE') {
    return 'supplier_invoice.received';
  }

  return null;
}

function deriveOrderId(document: FinanceDocumentRecord, linkedDocumentKeys: string[], snapshot: FinanceSnapshotRecord | null) {
  const linkedOrderKey = linkedDocumentKeys.find((value) => value.startsWith('ORD-'));
  if (linkedOrderKey) {
    return linkedOrderKey;
  }

  const triggerReference = typeof snapshot?.triggerReference === 'string' ? snapshot.triggerReference : null;
  if (triggerReference) {
    return triggerReference;
  }

  return document.documentKey;
}

function buildHistory(document: FinanceDocumentRecord, linkedDocuments: FinanceLinkedDocument[], exceptions: string[]) {
  const events: FinanceHistoryEvent[] = [
    {
      date: document.issuedAt.toISOString(),
      user: 'Workflow Engine',
      action: `${businessDocumentTypeLabel(document.documentType)} ${document.documentKey} entered finance tracking.`,
    },
  ];

  for (const linkedDocument of linkedDocuments) {
    events.push({
      date: document.issuedAt.toISOString(),
      user: 'Document Linker',
      action: `Linked ${linkedDocument.type} ${linkedDocument.key} into the finance chain.`,
    });
  }

  if (document.dueAt) {
    events.push({
      date: document.dueAt.toISOString(),
      user: 'Terms Monitor',
      action: `Due checkpoint scheduled for ${document.dueAt.toISOString().slice(0, 10)}.`,
    });
  }

  if (financeStatusLabel(document) === 'Paid') {
    events.push({
      date: document.updatedAt.toISOString(),
      user: 'Payment Engine',
      action: 'Full payment matched and receivable cleared.',
    });
  }

  if (financeStatusLabel(document) === 'Overdue') {
    events.push({
      date: document.updatedAt.toISOString(),
      user: 'Collections Monitor',
      action: 'Outstanding balance breached payment terms.',
    });
  }

  for (const exception of exceptions) {
    events.push({
      date: document.updatedAt.toISOString(),
      user: 'Risk Monitor',
      action: exception,
    });
  }

  return events.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

function buildLinkedDocuments(
  linkedDocumentKeys: string[],
  documentsByKey: Map<string, FinanceDocumentRecord>,
): FinanceLinkedDocument[] {
  return linkedDocumentKeys
    .map((key) => {
      const linked = documentsByKey.get(key);
      if (!linked) {
        return null;
      }

      return {
        key,
        title: linked.title,
        type: businessDocumentTypeLabel(linked.documentType),
        status: financeStatusLabel(linked),
        amount: toNumber(linked.totalAmount),
        pdfUrl: `/api/inventory/documents/${linked.documentKey}/pdf`,
      } satisfies FinanceLinkedDocument;
    })
    .filter((entry): entry is FinanceLinkedDocument => entry !== null);
}

function buildMarginSnapshot(input: {
  document: FinanceDocumentRecord;
  lineItems: FinanceLineItem[];
  unitCostByProductId: Map<string, number>;
  logisticsCostByProductId: Map<string, number>;
}) {
  const sellingValue = toNumber(input.document.totalAmount);
  if (sellingValue <= 0 || !input.document.product?.referenceId) {
    return null;
  }

  const quantity = input.lineItems.reduce((total, item) => total + item.quantity, 0);
  const unitCost = input.unitCostByProductId.get(input.document.product.referenceId) ?? 0;
  const productCost = Number((unitCost * (quantity || 1)).toFixed(2));
  const logisticsCost = Number((input.logisticsCostByProductId.get(input.document.product.referenceId) ?? 0).toFixed(2));
  const otherCosts = 0;
  const projectedMargin = Number((sellingValue - productCost - logisticsCost - otherCosts).toFixed(2));
  const paidAmount = Math.max(0, sellingValue - toNumber(input.document.balanceAmount));
  const realizedMargin = Number((paidAmount - productCost - logisticsCost - otherCosts).toFixed(2));
  const ratio = sellingValue === 0 ? 0 : projectedMargin / sellingValue;

  const status: FinanceMarginSnapshot['status'] =
    projectedMargin < 0 ? 'Negative' : ratio < 0.12 ? 'At Risk' : 'Healthy';

  return {
    sellingValue,
    productCost,
    logisticsCost,
    otherCosts,
    projectedMargin,
    realizedMargin,
    status,
  } satisfies FinanceMarginSnapshot;
}

function buildExceptionList(input: {
  document: FinanceDocumentRecord;
  status: string;
  category: string;
  margin: FinanceMarginSnapshot | null;
  hasSupplierInvoice: boolean;
  snapshot: FinanceSnapshotRecord | null;
}) {
  const exceptions: string[] = [];

  if (input.status === 'Overdue' && input.document.documentType === 'CUSTOMER_INVOICE') {
    exceptions.push('Overdue customer invoice');
  }

  if (input.status === 'Expired' && input.document.documentType === 'CUSTOMER_QUOTE') {
    exceptions.push('Expired quote awaiting refresh');
  }

  if (input.margin?.status === 'Negative') {
    exceptions.push('Negative margin flag');
  }

  if (input.document.documentType === 'PURCHASE_ORDER' && !input.hasSupplierInvoice) {
    exceptions.push('Unbooked supplier cost');
  }

  const snapshotNotes = parseStringArray(input.snapshot?.notes);
  for (const note of snapshotNotes) {
    if (/pending|blocker|delay|mismatch|overdue/i.test(note)) {
      exceptions.push(note);
    }
  }

  return Array.from(new Set(exceptions));
}

function scoreExceptionSeverity(record: FinanceRecord) {
  let score = 0;

  if (record.exceptions?.some((exception) => /negative margin/i.test(exception))) {
    score += 300;
  }

  if (record.status === 'Overdue') {
    score += 260;
  }

  if (record.exceptions?.some((exception) => /unbooked/i.test(exception))) {
    score += 220;
  }

  if (record.status === 'Flagged') {
    score += 200;
  }

  if (record.status === 'Expired') {
    score += 140;
  }

  return score + Math.round(record.amount / 100);
}

function buildCriticalAction(record: FinanceRecord): FinanceCriticalAction {
  const firstException = record.exceptions?.[0] ?? `${record.category} requires attention`;
  const severity: FinanceCriticalAction['severity'] =
    scoreExceptionSeverity(record) >= 260 ? 'Critical' : 'Warning';

  return {
    id: `${record.id}-action`,
    recordId: record.id,
    label: firstException,
    ref: record.orderId,
    type: record.category,
    amount: record.balance > 0 ? record.balance : record.amount,
    severity,
  };
}

export async function getFinanceStudioSnapshot(): Promise<FinanceStudioSnapshot> {
  const [documents, logisticsQuotes] = await Promise.all([
    prisma.businessDocument.findMany(financeDocumentArgs),
    prisma.logisticsQuoteSnapshot.findMany({
      include: {
        product: true,
        supplier: true,
      },
      orderBy: [{ createdAt: 'desc' }],
    }),
  ]);

  const documentsByKey = new Map(documents.map((document) => [document.documentKey, document]));
  const supplierInvoiceProductIds = new Set(
    documents
      .filter((document) => document.documentType === 'SUPPLIER_INVOICE' && document.product?.referenceId)
      .map((document) => document.product!.referenceId),
  );
  const unitCostByProductId = new Map<string, number>();
  const logisticsCostByProductId = new Map<string, number>();

  for (const document of documents) {
    if (!document.product?.referenceId) {
      continue;
    }

    const snapshot = parseSnapshot(document.snapshot);
    const lineItems = parseLineItems(snapshot);
    if (lineItems.length === 0) {
      continue;
    }

    const quantity = lineItems.reduce((total, item) => total + item.quantity, 0);
    if (quantity <= 0) {
      continue;
    }

    if (document.documentType === 'PURCHASE_ORDER' || document.documentType === 'SUPPLIER_INVOICE' || document.documentType === 'GOODS_RECEIPT') {
      const totalCost = lineItems.reduce((total, item) => total + (item.totalCostZar ?? 0), 0);
      const derivedUnitCost =
        lineItems.find((item) => item.unitCostZar !== undefined)?.unitCostZar ??
        (totalCost > 0 ? totalCost / quantity : undefined);

      if (derivedUnitCost !== undefined && !unitCostByProductId.has(document.product.referenceId)) {
        unitCostByProductId.set(document.product.referenceId, Number(derivedUnitCost.toFixed(2)));
      }
    }
  }

  for (const quote of logisticsQuotes) {
    if (!quote.product.referenceId || logisticsCostByProductId.has(quote.product.referenceId)) {
      continue;
    }

    logisticsCostByProductId.set(quote.product.referenceId, Number(toNumber(quote.logisticsCost).toFixed(2)));
  }

  const receivables: FinanceRecord[] = [];
  const payables: FinanceRecord[] = [];

  for (const document of documents) {
    const financeType = financeTypeForDocument(document.documentType);
    if (!financeType) {
      continue;
    }

    const snapshot = parseSnapshot(document.snapshot);
    const lineItems = parseLineItems(snapshot);
    const linkedDocumentKeys = parseStringArray(snapshot?.linkedDocumentKeys);
    const status = financeStatusLabel(document);
    const linkedDocuments = buildLinkedDocuments(linkedDocumentKeys, documentsByKey);
    const category = businessDocumentTypeLabel(document.documentType);
    const margin =
      financeType === 'Receivable'
        ? buildMarginSnapshot({
            document,
            lineItems,
            unitCostByProductId,
            logisticsCostByProductId,
          })
        : null;
    const exceptions = buildExceptionList({
      document,
      status,
      category,
      margin,
      hasSupplierInvoice: document.product?.referenceId ? supplierInvoiceProductIds.has(document.product.referenceId) : false,
      snapshot,
    });
    const record: FinanceRecord = {
      id: document.documentKey,
      sourceDocumentId: document.id,
      sourceDocumentKey: document.documentKey,
      orderId: deriveOrderId(document, linkedDocumentKeys, snapshot),
      customerName: document.customer?.name ?? document.supplier?.name ?? document.title,
      type: financeType,
      category,
      status,
      amount: toNumber(document.totalAmount),
      balance: toNumber(document.balanceAmount ?? document.totalAmount),
      dueDate: (document.dueAt ?? document.issuedAt).toISOString().slice(0, 10),
      issueDate: document.issuedAt.toISOString().slice(0, 10),
      currency: document.currency || 'ZAR',
      summary: typeof snapshot?.summary === 'string' ? snapshot.summary : null,
      pdfUrl: `/api/inventory/documents/${document.documentKey}/pdf`,
      customerKey: document.customer?.customerKey ?? null,
      supplierKey: document.supplier?.supplierKey ?? null,
      supplierName: document.supplier?.name ?? null,
      productId: document.product?.referenceId ?? null,
      productName: document.product?.name ?? null,
      productSku: document.product?.publicSku ?? null,
      workflowNode: workflowNodeForDocument(document, status),
      exceptions,
      margin,
      linkedDocuments,
      history: buildHistory(document, linkedDocuments, exceptions),
    };

    if (financeType === 'Receivable') {
      receivables.push(record);
    } else {
      payables.push(record);
    }
  }

  for (const quote of logisticsQuotes) {
    payables.unshift({
      id: quote.quoteKey,
      sourceDocumentKey: quote.quoteKey,
      orderId: quote.quoteKey,
      customerName: quote.supplier.name,
      type: 'Payable',
      category: 'Logistics',
      status: 'Pending',
      amount: toNumber(quote.logisticsCost),
      balance: toNumber(quote.logisticsCost),
      dueDate: quote.createdAt.toISOString().slice(0, 10),
      issueDate: quote.createdAt.toISOString().slice(0, 10),
      currency: quote.currency,
      summary: `Logistics quote for ${quote.product.name}`,
      pdfUrl: null,
      supplierKey: quote.supplier.supplierKey,
      supplierName: quote.supplier.name,
      productId: quote.product.referenceId,
      productName: quote.product.name,
      productSku: quote.product.publicSku,
      workflowNode: 'logistics.quote_created',
      exceptions: [],
      margin: null,
      linkedDocuments: [],
      history: [
        {
          date: quote.createdAt.toISOString(),
          user: 'Logistics Engine',
          action: `Logistics quote ${quote.quoteKey} calculated and held for supplier costing.`,
        },
      ],
    });
  }

  const marginRecords = receivables.filter((record) => record.margin !== null);
  const exceptionRecords = [...receivables, ...payables]
    .filter((record) => (record.exceptions?.length ?? 0) > 0 || ['Overdue', 'Flagged', 'Expired'].includes(record.status))
    .sort((left, right) => scoreExceptionSeverity(right) - scoreExceptionSeverity(left));

  const latestDate = documents[0]?.issuedAt ?? new Date();
  const anchorMonthStart = startOfUtcMonth(latestDate);
  const previousMonthStart = addUtcMonths(anchorMonthStart, -1);
  const nextMonthStart = addUtcMonths(anchorMonthStart, 1);
  const anchorMonthLabel = latestDate.toLocaleDateString('en-ZA', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const currentInvoices = receivables.filter(
    (record) => record.category === 'Invoice' && isWithinRange(new Date(`${record.issueDate}T00:00:00Z`), anchorMonthStart, nextMonthStart),
  );
  const previousInvoices = receivables.filter(
    (record) => record.category === 'Invoice' && isWithinRange(new Date(`${record.issueDate}T00:00:00Z`), previousMonthStart, anchorMonthStart),
  );

  const currentPayables = payables.filter((record) =>
    isWithinRange(new Date(`${record.issueDate}T00:00:00Z`), anchorMonthStart, nextMonthStart),
  );
  const previousPayables = payables.filter((record) =>
    isWithinRange(new Date(`${record.issueDate}T00:00:00Z`), previousMonthStart, anchorMonthStart),
  );

  const totalInvoiced = currentInvoices.reduce((total, record) => total + record.amount, 0);
  const previousTotalInvoiced = previousInvoices.reduce((total, record) => total + record.amount, 0);
  const cashCollected = currentInvoices.reduce((total, record) => total + Math.max(0, record.amount - record.balance), 0);
  const previousCashCollected = previousInvoices.reduce((total, record) => total + Math.max(0, record.amount - record.balance), 0);
  const outstandingReceivables = receivables
    .filter((record) => record.category === 'Invoice' && record.balance > 0 && record.status !== 'Paid')
    .reduce((total, record) => total + record.balance, 0);
  const previousOutstandingReceivables = previousInvoices
    .filter((record) => record.balance > 0 && record.status !== 'Paid')
    .reduce((total, record) => total + record.balance, 0);
  const committedPayables = payables
    .filter((record) => ['PO', 'Supplier Invoice', 'Logistics'].includes(record.category))
    .reduce((total, record) => total + Math.max(record.balance, record.amount), 0);
  const previousCommittedPayables = previousPayables
    .filter((record) => ['PO', 'Supplier Invoice', 'Logistics'].includes(record.category))
    .reduce((total, record) => total + Math.max(record.balance, record.amount), 0);

  const currentMarginTotal = marginRecords.reduce((total, record) => total + (record.margin?.projectedMargin ?? 0), 0);
  const currentSellingTotal = marginRecords.reduce((total, record) => total + (record.margin?.sellingValue ?? 0), 0);
  const previousMarginRecords = previousInvoices.filter((record) => record.margin !== null);
  const previousMarginTotal = previousMarginRecords.reduce((total, record) => total + (record.margin?.projectedMargin ?? 0), 0);
  const previousSellingTotal = previousMarginRecords.reduce((total, record) => total + (record.margin?.sellingValue ?? 0), 0);
  const projectedGrossMarginPct = currentSellingTotal === 0 ? 0 : Number(((currentMarginTotal / currentSellingTotal) * 100).toFixed(1));
  const previousGrossMarginPct =
    previousSellingTotal === 0 ? 0 : Number(((previousMarginTotal / previousSellingTotal) * 100).toFixed(1));

  const negativeMarginRiskCount = marginRecords.filter((record) => record.margin?.status === 'Negative').length;
  const previousNegativeMarginRiskCount = previousMarginRecords.filter((record) => record.margin?.status === 'Negative').length;
  const overdueInvoiceCount = receivables.filter((record) => record.category === 'Invoice' && record.status === 'Overdue').length;
  const previousOverdueInvoiceCount = previousInvoices.filter((record) => record.status === 'Overdue').length;
  const unbookedCosts = payables
    .filter((record) => record.exceptions?.includes('Unbooked supplier cost'))
    .reduce((total, record) => total + record.amount, 0);
  const previousUnbookedCosts = previousPayables
    .filter((record) => record.exceptions?.includes('Unbooked supplier cost'))
    .reduce((total, record) => total + record.amount, 0);

  const projectionStart = anchorMonthStart;
  const cashFlowProjection: FinanceCashFlowPoint[] = Array.from({ length: 4 }, (_value, index) => {
    const bucketStart = new Date(Date.UTC(
      projectionStart.getUTCFullYear(),
      projectionStart.getUTCMonth(),
      projectionStart.getUTCDate() + (index * 7),
    ));
    const bucketEnd = new Date(Date.UTC(
      projectionStart.getUTCFullYear(),
      projectionStart.getUTCMonth(),
      projectionStart.getUTCDate() + ((index + 1) * 7),
    ));

    const inflow = receivables
      .filter((record) => record.balance > 0 && isWithinRange(new Date(`${record.dueDate}T00:00:00Z`), bucketStart, bucketEnd))
      .reduce((total, record) => total + record.balance, 0);

    const outflow = payables
      .filter((record) => isWithinRange(new Date(`${record.dueDate}T00:00:00Z`), bucketStart, bucketEnd))
      .reduce((total, record) => total + Math.max(record.balance, record.amount), 0);

    return {
      label: `WK ${getIsoWeek(bucketStart)}`,
      inflow,
      outflow,
    };
  });

  const criticalActions = exceptionRecords.slice(0, 4).map((record) => buildCriticalAction(record));

  return {
    currency: 'ZAR',
    currencySymbol: 'R',
    anchorDate: latestDate.toISOString(),
    anchorMonthLabel,
    lastUpdatedAt: new Date().toISOString(),
    overview: {
      totalInvoiced: {
        value: totalInvoiced,
        trendPct: calculateTrendPct(totalInvoiced, previousTotalInvoiced),
      },
      cashCollected: {
        value: cashCollected,
        trendPct: calculateTrendPct(cashCollected, previousCashCollected),
      },
      outstandingReceivables: {
        value: outstandingReceivables,
        trendPct: calculateTrendPct(outstandingReceivables, previousOutstandingReceivables),
      },
      committedPayables: {
        value: committedPayables,
        trendPct: calculateTrendPct(committedPayables, previousCommittedPayables),
      },
      projectedGrossMarginPct: {
        value: projectedGrossMarginPct,
        trendPct: calculateTrendPct(projectedGrossMarginPct, previousGrossMarginPct),
      },
      negativeMarginRiskCount: {
        value: negativeMarginRiskCount,
        trendPct: calculateTrendPct(negativeMarginRiskCount, previousNegativeMarginRiskCount),
      },
      overdueInvoiceCount: {
        value: overdueInvoiceCount,
        trendPct: calculateTrendPct(overdueInvoiceCount, previousOverdueInvoiceCount),
      },
      unbookedCosts: {
        value: unbookedCosts,
        trendPct: calculateTrendPct(unbookedCosts, previousUnbookedCosts),
      },
    },
    cashFlowProjection,
    criticalActions,
    receivables,
    payables,
    marginRecords,
    exceptionRecords,
  };
}

