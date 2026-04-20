import { EventEmitter } from 'node:events';

export type InventoryServerEventType =
  | 'dashboard.updated'
  | 'product.created'
  | 'product.updated'
  | 'product.published'
  | 'product.asset_attached'
  | 'supplier.created'
  | 'supplier.deleted'
  | 'supplier.updated'
  | 'stock.updated'
  | 'price_list_import.applied';

export interface InventoryServerEvent {
  type: InventoryServerEventType;
  entityId?: string;
  occurredAt: string;
}

const inventoryEventBus = new EventEmitter();

inventoryEventBus.setMaxListeners(100);

export function emitInventoryEvent(event: Omit<InventoryServerEvent, 'occurredAt'>) {
  const payload: InventoryServerEvent = {
    ...event,
    occurredAt: new Date().toISOString(),
  };

  inventoryEventBus.emit('inventory-event', payload);
}

export function subscribeToInventoryEvents(listener: (event: InventoryServerEvent) => void) {
  inventoryEventBus.on('inventory-event', listener);

  return () => {
    inventoryEventBus.off('inventory-event', listener);
  };
}
