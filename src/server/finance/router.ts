import { Router } from 'express';
import { subscribeToInventoryEvents } from '../inventory/events.ts';
import { getFinanceStudioSnapshot } from './service.ts';

export function createFinanceRouter() {
  const router = Router();

  router.get('/studio', async (_request, response, next) => {
    try {
      response.json(await getFinanceStudioSnapshot());
    } catch (error) {
      next(error);
    }
  });

  router.get('/events', (request, response) => {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    response.write(`data: ${JSON.stringify({ type: 'dashboard.updated', occurredAt: new Date().toISOString() })}\n\n`);

    const unsubscribe = subscribeToInventoryEvents((event) => {
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    const heartbeat = setInterval(() => {
      response.write(`: keepalive ${Date.now()}\n\n`);
    }, 15000);

    request.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      response.end();
    });
  });

  return router;
}

