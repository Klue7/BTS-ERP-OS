import { EventEmitter } from 'node:events';

export type MarketingServerEventType =
  | 'dashboard.updated'
  | 'asset.created'
  | 'asset.updated'
  | 'asset.duplicated'
  | 'asset.archived'
  | 'asset.variant_created'
  | 'template.created'
  | 'template.updated'
  | 'template.restored'
  | 'campaign.created'
  | 'calendar.updated'
  | 'publishing.updated'
  | 'analytics.updated'
  | 'community.updated';

export interface MarketingServerEvent {
  type: MarketingServerEventType;
  entityId?: string;
  occurredAt: string;
}

const marketingEventBus = new EventEmitter();

marketingEventBus.setMaxListeners(100);

export function emitMarketingEvent(event: Omit<MarketingServerEvent, 'occurredAt'>) {
  const payload: MarketingServerEvent = {
    ...event,
    occurredAt: new Date().toISOString(),
  };

  marketingEventBus.emit('marketing-event', payload);
}

export function subscribeToMarketingEvents(listener: (event: MarketingServerEvent) => void) {
  marketingEventBus.on('marketing-event', listener);

  return () => {
    marketingEventBus.off('marketing-event', listener);
  };
}
