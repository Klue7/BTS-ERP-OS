import express from 'express';
import { createInventoryRouter } from './inventory/router.ts';
import { startDomainEventPublisher } from './inventory/domain-events.ts';
import { getUploadsDirectory } from './uploads.ts';
import { createVendorPortalRouter } from './vendor-portal/router.ts';
import { createMarketingRouter } from './marketing/router.ts';
import { createCreativeRouter } from './creative/router.ts';
import { createFinanceRouter } from './finance/router.ts';
import { createCommsRouter } from './comms/router.ts';
import { createTenderRouter } from './tenders/router.ts';
import { createWorkflowRouter } from './workflows/router.ts';

export function createApp() {
  startDomainEventPublisher();
  const app = express();

  app.use((request, response, next) => {
    const origin = request.headers.origin;
    if (origin && /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/i.test(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
      response.setHeader('Access-Control-Allow-Credentials', 'true');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    }

    if (request.method === 'OPTIONS') {
      response.sendStatus(204);
      return;
    }

    next();
  });

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.use('/api/uploads', express.static(getUploadsDirectory()));
  app.use('/api/inventory', createInventoryRouter());
  app.use('/api/marketing', createMarketingRouter());
  app.use('/api/creative', createCreativeRouter());
  app.use('/api/finance', createFinanceRouter());
  app.use('/api/comms', createCommsRouter());
  app.use('/api/tenders', createTenderRouter());
  app.use('/api/workflows', createWorkflowRouter());
  app.use('/api/vendor-portal', createVendorPortalRouter());

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    response.status(500).json({ ok: false, error: message });
  });

  return app;
}
