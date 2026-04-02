import express from 'express';
import { createInventoryRouter } from './inventory/router.ts';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.use('/api/inventory', createInventoryRouter());

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    response.status(500).json({ ok: false, error: message });
  });

  return app;
}
