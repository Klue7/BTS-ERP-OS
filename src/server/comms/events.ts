import { EventEmitter } from 'node:events';

export type CommsServerEventType =
  | 'comms.updated'
  | 'comms.message.received'
  | 'comms.message.sent'
  | 'comms.customer.linked'
  | 'comms.lead.created'
  | 'comms.conversation.resolved'
  | 'comms.action.created';

export interface CommsServerEvent {
  type: CommsServerEventType;
  entityId?: string;
  occurredAt: string;
}

const commsEventBus = new EventEmitter();

commsEventBus.setMaxListeners(100);

export function emitCommsEvent(event: Omit<CommsServerEvent, 'occurredAt'>) {
  const payload: CommsServerEvent = {
    ...event,
    occurredAt: new Date().toISOString(),
  };

  commsEventBus.emit('comms-event', payload);
}

export function subscribeToCommsEvents(listener: (event: CommsServerEvent) => void) {
  commsEventBus.on('comms-event', listener);

  return () => {
    commsEventBus.off('comms-event', listener);
  };
}
