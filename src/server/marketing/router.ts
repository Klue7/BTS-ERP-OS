import { Router } from 'express';
import {
  addMarketingCommunityPostComment,
  archiveMarketingTemplate,
  archiveMarketingAsset,
  createMarketingAsset,
  createMarketingAssetVariant,
  createMarketingCreativeOutput,
  createMarketingCalendarEntry,
  createMarketingCampaign,
  createMarketingContentPost,
  createMarketingRender,
  createMarketingTemplate,
  duplicateMarketingTemplate,
  duplicateMarketingAsset,
  getMarketingStudioSnapshot,
  likeMarketingCommunityPost,
  listMarketingTemplates,
  listPublishedMarketingContent,
  getPublicMarketingBlueprintSnapshot,
  refreshMarketingPublishing,
  restoreMarketingTemplate,
  updateMarketingTemplate,
  updateMarketingAsset,
} from './service.ts';
import { subscribeToMarketingEvents } from './events.ts';

export function createMarketingRouter() {
  const router = Router();

  router.get('/studio', async (_request, response, next) => {
    try {
      response.json(await getMarketingStudioSnapshot());
    } catch (error) {
      next(error);
    }
  });

  router.get('/templates', async (request, response, next) => {
    try {
      const statusQuery = String(request.query.status ?? 'active').toLowerCase();
      const status =
        statusQuery === 'archived' || statusQuery === 'all'
          ? (statusQuery as 'archived' | 'all')
          : 'active';
      response.json(await listMarketingTemplates(status));
    } catch (error) {
      next(error);
    }
  });

  router.get('/public-blueprints', async (_request, response, next) => {
    try {
      response.json(await getPublicMarketingBlueprintSnapshot());
    } catch (error) {
      next(error);
    }
  });

  router.get('/public-content', async (_request, response, next) => {
    try {
      response.json(await listPublishedMarketingContent());
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

    const unsubscribe = subscribeToMarketingEvents((event) => {
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

  router.post('/templates', async (request, response, next) => {
    try {
      response.status(201).json(await createMarketingTemplate(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.patch('/templates/:id', async (request, response, next) => {
    try {
      response.json(await updateMarketingTemplate(request.params.id, request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/templates/:id/duplicate', async (request, response, next) => {
    try {
      response.status(201).json(await duplicateMarketingTemplate(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/templates/:id/archive', async (request, response, next) => {
    try {
      response.json(await archiveMarketingTemplate(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/templates/:id/restore', async (request, response, next) => {
    try {
      response.json(await restoreMarketingTemplate(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/campaigns', async (request, response, next) => {
    try {
      response.status(201).json(await createMarketingCampaign(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/content-posts', async (request, response, next) => {
    try {
      response.status(201).json(await createMarketingContentPost(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/calendar-entries', async (request, response, next) => {
    try {
      response.status(201).json(await createMarketingCalendarEntry(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/assets', async (request, response, next) => {
    try {
      response.status(201).json(await createMarketingAsset(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/assets/:id/variants', async (request, response, next) => {
    try {
      response.status(201).json(await createMarketingAssetVariant(request.params.id, request.body));
    } catch (error) {
      next(error);
    }
  });

  router.patch('/assets/:id', async (request, response, next) => {
    try {
      response.json(await updateMarketingAsset(request.params.id, request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/assets/:id/duplicate', async (request, response, next) => {
    try {
      response.status(201).json(await duplicateMarketingAsset(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/assets/:id/archive', async (request, response, next) => {
    try {
      response.json(await archiveMarketingAsset(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/creative-renders', async (request, response, next) => {
    try {
      response.status(201).json(await createMarketingRender(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/creative-outputs', async (request, response, next) => {
    try {
      response.status(201).json(await createMarketingCreativeOutput(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/publishing/refresh', async (_request, response, next) => {
    try {
      response.json(await refreshMarketingPublishing());
    } catch (error) {
      next(error);
    }
  });

  router.post('/community-posts/:id/likes', async (request, response, next) => {
    try {
      response.json(await likeMarketingCommunityPost(request.params.id, request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/community-posts/:id/comments', async (request, response, next) => {
    try {
      response.json(await addMarketingCommunityPostComment(request.params.id, request.body));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
