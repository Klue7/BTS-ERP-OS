import { Router } from 'express';
import {
  applyPriceListImport,
  createInventoryAsset,
  createInventoryProduct,
  createLogisticsQuote,
  createPriceListImport,
  createStockMovement,
  createSupplier,
  getInventoryDashboard,
  getInventoryProduct,
  getInventoryProductAssets,
  listInventoryProductDetails,
  listInventoryProducts,
  listInventorySuppliers,
  listStockPositions,
  updateInventoryProduct,
} from './service.ts';

export function createInventoryRouter() {
  const router = Router();

  router.get('/dashboard', async (_request, response, next) => {
    try {
      response.json(await getInventoryDashboard());
    } catch (error) {
      next(error);
    }
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

  router.post('/products', async (request, response, next) => {
    try {
      response.status(201).json(await createInventoryProduct(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.patch('/products/:id', async (request, response, next) => {
    try {
      response.json(await updateInventoryProduct(request.params.id, request.body));
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
      response.status(201).json(await createInventoryAsset(request.params.id, request.body));
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

  router.post('/suppliers', async (request, response, next) => {
    try {
      response.status(201).json(await createSupplier(request.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/stock-movements', async (request, response, next) => {
    try {
      response.status(201).json(await createStockMovement(request.body));
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
      response.json(await applyPriceListImport(request.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/logistics-quotes', async (request, response, next) => {
    try {
      response.status(201).json(await createLogisticsQuote(request.body));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
