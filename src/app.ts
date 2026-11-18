import express from 'express';
import { InMemoryTaskRepository } from './domain/task-repository';
import { TaskService } from './domain/task-service';
import { errorHandler, notFoundHandler } from './http/error-handler';
import { createHealthRouter } from './http/health-routes';
import { TaskController } from './http/task-controller';
import { createTaskRouter } from './http/task-routes';

// O servico e injetavel para os testes de integracao usarem relogio e ids deterministicos.
export function createApp(
  service: TaskService = new TaskService(new InMemoryTaskRepository()),
) {
  const app = express();
  app.use(express.json());
  app.use(createHealthRouter());
  app.use('/tasks', createTaskRouter(new TaskController(service)));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
