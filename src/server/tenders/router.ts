import multer from 'multer';
import { Router } from 'express';
import {
  createTenderOpportunity,
  createTenderMemberResponse,
  createTenderQuoteDraft,
  createTenderSubmission,
  getTenderDeskSnapshot,
  getTenderMemberPortalSnapshot,
  importTenderSourcePack,
  promoteTenderDocumentToBoq,
  syncGovProcureTenders,
  storeTenderUpload,
  updateTenderBoqLine,
  uploadTenderBoq,
} from './service.ts';
import type { TenderMemberPortalFilters } from '../../tenders/contracts.ts';

export function createTenderRouter() {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  });

  router.get('/', async (_request, response, next) => {
    try {
      response.json(getTenderDeskSnapshot());
    } catch (error) {
      next(error);
    }
  });

  router.get('/member-opportunities', async (request, response, next) => {
    try {
      const filters: TenderMemberPortalFilters = {
        role: typeof request.query.role === 'string' ? request.query.role as TenderMemberPortalFilters['role'] : undefined,
        material: typeof request.query.material === 'string' ? request.query.material : undefined,
        location: typeof request.query.location === 'string' ? request.query.location : undefined,
        query: typeof request.query.query === 'string' ? request.query.query : undefined,
      };
      response.json(getTenderMemberPortalSnapshot(filters));
    } catch (error) {
      next(error);
    }
  });

  router.post('/member-opportunities/:id/responses', async (request, response, next) => {
    try {
      response.status(201).json(createTenderMemberResponse(request.params.id, request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/opportunities', async (request, response, next) => {
    try {
      response.status(201).json(await createTenderOpportunity(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/uploads', upload.single('file'), async (request, response, next) => {
    try {
      if (!request.file) {
        response.status(400).json({ ok: false, error: 'A tender document upload is required.' });
        return;
      }

      response.status(201).json(await storeTenderUpload(request.file, String(request.body.aiDirection ?? '')));
    } catch (error) {
      next(error);
    }
  });

  router.post('/opportunities/:id/boqs/upload', upload.single('file'), async (request, response, next) => {
    try {
      if (!request.file) {
        response.status(400).json({ ok: false, error: 'A BOQ upload is required.' });
        return;
      }

      response.status(201).json(await uploadTenderBoq(request.params.id, request.file, {
        parseMode: String(request.body.parseMode ?? 'AI Assisted') as 'AI Assisted' | 'Manual Mapping',
        aiDirection: String(request.body.aiDirection ?? ''),
      }));
    } catch (error) {
      next(error);
    }
  });

  router.post('/opportunities/:id/boqs/promote-source-document', async (request, response, next) => {
    try {
      response.status(201).json(await promoteTenderDocumentToBoq(request.params.id, request.body));
    } catch (error) {
      next(error);
    }
  });

  router.patch('/boqs/:boqId/lines/:lineId', async (request, response, next) => {
    try {
      response.json(await updateTenderBoqLine(request.params.boqId, request.params.lineId, request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/quotes', async (request, response, next) => {
    try {
      response.status(201).json(await createTenderQuoteDraft(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/submissions', async (request, response, next) => {
    try {
      response.status(201).json(await createTenderSubmission(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/sync/etenders', async (request, response, next) => {
    try {
      response.status(201).json(await syncGovProcureTenders(request.body ?? {}));
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/import-source-pack', async (request, response, next) => {
    try {
      response.status(201).json(await importTenderSourcePack(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
