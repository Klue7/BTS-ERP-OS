import multer from 'multer';
import { Router } from 'express';
import type {
  AssignCommsConversationInput,
  CommsWorkflowActionInput,
  CreateCommsCustomerInput,
  InboundCommsMessageInput,
  LinkCommsCustomerInput,
  SendCommsReplyInput,
} from '../../comms/contracts.ts';
import { storePublicUpload } from '../uploads.ts';
import { subscribeToCommsEvents } from './events.ts';
import {
  assignConversation,
  convertQuote,
  createManualCustomer,
  createLead,
  requestCustomerInfo,
  createSupportIssue,
  createTask,
  getCommsStudioSnapshot,
  ingestInboundMessage,
  linkCustomer,
  requestInfo,
  resolveConversation,
  sendReply,
} from './service.ts';

export function createCommsRouter() {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 25 * 1024 * 1024,
    },
  });

  router.get('/studio', async (_request, response, next) => {
    try {
      response.json(await getCommsStudioSnapshot());
    } catch (error) {
      next(error);
    }
  });

  router.get('/events', (request, response) => {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    response.write(`data: ${JSON.stringify({ type: 'comms.updated', occurredAt: new Date().toISOString() })}\n\n`);

    const unsubscribe = subscribeToCommsEvents((event) => {
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
        id: `CATT_${stored.sha256.slice(0, 12)}`,
        fileName: stored.originalFilename,
        mimeType: stored.mimeType,
        size: stored.size,
        url: stored.url,
        kind: stored.kind,
        storagePath: stored.storagePath,
        sha256: stored.sha256,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/customers', async (request, response, next) => {
    try {
      response.status(201).json(await createManualCustomer(request.body as CreateCommsCustomerInput));
    } catch (error) {
      next(error);
    }
  });

  router.post('/customers/:id/request-info', async (request, response, next) => {
    try {
      response.json(await requestCustomerInfo(request.params.id, request.body as CommsWorkflowActionInput));
    } catch (error) {
      next(error);
    }
  });

  router.post('/conversations/:id/reply', async (request, response, next) => {
    try {
      response.json(await sendReply(request.params.id, request.body as SendCommsReplyInput));
    } catch (error) {
      next(error);
    }
  });

  router.post('/conversations/:id/resolve', async (request, response, next) => {
    try {
      response.json(await resolveConversation(request.params.id, request.body as CommsWorkflowActionInput));
    } catch (error) {
      next(error);
    }
  });

  router.post('/conversations/:id/assign', async (request, response, next) => {
    try {
      response.json(await assignConversation(request.params.id, request.body as AssignCommsConversationInput));
    } catch (error) {
      next(error);
    }
  });

  router.post('/conversations/:id/link-customer', async (request, response, next) => {
    try {
      response.json(await linkCustomer(request.params.id, request.body as LinkCommsCustomerInput));
    } catch (error) {
      next(error);
    }
  });

  router.post('/conversations/:id/create-lead', async (request, response, next) => {
    try {
      response.json(await createLead(request.params.id, request.body as CommsWorkflowActionInput));
    } catch (error) {
      next(error);
    }
  });

  router.post('/conversations/:id/request-info', async (request, response, next) => {
    try {
      response.json(await requestInfo(request.params.id, request.body as CommsWorkflowActionInput));
    } catch (error) {
      next(error);
    }
  });

  router.post('/conversations/:id/create-task', async (request, response, next) => {
    try {
      response.json(await createTask(request.params.id, request.body as CommsWorkflowActionInput));
    } catch (error) {
      next(error);
    }
  });

  router.post('/conversations/:id/support-issue', async (request, response, next) => {
    try {
      response.json(await createSupportIssue(request.params.id, request.body as CommsWorkflowActionInput));
    } catch (error) {
      next(error);
    }
  });

  router.post('/conversations/:id/convert-quote', async (request, response, next) => {
    try {
      response.json(await convertQuote(request.params.id, request.body as CommsWorkflowActionInput));
    } catch (error) {
      next(error);
    }
  });

  router.post('/inbound/:provider', async (request, response, next) => {
    try {
      response.json(await ingestInboundMessage(request.params.provider, request.body as InboundCommsMessageInput));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
