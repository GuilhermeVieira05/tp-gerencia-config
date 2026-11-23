import { Router } from 'express';

// Usado pelo HEALTHCHECK do Dockerfile, pelo smoke test, pelo teste de aceitacao e pela
// verificacao pos-deploy. A versao vem de APP_VERSION (injetada na imagem pelo pipeline,
// a partir do package.json); fora do Docker vale "dev".
export function createHealthRouter(version: string = process.env.APP_VERSION ?? 'dev'): Router {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', version });
  });
  return router;
}
