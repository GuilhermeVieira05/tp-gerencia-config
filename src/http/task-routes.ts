import { Router } from 'express';
import { TaskController } from './task-controller';

// Montado em /tasks (ver app.ts). A ordem importa: `/summary` vem antes de `/:id`,
// senao o Express trataria "summary" como um id.
export function createTaskRouter(controller: TaskController): Router {
  const router = Router();
  router.post('/', (req, res) => controller.create(req, res));
  router.get('/', (req, res) => controller.list(req, res));
  router.get('/summary', (req, res) => controller.summary(req, res));
  router.get('/:id', (req, res) => controller.get(req, res));
  router.patch('/:id', (req, res) => controller.update(req, res));
  router.patch('/:id/status', (req, res) => controller.changeStatus(req, res));
  router.delete('/:id', (req, res) => controller.remove(req, res));
  return router;
}
