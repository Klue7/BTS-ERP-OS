import { Router } from 'express';
import { getWorkflowMapSnapshot } from './service.ts';

export function createWorkflowRouter() {
  const router = Router();

  router.get('/map', async (_request, response, next) => {
    try {
      response.json(await getWorkflowMapSnapshot());
    } catch (error) {
      next(error);
    }
  });

  return router;
}
