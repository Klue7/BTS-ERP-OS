import multer from 'multer';
import { Router } from 'express';
import {
  applyPriceListImport,
  completeCustomerOrderWorkflow,
  createInventoryAsset,
  createInventoryProduct,
  createLogisticsQuote,
  createPriceListImport,
  createStockMovement,
  createCustomerQuoteDocument,
  createSupplierContact,
  createSupplierDocument,
  createSupplier,
  deleteSupplier,
  getInventoryBusinessDocument,
  getInventoryCustomerDocumentHistory,
  getInventorySupplier,
  getInventoryDashboard,
  getInventoryProduct,
  getInventoryProductAssets,
  linkSupplierProducts,
  listInventoryProductDetails,
  listInventoryProducts,
  listInventorySuppliers,
  markCustomerQuotePaid,
  listStockPositions,
  updateSupplier,
  updateInventoryProduct,
} from './service.ts';
import { publishPendingDomainEvents } from './domain-events.ts';
import { subscribeToInventoryEvents } from './events.ts';
import { streamBusinessDocumentPdf } from './business-document-pdf.ts';
import { streamProductSpecSheet } from './spec-sheet.ts';
import {
  createStoredUploadName,
  ensurePrivateVendorDocumentsDirectory,
  resolvePrivateVendorDocumentPath,
  storePublicUpload,
} from '../uploads.ts';
import { prisma } from '../../../prisma/client.ts';
import { verifySignedDocumentToken } from '../vendor-auth.ts';

export function createInventoryRouter() {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  });
  const privateDocumentUpload = multer({
    storage: multer.diskStorage({
      destination: (_request, _file, callback) => {
        callback(null, ensurePrivateVendorDocumentsDirectory());
      },
      filename: (_request, file, callback) => {
        callback(null, createStoredUploadName(file.originalname));
      },
    }),
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
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

  router.get('/dashboard', async (_request, response, next) => {
    try {
      response.json(await getInventoryDashboard());
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

  router.get('/products', async (request, response, next) => {
    try {
      if (request.query.details === 'full') {
        response.json(await listInventoryProductDetails());
        return;
      }

      response.json(await listInventoryProducts());
    } catch (error) {
      next(error);
    }
  });

  router.get('/products/:id', async (request, response, next) => {
    try {
      response.json(await getInventoryProduct(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.get('/products/:id/spec-sheet.pdf', async (request, response, next) => {
    try {
      const product = await getInventoryProduct(request.params.id);
      await streamProductSpecSheet(response, product, {
        disposition: request.query.download === '1' ? 'attachment' : 'inline',
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/products', async (request, response, next) => {
    try {
      const product = await createInventoryProduct(request.body);
      await publishPendingDomainEvents();
      response.status(201).json(product);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/products/:id', async (request, response, next) => {
    try {
      const product = await updateInventoryProduct(request.params.id, request.body);
      await publishPendingDomainEvents();
      response.json(product);
    } catch (error) {
      next(error);
    }
  });

  router.get('/products/:id/assets', async (request, response, next) => {
    try {
      response.json(await getInventoryProductAssets(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/products/:id/assets', async (request, response, next) => {
    try {
      const asset = await createInventoryAsset(request.params.id, request.body);
      await publishPendingDomainEvents();
      response.status(201).json(asset);
    } catch (error) {
      next(error);
    }
  });

  router.get('/suppliers', async (_request, response, next) => {
    try {
      response.json(await listInventorySuppliers());
    } catch (error) {
      next(error);
    }
  });

  router.get('/suppliers/:id', async (request, response, next) => {
    try {
      response.json(await getInventorySupplier(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.get('/suppliers/:id/documents/history', async (request, response, next) => {
    try {
      const supplier = await getInventorySupplier(request.params.id);
      response.json(supplier.documentHistory);
    } catch (error) {
      next(error);
    }
  });

  router.get('/customers/:id/documents', async (request, response, next) => {
    try {
      response.json(await getInventoryCustomerDocumentHistory(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/customers/:id/workflow/quotes', async (request, response, next) => {
    try {
      const payload = await createCustomerQuoteDocument(request.params.id, request.body);
      await publishPendingDomainEvents();
      response.status(201).json(payload);
    } catch (error) {
      next(error);
    }
  });

  router.post('/documents/:id/workflow/quote-paid', async (request, response, next) => {
    try {
      const payload = await markCustomerQuotePaid(request.params.id);
      await publishPendingDomainEvents();
      response.json(payload);
    } catch (error) {
      next(error);
    }
  });

  router.post('/documents/:id/workflow/complete-order', async (request, response, next) => {
    try {
      const payload = await completeCustomerOrderWorkflow(request.params.id, request.body);
      await publishPendingDomainEvents();
      response.json(payload);
    } catch (error) {
      next(error);
    }
  });

  router.get('/documents/:id/pdf', async (request, response, next) => {
    try {
      const document = await getInventoryBusinessDocument(request.params.id);
      await streamBusinessDocumentPdf(response, document.summary, document.snapshot, {
        disposition: request.query.download === '1' ? 'attachment' : 'inline',
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/suppliers', async (request, response, next) => {
    try {
      const supplier = await createSupplier(request.body);
      await publishPendingDomainEvents();
      response.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/suppliers/:id', async (request, response, next) => {
    try {
      const supplier = await updateSupplier(request.params.id, request.body);
      await publishPendingDomainEvents();
      response.json(supplier);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/suppliers/:id', async (request, response, next) => {
    try {
      const result = await deleteSupplier(request.params.id);
      await publishPendingDomainEvents();
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/suppliers/documents/upload', privateDocumentUpload.single('file'), (request, response, next) => {
    try {
      if (!request.file) {
        response.status(400).json({ ok: false, error: 'A supplier document upload is required.' });
        return;
      }

      response.status(201).json({
        ok: true,
        filename: request.file.originalname,
        storedFileName: request.file.filename,
        mimeType: request.file.mimetype,
        size: request.file.size,
        storagePath: request.file.path,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/suppliers/:id/contacts', async (request, response, next) => {
    try {
      const supplier = await createSupplierContact(request.params.id, request.body);
      await publishPendingDomainEvents();
      response.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  });

  router.post('/suppliers/:id/documents', async (request, response, next) => {
    try {
      const supplier = await createSupplierDocument(request.params.id, request.body);
      await publishPendingDomainEvents();
      response.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  });

  router.post('/suppliers/:id/products', async (request, response, next) => {
    try {
      const supplier = await linkSupplierProducts(request.params.id, request.body);
      await publishPendingDomainEvents();
      response.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  });

  router.get('/suppliers/:id/documents/:documentId/download', async (request, response, next) => {
    try {
      const token = String(request.query.token ?? '');
      if (!token || !verifySignedDocumentToken(token, request.params.documentId)) {
        response.status(403).json({ ok: false, error: 'Document download token is invalid or expired.' });
        return;
      }

      const supplier = await prisma.supplier.findUnique({
        where: { supplierKey: request.params.id },
        select: { id: true },
      });

      if (!supplier) {
        response.status(404).json({ ok: false, error: 'Supplier not found.' });
        return;
      }

      const document = await prisma.vendorDocument.findFirst({
        where: {
          id: request.params.documentId,
          supplierId: supplier.id,
        },
      });

      if (!document) {
        response.status(404).json({ ok: false, error: 'Document not found.' });
        return;
      }

      response.download(resolvePrivateVendorDocumentPath(document.storedFileName), document.name);
    } catch (error) {
      next(error);
    }
  });

  router.post('/stock-movements', async (request, response, next) => {
    try {
      const stockPosition = await createStockMovement(request.body);
      await publishPendingDomainEvents();
      response.status(201).json(stockPosition);
    } catch (error) {
      next(error);
    }
  });

  router.get('/stock-positions', async (_request, response, next) => {
    try {
      response.json(await listStockPositions());
    } catch (error) {
      next(error);
    }
  });

  router.post('/price-list-imports', async (request, response, next) => {
    try {
      response.status(201).json(await createPriceListImport(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/price-list-imports/:id/apply', async (request, response, next) => {
    try {
      const result = await applyPriceListImport(request.params.id);
      await publishPendingDomainEvents();
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post('/logistics-quotes', async (request, response, next) => {
    try {
      const quote = await createLogisticsQuote(request.body);
      await publishPendingDomainEvents();
      response.status(201).json(quote);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
