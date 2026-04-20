import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../../prisma/client.ts';
import type { WorkflowEventSubject, WorkflowEventSummary, WorkflowEventType } from '../../workflows/contracts.ts';

type DbClient = typeof prisma | Prisma.TransactionClient;

export interface RecordWorkflowEventInput {
  eventKey: string;
  workflowId: string;
  type: WorkflowEventType;
  label: string;
  sourceModule: WorkflowEventSummary['sourceModule'];
  occurredAt?: Date;
  subject: WorkflowEventSubject;
  amountZar?: number | null;
  statusFrom?: string | null;
  statusTo?: string | null;
  payload?: Prisma.InputJsonValue | null;
  sourceRecordId?: string | null;
}

function subjectToJson(subject: WorkflowEventSubject): Prisma.InputJsonValue {
  return {
    conversationId: subject.conversationId ?? null,
    customerKey: subject.customerKey ?? null,
    quoteId: subject.quoteId ?? null,
    salesOrderId: subject.salesOrderId ?? null,
    purchaseOrderId: subject.purchaseOrderId ?? null,
    logisticsId: subject.logisticsId ?? null,
    invoiceId: subject.invoiceId ?? null,
    supplierKey: subject.supplierKey ?? null,
    productId: subject.productId ?? null,
  };
}

export async function recordWorkflowEvent(input: RecordWorkflowEventInput, client: DbClient = prisma) {
  const occurredAt = input.occurredAt ?? new Date();
  const subject = subjectToJson(input.subject);

  await client.workflowEvent.upsert({
    where: { eventKey: input.eventKey },
    create: {
      eventKey: input.eventKey,
      workflowId: input.workflowId,
      type: input.type,
      label: input.label,
      sourceModule: input.sourceModule,
      occurredAt,
      customerKey: input.subject.customerKey ?? null,
      conversationId: input.subject.conversationId ?? null,
      quoteId: input.subject.quoteId ?? null,
      salesOrderId: input.subject.salesOrderId ?? null,
      purchaseOrderId: input.subject.purchaseOrderId ?? null,
      logisticsId: input.subject.logisticsId ?? null,
      invoiceId: input.subject.invoiceId ?? null,
      supplierKey: input.subject.supplierKey ?? null,
      productId: input.subject.productId ?? null,
      sourceRecordId: input.sourceRecordId ?? null,
      amountZar: input.amountZar ?? null,
      statusFrom: input.statusFrom ?? null,
      statusTo: input.statusTo ?? null,
      subject,
      payload: input.payload ?? undefined,
    },
    update: {
      label: input.label,
      sourceModule: input.sourceModule,
      occurredAt,
      customerKey: input.subject.customerKey ?? null,
      conversationId: input.subject.conversationId ?? null,
      quoteId: input.subject.quoteId ?? null,
      salesOrderId: input.subject.salesOrderId ?? null,
      purchaseOrderId: input.subject.purchaseOrderId ?? null,
      logisticsId: input.subject.logisticsId ?? null,
      invoiceId: input.subject.invoiceId ?? null,
      supplierKey: input.subject.supplierKey ?? null,
      productId: input.subject.productId ?? null,
      sourceRecordId: input.sourceRecordId ?? null,
      amountZar: input.amountZar ?? null,
      statusFrom: input.statusFrom ?? null,
      statusTo: input.statusTo ?? null,
      subject,
      payload: input.payload ?? undefined,
    },
  });
}
