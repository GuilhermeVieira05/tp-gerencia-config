import { Router } from 'express';

// Usado pelo HEALTHCHECK do Dockerfile, pelo smoke test e pela verificacao pos-deploy.
export function createHealthRouter(): Router {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  return router;
}
