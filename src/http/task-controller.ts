import { Request, Response } from 'express';
import { TaskService } from '../domain/task-service';
import {
  parseNewTask,
  parseStatusChange,
  parseTaskFilter,
  parseTaskUpdate,
} from './request-parsing';

// Traduz requisicoes HTTP em chamadas ao TaskService. Nao trata erros:
// ValidationError e NotFoundError sobem e o errorHandler os converte em 400 e 404.
export class TaskController {
  constructor(private readonly service: TaskService) {}

  create(req: Request, res: Response): void {
    const task = this.service.create(parseNewTask(req.body));
    res.status(201).json(task);
  }

  list(req: Request, res: Response): void {
    res.json(this.service.list(parseTaskFilter(req.query)));
  }

  summary(_req: Request, res: Response): void {
    res.json(this.service.summary());
  }

  get(req: Request, res: Response): void {
    res.json(this.service.get(req.params.id));
  }

  update(req: Request, res: Response): void {
    const changes = parseTaskUpdate(req.body);
    res.json(this.service.update(req.params.id, changes));
  }

  changeStatus(req: Request, res: Response): void {
    const status = parseStatusChange(req.body);
    res.json(this.service.changeStatus(req.params.id, status));
  }

  remove(req: Request, res: Response): void {
    this.service.remove(req.params.id);
    res.status(204).send();
  }
}
