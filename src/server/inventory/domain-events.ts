import type { Prisma, PrismaClient } from '../../../generated/prisma/client.ts';
import { prisma } from '../../../prisma/client.ts';
import { emitInventoryEvent, type InventoryServerEventType } from './events.ts';

type DbClient = PrismaClient | Prisma.TransactionClient;

export type DomainEventName =
  | 'product.created'
  | 'product.updated'
  | 'product.published'
  | 'product.asset_attached'
  | 'supplier.created'
  | 'supplier.updated'
  | 'supplier.deleted'
  | 'supplier.contact_created'
  | 'supplier.document_uploaded'
  | 'product.vendor_linked'
  | 'stock.updated'
  | 'price_list_import.applied'
  | 'logistics.quote_created'
  | 'quote.issued'
  | 'quote.paid'
  | 'purchase_order.created'
  | 'purchase_order.sent'
  | 'delivery_note.created'
  | 'transport_job.created'
  | 'dispatch.confirmed'
  | 'pod.received'
  | 'supplier_invoice.received'
  | 'payment.applied';

interface DomainEventInput {
  type: DomainEventName;
  aggregateType: 'SUPPLIER' | 'PRODUCT' | 'PURCHASE_ORDER' | 'STOCK_MOVEMENT' | 'PRICE_LIST_IMPORT' | 'LOGISTICS_QUOTE' | 'TRANSPORT_JOB' | 'PAYMENT' | 'SYSTEM';
  aggregateId: string;
  supplierId?: string;
  productId?: string;
  payload?: Prisma.InputJsonValue;
  occurredAt?: Date;
}

const domainEventTypeKeys: Record<DomainEventName, string> = {
  'product.created': 'PRODUCT_CREATED',
  'product.updated': 'PRODUCT_UPDATED',
  'product.published': 'PRODUCT_PUBLISHED',
  'product.asset_attached': 'PRODUCT_ASSET_ATTACHED',
  'supplier.created': 'SUPPLIER_CREATED',
  'supplier.updated': 'SUPPLIER_UPDATED',
  'supplier.deleted': 'SUPPLIER_DELETED',
  'supplier.contact_created': 'SUPPLIER_CONTACT_CREATED',
  'supplier.document_uploaded': 'SUPPLIER_DOCUMENT_UPLOADED',
  'product.vendor_linked': 'PRODUCT_VENDOR_LINKED',
  'stock.updated': 'STOCK_UPDATED',
  'price_list_import.applied': 'PRICE_LIST_IMPORT_APPLIED',
  'logistics.quote_created': 'LOGISTICS_QUOTE_CREATED',
  'quote.issued': 'QUOTE_ISSUED',
  'quote.paid': 'QUOTE_PAID',
  'purchase_order.created': 'PURCHASE_ORDER_CREATED',
  'purchase_order.sent': 'PURCHASE_ORDER_SENT',
  'delivery_note.created': 'DELIVERY_NOTE_CREATED',
  'transport_job.created': 'TRANSPORT_JOB_CREATED',
  'dispatch.confirmed': 'DISPATCH_CONFIRMED',
  'pod.received': 'POD_RECEIVED',
  'supplier_invoice.received': 'SUPPLIER_INVOICE_RECEIVED',
  'payment.applied': 'PAYMENT_APPLIED',
};

const serverEventTypeMap: Partial<Record<DomainEventName, InventoryServerEventType>> = {
  'product.created': 'product.created',
  'product.updated': 'product.updated',
  'product.published': 'product.published',
  'product.asset_attached': 'product.asset_attached',
  'supplier.created': 'supplier.created',
  'supplier.updated': 'supplier.updated',
  'supplier.deleted': 'supplier.deleted',
  'supplier.contact_created': 'supplier.updated',
  'supplier.document_uploaded': 'supplier.updated',
  'product.vendor_linked': 'supplier.updated',
  'stock.updated': 'stock.updated',
  'price_list_import.applied': 'price_list_import.applied',
  'logistics.quote_created': 'dashboard.updated',
  'quote.issued': 'dashboard.updated',
  'quote.paid': 'dashboard.updated',
  'purchase_order.created': 'dashboard.updated',
  'purchase_order.sent': 'dashboard.updated',
  'delivery_note.created': 'dashboard.updated',
  'transport_job.created': 'dashboard.updated',
  'dispatch.confirmed': 'dashboard.updated',
  'pod.received': 'dashboard.updated',
  'supplier_invoice.received': 'dashboard.updated',
  'payment.applied': 'dashboard.updated',
};

let publisherStarted = false;
let publishTimer: NodeJS.Timeout | null = null;
let publishInFlight = false;

export async function enqueueDomainEvent(client: DbClient, input: DomainEventInput) {
  return client.domainEventOutbox.create({
    data: {
      eventKey: `DEO_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      eventType: domainEventTypeKeys[input.type] as never,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      supplierId: input.supplierId ?? null,
      productId: input.productId ?? null,
      payload: input.payload ?? null,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

export async function publishPendingDomainEvents(limit = 100) {
  if (publishInFlight) {
    return;
  }

  publishInFlight = true;

  try {
    const pendingEvents = await prisma.domainEventOutbox.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        publishAttempts: { lt: 10 },
      },
      orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
      take: limit,
    });

    for (const event of pendingEvents) {
      try {
        const serverType = Object.entries(domainEventTypeKeys).find(([, value]) => value === event.eventType)?.[0] as DomainEventName | undefined;
        if (serverType) {
          const mapped = serverEventTypeMap[serverType];
          if (mapped) {
            emitInventoryEvent({
              type: mapped,
              entityId: event.aggregateId,
            });
          }
        }

        await prisma.domainEventOutbox.update({
          where: { id: event.id },
          data: {
            status: 'PUBLISHED',
            publishAttempts: { increment: 1 },
            publishedAt: new Date(),
            lastError: null,
          },
        });
      } catch (error) {
        await prisma.domainEventOutbox.update({
          where: { id: event.id },
          data: {
            status: 'FAILED',
            publishAttempts: { increment: 1 },
            lastError: error instanceof Error ? error.message : 'Unknown publish error',
          },
        });
      }
    }
  } finally {
    publishInFlight = false;
  }
}

export function startDomainEventPublisher() {
  if (publisherStarted) {
    return;
  }

  publisherStarted = true;
  void publishPendingDomainEvents();
  publishTimer = setInterval(() => {
    void publishPendingDomainEvents();
  }, 3000);
}

export function stopDomainEventPublisher() {
  if (publishTimer) {
    clearInterval(publishTimer);
    publishTimer = null;
  }
  publisherStarted = false;
}
