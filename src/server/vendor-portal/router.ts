import { Router } from 'express';
import { loginSupplierPortal, logoutSupplierPortal, resolveSupplierPortalSession } from './service.ts';

export function createVendorPortalRouter() {
  const router = Router();

  router.post('/login', async (request, response, next) => {
    try {
      const email = String(request.body?.email ?? '').trim();
      const password = String(request.body?.password ?? '');

      if (!email || !password) {
        response.status(400).json({ ok: false, error: 'Email and password are required.' });
        return;
      }

      const result = await loginSupplierPortal(email, password);
      response.setHeader('Set-Cookie', result.cookie);
      response.json({ ok: true, role: 'supplier' });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', async (request, response, next) => {
    try {
      const clearedCookie = await logoutSupplierPortal(request.headers);
      response.setHeader('Set-Cookie', clearedCookie);
      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.get('/session', async (request, response, next) => {
    try {
      const session = await resolveSupplierPortalSession(request.headers);
      if (!session) {
        response.json({ ok: false, session: null });
        return;
      }

      response.json(session);
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', async (request, response, next) => {
    try {
      const session = await resolveSupplierPortalSession(request.headers);
      if (!session) {
        response.status(401).json({ ok: false, error: 'No active supplier portal session.' });
        return;
      }

      response.json(session);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
