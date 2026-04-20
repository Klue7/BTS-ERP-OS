import type { CommsConversationSummary, CommsCustomerSummary } from '../../comms/contracts.ts';
import type { FinanceRecord } from '../../finance/contracts.ts';
import type {
  WorkflowBlockerSummary,
  WorkflowEventSubject,
  WorkflowEventSummary,
  WorkflowEventType,
  WorkflowInstanceKind,
  WorkflowInstanceSummary,
  WorkflowMapSnapshot,
  WorkflowStage,
  WorkflowStageState,
  WorkflowStageSummary,
} from '../../workflows/contracts.ts';
import { getCommsStudioSnapshot } from '../comms/service.ts';
import { getFinanceStudioSnapshot } from '../finance/service.ts';
import { prisma } from '../../../prisma/client.ts';

const STAGE_ORDER: WorkflowStage[] = [
  'Inbound',
  'Qualified',
  'Quoted',
  'AcceptedPaid',
  'SupplierPO',
  'SupplierConfirmed',
  'CollectionScheduled',
  'InTransit',
  'Delivered',
  'PodReceived',
  'InvoiceIssued',
  'PaidClosed',
  'Retention',
];

function timestamp(value?: string | null) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function persistedEventSubject(event: {
  conversationId: string | null;
  customerKey: string | null;
  quoteId: string | null;
  salesOrderId: string | null;
  purchaseOrderId: string | null;
  logisticsId: string | null;
  invoiceId: string | null;
  supplierKey: string | null;
  productId: string | null;
}): WorkflowEventSubject {
  return {
    conversationId: event.conversationId,
    customerKey: event.customerKey,
    quoteId: event.quoteId,
    salesOrderId: event.salesOrderId,
    purchaseOrderId: event.purchaseOrderId,
    logisticsId: event.logisticsId,
    invoiceId: event.invoiceId,
    supplierKey: event.supplierKey,
    productId: event.productId,
  };
}

function persistedEventToSummary(event: {
  id: string;
  workflowId: string;
  type: string;
  label: string;
  sourceModule: string;
  occurredAt: Date;
  amountZar: unknown;
  statusFrom: string | null;
  statusTo: string | null;
  conversationId: string | null;
  customerKey: string | null;
  quoteId: string | null;
  salesOrderId: string | null;
  purchaseOrderId: string | null;
  logisticsId: string | null;
  invoiceId: string | null;
  supplierKey: string | null;
  productId: string | null;
}): WorkflowEventSummary {
  return {
    id: event.id,
    workflowId: event.workflowId,
    type: event.type as WorkflowEventType,
    label: event.label,
    occurredAt: event.occurredAt.toISOString(),
    sourceModule: event.sourceModule as WorkflowEventSummary['sourceModule'],
    subject: persistedEventSubject(event),
    amountZar: event.amountZar === null || event.amountZar === undefined ? null : Number(event.amountZar),
    statusFrom: event.statusFrom,
    statusTo: event.statusTo,
  };
}

function stageRank(stage: WorkflowStage) {
  return STAGE_ORDER.indexOf(stage);
}

function workflowStageFromRecord(record: FinanceRecord): WorkflowStage {
  if (record.category === 'Quote' || record.workflowNode?.startsWith('quote.')) {
    return record.status === 'Paid' ? 'AcceptedPaid' : 'Quoted';
  }

  if (record.category === 'Sales Order' || record.workflowNode?.startsWith('sales_order.')) {
    return 'AcceptedPaid';
  }

  if (record.category === 'PO' || record.workflowNode?.startsWith('purchase_order.')) {
    return record.status === 'Committed' || record.status === 'Paid' ? 'SupplierConfirmed' : 'SupplierPO';
  }

  if (record.category === 'Logistics' || record.workflowNode?.startsWith('logistics.')) {
    return record.status === 'Delivered' ? 'Delivered' : 'CollectionScheduled';
  }

  if (record.category === 'Invoice' || record.workflowNode?.startsWith('invoice.') || record.workflowNode?.startsWith('payment.')) {
    return record.status === 'Paid' ? 'PaidClosed' : 'InvoiceIssued';
  }

  return 'Qualified';
}

function eventTypeForRecord(record: FinanceRecord): WorkflowEventType {
  if (record.category === 'Quote' || record.workflowNode?.startsWith('quote.')) {
    return record.status === 'Paid' ? 'quote.paid' : 'quote.issued';
  }

  if (record.category === 'Sales Order' || record.workflowNode?.startsWith('sales_order.')) {
    return 'sales_order.created';
  }

  if (record.category === 'PO' || record.workflowNode?.startsWith('purchase_order.')) {
    return record.status === 'Committed' || record.status === 'Paid' ? 'purchase_order.confirmed' : 'purchase_order.created';
  }

  if (record.category === 'Logistics' || record.workflowNode?.startsWith('logistics.')) {
    return record.status === 'Delivered' ? 'delivery.in_progress' : 'logistics.quote_created';
  }

  if (record.category === 'Invoice' || record.workflowNode?.startsWith('invoice.')) {
    return record.status === 'Paid' ? 'payment.applied' : 'invoice.issued';
  }

  if (record.workflowNode?.startsWith('payment.')) {
    return 'payment.applied';
  }

  return 'workflow.updated';
}

function eventSubjectForRecord(record: FinanceRecord): WorkflowEventSubject {
  return {
    customerKey: record.customerKey ?? null,
    quoteId: record.category === 'Quote' ? record.id : null,
    salesOrderId: record.category === 'Sales Order' ? record.id : null,
    purchaseOrderId: record.category === 'PO' ? record.id : null,
    logisticsId: record.category === 'Logistics' ? record.id : null,
    invoiceId: record.category === 'Invoice' ? record.id : null,
    supplierKey: record.supplierKey ?? null,
    productId: record.productId ?? null,
  };
}

function buildRecordEvent(workflowId: string, record: FinanceRecord): WorkflowEventSummary {
  const historyEvent = record.history[0];
  return {
    id: `${workflowId}:${record.id}:${eventTypeForRecord(record)}`,
    workflowId,
    type: eventTypeForRecord(record),
    label: historyEvent?.action ?? `${record.category} ${record.sourceDocumentKey ?? record.id} is ${record.status}.`,
    occurredAt: historyEvent?.date ?? `${record.issueDate}T00:00:00.000Z`,
    sourceModule: record.category === 'Logistics' ? 'Logistics' : record.type === 'Payable' ? 'Suppliers' : 'Finance',
    subject: eventSubjectForRecord(record),
    amountZar: record.amount,
    statusFrom: null,
    statusTo: record.status,
  };
}

function buildConversationEvent(workflowId: string, conversation: CommsConversationSummary): WorkflowEventSummary {
  return {
    id: `${workflowId}:${conversation.id}:conversation.received`,
    workflowId,
    type: 'conversation.received',
    label: `${conversation.provider} intake from ${conversation.customerName}: ${conversation.lastMessage ?? conversation.subject ?? 'Conversation updated.'}`,
    occurredAt: conversation.lastMessageAt,
    sourceModule: 'Comms',
    subject: {
      conversationId: conversation.id,
      customerKey: conversation.linkedCustomer?.customerKey ?? null,
    },
    amountZar: null,
    statusFrom: null,
    statusTo: conversation.status,
  };
}

function stageStateFor(input: {
  stage: WorkflowStage;
  currentStage: WorkflowStage;
  record?: FinanceRecord | null;
  hasConversation: boolean;
  hasCustomer: boolean;
  isBlocked: boolean;
}): WorkflowStageState {
  if (input.record) {
    return input.isBlocked ? 'Blocked' : stageRank(input.stage) === stageRank(input.currentStage) ? 'Active' : 'Complete';
  }

  if (input.stage === 'Inbound' && input.hasConversation) {
    return stageRank(input.currentStage) === 0 ? 'Active' : 'Complete';
  }

  if (input.stage === 'Qualified' && input.hasCustomer) {
    return stageRank(input.currentStage) <= 1 ? 'Active' : 'Complete';
  }

  return stageRank(input.stage) < stageRank(input.currentStage) ? 'Skipped' : 'Pending';
}

function buildBlockers(input: {
  workflowId: string;
  customer?: CommsCustomerSummary | null;
  quoteRecord?: FinanceRecord | null;
  salesOrderRecord?: FinanceRecord | null;
  purchaseOrderRecord?: FinanceRecord | null;
  logisticsRecord?: FinanceRecord | null;
  invoiceRecord?: FinanceRecord | null;
  allRecords: FinanceRecord[];
}): WorkflowBlockerSummary[] {
  const blockers: WorkflowBlockerSummary[] = [];

  for (const blocker of input.customer?.blockers ?? []) {
    blockers.push({
      id: `${input.workflowId}:readiness:${blocker}`,
      stage: 'Qualified',
      label: blocker,
      severity: 'Warning',
      sourceModule: 'CRM',
      sourceRecordId: input.customer.customerKey,
    });
  }

  if (input.salesOrderRecord && !input.purchaseOrderRecord) {
    blockers.push({
      id: `${input.workflowId}:supplier-po-missing`,
      stage: 'SupplierPO',
      label: 'Sales order exists but no supplier purchase order is linked yet.',
      severity: 'Critical',
      sourceModule: 'Suppliers',
      sourceRecordId: input.salesOrderRecord.id,
    });
  }

  if (input.purchaseOrderRecord && !input.logisticsRecord) {
    blockers.push({
      id: `${input.workflowId}:transport-missing`,
      stage: 'CollectionScheduled',
      label: 'Supplier PO exists but transport or collection has not been scheduled.',
      severity: 'Warning',
      sourceModule: 'Logistics',
      sourceRecordId: input.purchaseOrderRecord.id,
    });
  }

  if (input.logisticsRecord && !input.invoiceRecord) {
    blockers.push({
      id: `${input.workflowId}:invoice-missing`,
      stage: 'InvoiceIssued',
      label: 'Delivery/logistics state exists but invoice closeout is still pending.',
      severity: 'Info',
      sourceModule: 'Finance',
      sourceRecordId: input.logisticsRecord.id,
    });
  }

  for (const record of input.allRecords) {
    for (const exception of record.exceptions ?? []) {
      blockers.push({
        id: `${input.workflowId}:exception:${record.id}:${exception}`,
        stage: workflowStageFromRecord(record),
        label: exception,
        severity: record.margin?.status === 'Negative' || record.status === 'Overdue' ? 'Critical' : 'Warning',
        sourceModule: 'Finance',
        sourceRecordId: record.id,
      });
    }
  }

  return blockers;
}

function buildStages(input: {
  currentStage: WorkflowStage;
  blockers: WorkflowBlockerSummary[];
  conversation?: CommsConversationSummary | null;
  customer?: CommsCustomerSummary | null;
  quoteRecord?: FinanceRecord | null;
  salesOrderRecord?: FinanceRecord | null;
  purchaseOrderRecord?: FinanceRecord | null;
  logisticsRecord?: FinanceRecord | null;
  invoiceRecord?: FinanceRecord | null;
}): WorkflowStageSummary[] {
  const recordByStage = new Map<WorkflowStage, FinanceRecord | null>([
    ['Quoted', input.quoteRecord ?? null],
    ['AcceptedPaid', input.salesOrderRecord ?? (input.quoteRecord?.status === 'Paid' ? input.quoteRecord : null) ?? null],
    ['SupplierPO', input.purchaseOrderRecord ?? null],
    ['SupplierConfirmed', input.purchaseOrderRecord?.status === 'Committed' ? input.purchaseOrderRecord : null],
    ['CollectionScheduled', input.logisticsRecord ?? null],
    ['Delivered', input.logisticsRecord?.status === 'Delivered' ? input.logisticsRecord : null],
    ['InvoiceIssued', input.invoiceRecord ?? null],
    ['PaidClosed', input.invoiceRecord?.status === 'Paid' ? input.invoiceRecord : null],
  ]);

  return STAGE_ORDER.map((stage) => {
    const record = recordByStage.get(stage) ?? null;
    const isBlocked = input.blockers.some((blocker) => blocker.stage === stage);
    return {
      stage,
      state: stageStateFor({
        stage,
        currentStage: input.currentStage,
        record,
        hasConversation: Boolean(input.conversation),
        hasCustomer: Boolean(input.customer),
        isBlocked,
      }),
      sourceRecordId: record?.id ?? (stage === 'Inbound' ? input.conversation?.id : stage === 'Qualified' ? input.customer?.customerKey : null) ?? null,
      label: record?.sourceDocumentKey ?? record?.id ?? null,
    };
  });
}

function currentStageFrom(input: {
  conversation?: CommsConversationSummary | null;
  customer?: CommsCustomerSummary | null;
  records: FinanceRecord[];
}) {
  let currentStage: WorkflowStage = input.conversation ? 'Inbound' : input.customer ? 'Qualified' : 'Inbound';

  for (const record of input.records) {
    const candidate = workflowStageFromRecord(record);
    if (stageRank(candidate) > stageRank(currentStage)) {
      currentStage = candidate;
    }
  }

  return currentStage;
}

export async function getWorkflowMapSnapshot(): Promise<WorkflowMapSnapshot> {
  const [finance, comms, persistedEvents] = await Promise.all([
    getFinanceStudioSnapshot(),
    getCommsStudioSnapshot(),
    prisma.workflowEvent.findMany({
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      take: 500,
    }),
  ]);
  const records = [...finance.receivables, ...finance.payables];
  const conversations = comms.conversations;
  const customers = comms.crm.customers;
  const persistedEventSummaries = persistedEvents.map(persistedEventToSummary);
  const persistedEventsByWorkflow = new Map<string, WorkflowEventSummary[]>();
  const recordWorkflowIdByDocumentKey = new Map<string, string>();
  const conversationWorkflowIdById = new Map<string, string>();
  for (const event of persistedEvents) {
    const existing = persistedEventsByWorkflow.get(event.workflowId) ?? [];
    existing.push(persistedEventToSummary(event));
    persistedEventsByWorkflow.set(event.workflowId, existing);

    [
      event.quoteId,
      event.salesOrderId,
      event.purchaseOrderId,
      event.logisticsId,
      event.invoiceId,
      event.sourceRecordId,
    ].filter((value): value is string => Boolean(value)).forEach((documentKey) => {
      recordWorkflowIdByDocumentKey.set(documentKey, event.workflowId);
    });

    if (event.conversationId) {
      conversationWorkflowIdById.set(event.conversationId, event.workflowId);
    }
  }
  const groups = new Map<string, {
    id: string;
    sourceKey: string;
    records: FinanceRecord[];
    customerKey?: string | null;
    customerName?: string | null;
  }>();

  for (const event of persistedEvents) {
    const group = groups.get(event.workflowId) ?? {
      id: event.workflowId,
      sourceKey: event.workflowId,
      records: [],
      customerKey: event.customerKey,
      customerName: null,
    };
    group.customerKey = group.customerKey ?? event.customerKey;
    groups.set(event.workflowId, group);
  }

  for (const record of records) {
    const sourceKey = record.orderId || record.customerKey || record.customerName || record.id;
    const id = recordWorkflowIdByDocumentKey.get(record.id) ?? (record.orderId ? `order:${record.orderId}` : record.customerKey ? `customer:${record.customerKey}` : `record:${record.id}`);
    const group = groups.get(id) ?? {
      id,
      sourceKey,
      records: [],
      customerKey: record.customerKey,
      customerName: record.customerName,
    };
    group.records.push(record);
    group.customerKey = group.customerKey ?? record.customerKey;
    group.customerName = group.customerName ?? record.customerName;
    group.sourceKey = group.sourceKey === id ? sourceKey : group.sourceKey;
    groups.set(id, group);
  }

  for (const customer of customers) {
    if (groups.has(`customer:${customer.customerKey}`)) {
      continue;
    }

    if (customer.linkedQuotes === 0 && customer.linkedOrders === 0 && customer.stage === 'Lead') {
      continue;
    }

    groups.set(`customer:${customer.customerKey}`, {
      id: `customer:${customer.customerKey}`,
      sourceKey: customer.customerKey,
      records: [],
      customerKey: customer.customerKey,
      customerName: customer.name,
    });
  }

  for (const conversation of conversations) {
    const customerKey = conversation.linkedCustomer?.customerKey ?? null;
    if (customerKey && groups.has(`customer:${customerKey}`)) {
      continue;
    }

    const existingWorkflowId = conversationWorkflowIdById.get(conversation.id);
    if (existingWorkflowId) {
      const group = groups.get(existingWorkflowId) ?? {
        id: existingWorkflowId,
        sourceKey: conversation.conversationKey,
        records: [],
        customerKey,
        customerName: conversation.customerName,
      };
      group.customerKey = group.customerKey ?? customerKey;
      group.customerName = group.customerName ?? conversation.customerName;
      groups.set(existingWorkflowId, group);
      continue;
    }

    if (conversation.unreadCount <= 0 && conversation.category !== 'Lead' && conversation.category !== 'Quote') {
      continue;
    }

    groups.set(`conversation:${conversation.id}`, {
      id: `conversation:${conversation.id}`,
      sourceKey: conversation.conversationKey,
      records: [],
      customerKey,
      customerName: conversation.customerName,
    });
  }

  const instances: WorkflowInstanceSummary[] = Array.from(groups.values()).map((group) => {
    const conversation = conversations.find((entry) => (
      entry.linkedCustomer?.customerKey === group.customerKey
      || entry.customerName === group.customerName
      || entry.conversationKey === group.sourceKey
    )) ?? null;
    const customer = customers.find((entry) => (
      entry.customerKey === group.customerKey
      || entry.name === group.customerName
    )) ?? null;
    const quoteRecord = group.records.find((record) => record.category === 'Quote' || record.workflowNode?.startsWith('quote.')) ?? null;
    const salesOrderRecord = group.records.find((record) => record.category === 'Sales Order' || record.workflowNode?.startsWith('sales_order.')) ?? null;
    const purchaseOrderRecord = group.records.find((record) => record.category === 'PO' || record.workflowNode?.startsWith('purchase_order.')) ?? null;
    const logisticsRecord = group.records.find((record) => record.category === 'Logistics' || record.workflowNode?.startsWith('logistics.')) ?? null;
    const invoiceRecord = group.records.find((record) => record.category === 'Invoice' || record.workflowNode?.startsWith('invoice.') || record.workflowNode?.startsWith('payment.')) ?? null;
    const currentStage = currentStageFrom({ conversation, customer, records: group.records });
    const blockers = buildBlockers({
      workflowId: group.id,
      customer,
      quoteRecord,
      salesOrderRecord,
      purchaseOrderRecord,
      logisticsRecord,
      invoiceRecord,
      allRecords: group.records,
    });
    const reconstructedEvents = [
      conversation ? buildConversationEvent(group.id, conversation) : null,
      ...group.records.map((record) => buildRecordEvent(group.id, record)),
    ].filter((entry): entry is WorkflowEventSummary => entry !== null);
    const persistedWorkflowEvents = persistedEventsByWorkflow.get(group.id) ?? [];
    const sourceEvents = persistedWorkflowEvents.length ? persistedWorkflowEvents : reconstructedEvents;
    const events = [
      ...sourceEvents,
      ...blockers.map((blocker) => ({
        id: `${blocker.id}:event`,
        workflowId: group.id,
        type: 'workflow.blocked' as const,
        label: blocker.label,
        occurredAt: new Date().toISOString(),
        sourceModule: blocker.sourceModule,
        subject: {
          customerKey: group.customerKey ?? null,
        },
        amountZar: null,
        statusFrom: null,
        statusTo: 'Blocked',
      })),
    ].sort((left, right) => timestamp(right.occurredAt) - timestamp(left.occurredAt));
    const amount = Math.max(...group.records.map((record) => record.amount), 0);
    const kind: WorkflowInstanceKind = salesOrderRecord || invoiceRecord
      ? 'Order'
      : quoteRecord
        ? 'Quote'
        : conversation
          ? 'Conversation'
          : 'Lead';
    const path = [
      conversation ? 'Intake' : null,
      customer ? 'CRM' : null,
      quoteRecord ? 'Quote' : null,
      salesOrderRecord ? 'Order' : null,
      purchaseOrderRecord ? 'PO' : null,
      logisticsRecord ? 'Transport' : null,
      invoiceRecord ? 'Invoice' : null,
    ].filter(Boolean).join(' -> ') || currentStage;
    const primaryFinanceRecord = invoiceRecord ?? logisticsRecord ?? purchaseOrderRecord ?? salesOrderRecord ?? quoteRecord ?? group.records[0] ?? null;
    const updatedAt = events[0]?.occurredAt ?? finance.lastUpdatedAt ?? comms.lastUpdatedAt;

    return {
      id: group.id,
      kind,
      reference: primaryFinanceRecord?.orderId ?? primaryFinanceRecord?.sourceDocumentKey ?? group.sourceKey,
      label: `${primaryFinanceRecord?.orderId ?? primaryFinanceRecord?.sourceDocumentKey ?? group.sourceKey} / ${group.customerName ?? conversation?.customerName ?? 'Workflow'}`,
      detail: amount > 0 ? `${path} / R${new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(amount)}` : path,
      status: blockers.some((blocker) => blocker.severity === 'Critical') ? 'Blocked' : currentStage,
      currentStage,
      amountZar: amount,
      customerKey: group.customerKey ?? customer?.customerKey ?? null,
      customerName: group.customerName ?? customer?.name ?? conversation?.customerName ?? null,
      conversationId: conversation?.id ?? null,
      provider: conversation?.provider ?? customer?.firstTouchProvider ?? null,
      supplierKey: purchaseOrderRecord?.supplierKey ?? null,
      supplierName: purchaseOrderRecord?.supplierName ?? null,
      transportSupplierKey: logisticsRecord?.supplierKey ?? null,
      financeRecordId: primaryFinanceRecord?.id ?? null,
      recordIds: group.records.map((record) => record.id),
      sourceKey: group.sourceKey,
      events,
      blockers,
      stages: buildStages({
        currentStage,
        blockers,
        conversation,
        customer,
        quoteRecord,
        salesOrderRecord,
        purchaseOrderRecord,
        logisticsRecord,
        invoiceRecord,
      }),
      updatedAt,
    };
  });

  const sortedInstances = instances.sort((left, right) => timestamp(right.updatedAt) - timestamp(left.updatedAt));
  const events = (persistedEventSummaries.length ? persistedEventSummaries : sortedInstances.flatMap((instance) => instance.events))
    .sort((left, right) => timestamp(right.occurredAt) - timestamp(left.occurredAt));

  return {
    generatedAt: new Date().toISOString(),
    instances: sortedInstances,
    events: events.slice(0, 80),
    blockers: sortedInstances.flatMap((instance) => instance.blockers),
  };
}
