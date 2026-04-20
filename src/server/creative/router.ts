import multer from 'multer';
import { Router } from 'express';
import {
  archiveCreativeDocument,
  createAutoCaptionJob,
  createAutoLayoutJob,
  createBackgroundRemovalJob,
  createCreativeDocument,
  createCreativeExportJob,
  createCreativeLayer,
  createExpandImageJob,
  createObjectCleanupJob,
  createRoomRestyleJob,
  createRoomSegmentationJob,
  duplicateCreativeDocument,
  getCreativeAiJob,
  getCreativeDocument,
  getCreativeStudioSnapshot,
  publishCreativeDocument,
  updateCreativeDocument,
  updateCreativeLayer,
} from './service.ts';
import { storePublicUpload } from '../uploads.ts';

export function createCreativeRouter() {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  });

  router.get('/studio', async (_request, response, next) => {
    try {
      response.json(await getCreativeStudioSnapshot());
    } catch (error) {
      next(error);
    }
  });

  router.post('/uploads', upload.single('file'), (request, response, next) => {
    try {
      if (!request.file) {
        response.status(400).json({ ok: false, error: 'A file upload is required.' });
        return;
      }

      const stored = storePublicUpload({
        originalFilename: request.file.originalname,
        mimeType: request.file.mimetype,
        buffer: request.file.buffer,
      });

      response.status(201).json({
        ok: true,
        filename: stored.originalFilename,
        originalFilename: stored.originalFilename,
        storedFilename: stored.storedFilename,
        storagePath: stored.storagePath,
        mimeType: stored.mimeType,
        size: stored.size,
        sha256: stored.sha256,
        extension: stored.extension,
        kind: stored.kind,
        reuse: stored.reuse,
        url: stored.url,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/documents', async (request, response, next) => {
    try {
      response.status(201).json(await createCreativeDocument(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.get('/documents/:id', async (request, response, next) => {
    try {
      response.json(await getCreativeDocument(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.patch('/documents/:id', async (request, response, next) => {
    try {
      response.json(await updateCreativeDocument(request.params.id, request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/documents/:id/duplicate', async (request, response, next) => {
    try {
      response.status(201).json(await duplicateCreativeDocument(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/documents/:id/archive', async (request, response, next) => {
    try {
      response.json(await archiveCreativeDocument(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/documents/:id/layers', async (request, response, next) => {
    try {
      response.status(201).json(await createCreativeLayer(request.params.id, request.body));
    } catch (error) {
      next(error);
    }
  });

  router.patch('/documents/:id/layers/:layerId', async (request, response, next) => {
    try {
      response.json(await updateCreativeLayer(request.params.id, request.params.layerId, request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/jobs/background-removal', async (request, response, next) => {
    try {
      response.status(201).json(await createBackgroundRemovalJob({ ...request.body, type: 'Background Removal' }));
    } catch (error) {
      next(error);
    }
  });

  router.post('/jobs/room-segmentation', async (request, response, next) => {
    try {
      response.status(201).json(await createRoomSegmentationJob({ ...request.body, type: 'Room Segmentation' }));
    } catch (error) {
      next(error);
    }
  });

  router.post('/jobs/room-restyle', async (request, response, next) => {
    try {
      response.status(201).json(await createRoomRestyleJob({ ...request.body, type: 'Room Restyle' }));
    } catch (error) {
      next(error);
    }
  });

  router.post('/jobs/expand-image', async (request, response, next) => {
    try {
      response.status(201).json(await createExpandImageJob({ ...request.body, type: 'Image Expansion' }));
    } catch (error) {
      next(error);
    }
  });

  router.post('/jobs/auto-layout', async (request, response, next) => {
    try {
      response.status(201).json(await createAutoLayoutJob({ ...request.body, type: 'Auto Layout' }));
    } catch (error) {
      next(error);
    }
  });

  router.post('/jobs/auto-caption', async (request, response, next) => {
    try {
      response.status(201).json(await createAutoCaptionJob({ ...request.body, type: 'Auto Caption' }));
    } catch (error) {
      next(error);
    }
  });

  router.post('/jobs/object-cleanup', async (request, response, next) => {
    try {
      response.status(201).json(await createObjectCleanupJob({ ...request.body, type: 'Object Cleanup' }));
    } catch (error) {
      next(error);
    }
  });

  router.get('/jobs/:id', async (request, response, next) => {
    try {
      response.json(await getCreativeAiJob(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/documents/:id/exports', async (request, response, next) => {
    try {
      response.status(201).json(await createCreativeExportJob(request.params.id, request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/documents/:id/publish', async (request, response, next) => {
    try {
      response.json(await publishCreativeDocument(request.params.id, request.body));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
