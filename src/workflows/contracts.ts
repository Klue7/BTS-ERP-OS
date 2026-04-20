import type { CommsProvider } from '../comms/contracts';

export type WorkflowInstanceKind = 'Lead' | 'Quote' | 'Order' | 'Tender' | 'Conversation';

export type WorkflowStage =
  | 'Inbound'
  | 'Qualified'
  | 'Quoted'
  | 'AcceptedPaid'
  | 'SupplierPO'
  | 'SupplierConfirmed'
  | 'CollectionScheduled'
  | 'InTransit'
  | 'Delivered'
  | 'PodReceived'
  | 'InvoiceIssued'
  | 'PaidClosed'
  | 'Retention';

export type WorkflowStageState = 'Complete' | 'Active' | 'Blocked' | 'Pending' | 'Skipped';

export type WorkflowEventType =
  | 'conversation.received'
  | 'customer.qualified'
  | 'quote.issued'
  | 'quote.paid'
  | 'sales_order.created'
  | 'purchase_order.created'
  | 'purchase_order.confirmed'
  | 'logistics.quote_created'
  | 'delivery.in_progress'
  | 'pod.received'
  | 'invoice.issued'
  | 'payment.applied'
  | 'workflow.blocked'
  | 'workflow.updated';

export interface WorkflowEventSubject {
  conversationId?: string | null;
  customerKey?: string | null;
  quoteId?: string | null;
  salesOrderId?: string | null;
  purchaseOrderId?: string | null;
  logisticsId?: string | null;
  invoiceId?: string | null;
  supplierKey?: string | null;
  productId?: string | null;
}

export interface WorkflowEventSummary {
  id: string;
  workflowId: string;
  type: WorkflowEventType;
  label: string;
  occurredAt: string;
  sourceModule: 'Comms' | 'CRM' | 'Inventory' | 'Suppliers' | 'Logistics' | 'Finance' | 'Marketing' | 'Workflow';
  subject: WorkflowEventSubject;
  amountZar?: number | null;
  statusFrom?: string | null;
  statusTo?: string | null;
}

export interface WorkflowBlockerSummary {
  id: string;
  stage: WorkflowStage;
  label: string;
  severity: 'Info' | 'Warning' | 'Critical';
  sourceModule: WorkflowEventSummary['sourceModule'];
  sourceRecordId?: string | null;
}

export interface WorkflowStageSummary {
  stage: WorkflowStage;
  state: WorkflowStageState;
  sourceRecordId?: string | null;
  label?: string | null;
}

export interface WorkflowInstanceSummary {
  id: string;
  kind: WorkflowInstanceKind;
  reference: string;
  label: string;
  detail: string;
  status: string;
  currentStage: WorkflowStage;
  amountZar: number;
  customerKey?: string | null;
  customerName?: string | null;
  conversationId?: string | null;
  provider?: CommsProvider | null;
  supplierKey?: string | null;
  supplierName?: string | null;
  transportSupplierKey?: string | null;
  financeRecordId?: string | null;
  recordIds: string[];
  sourceKey: string;
  events: WorkflowEventSummary[];
  blockers: WorkflowBlockerSummary[];
  stages: WorkflowStageSummary[];
  updatedAt: string;
}

export interface WorkflowMapSnapshot {
  generatedAt: string;
  instances: WorkflowInstanceSummary[];
  events: WorkflowEventSummary[];
  blockers: WorkflowBlockerSummary[];
}
