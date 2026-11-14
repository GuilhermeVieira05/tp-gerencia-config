import { randomUUID } from 'node:crypto';
import { NotFoundError } from './errors';
import { TaskRepository } from './task-repository';
import {
  NewTaskInput,
  Task,
  TaskFilter,
  TaskStatus,
  TaskSummary,
  UpdateTaskInput,
  TASK_STATUSES,
} from './task';
import {
  validateDueDate,
  validatePriority,
  validateStatus,
  validateTitle,
} from './validation';

export interface TaskServiceOptions {
  now?: () => Date;
  generateId?: () => string;
}

export class TaskService {
  private readonly now: () => Date;
  private readonly generateId: () => string;

  constructor(
    private readonly repository: TaskRepository,
    options: TaskServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.generateId = options.generateId ?? randomUUID;
  }

  create(input: NewTaskInput): Task {
    const timestamp = this.now().toISOString();
    const task: Task = {
      id: this.generateId(),
      title: validateTitle(input.title),
      description: input.description ?? '',
      status: 'todo',
      priority: validatePriority(input.priority ?? 'medium'),
      dueDate: validateDueDate(input.dueDate),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return this.repository.save(task);
  }

  get(id: string): Task {
    const task = this.repository.findById(id);
    if (!task) throw new NotFoundError(id);
    return task;
  }

  list(filter: TaskFilter = {}): Task[] {
    return this.repository
      .findAll()
      .filter((t) => !filter.status || t.status === filter.status)
      .filter((t) => !filter.priority || t.priority === filter.priority);
  }

  update(id: string, changes: UpdateTaskInput): Task {
    const current = this.get(id);
    const updated: Task = {
      ...current,
      title: changes.title !== undefined ? validateTitle(changes.title) : current.title,
      description: changes.description ?? current.description,
      priority:
        changes.priority !== undefined ? validatePriority(changes.priority) : current.priority,
      dueDate:
        changes.dueDate !== undefined ? validateDueDate(changes.dueDate) : current.dueDate,
      updatedAt: this.now().toISOString(),
    };
    return this.repository.save(updated);
  }

  changeStatus(id: string, status: TaskStatus): Task {
    const current = this.get(id);
    return this.repository.save({
      ...current,
      status: validateStatus(status),
      updatedAt: this.now().toISOString(),
    });
  }

  remove(id: string): void {
    if (!this.repository.delete(id)) throw new NotFoundError(id);
  }

  summary(): TaskSummary {
    const tasks = this.repository.findAll();
    const byStatus = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0])) as Record<
      TaskStatus,
      number
    >;
    const nowMs = this.now().getTime();
    let overdue = 0;
    for (const task of tasks) {
      byStatus[task.status] += 1;
      if (task.status !== 'done' && task.dueDate && Date.parse(task.dueDate) < nowMs) {
        overdue += 1;
      }
    }
    return { total: tasks.length, byStatus, overdue };
  }
}
