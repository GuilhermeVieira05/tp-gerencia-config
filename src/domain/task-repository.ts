import { Task } from './task';

export interface TaskRepository {
  save(task: Task): Task;
  findById(id: string): Task | undefined;
  findAll(): Task[];
  delete(id: string): boolean;
  clear(): void;
}

export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();

  save(task: Task): Task {
    this.tasks.set(task.id, { ...task });
    return { ...task };
  }

  findById(id: string): Task | undefined {
    const task = this.tasks.get(id);
    return task ? { ...task } : undefined;
  }

  findAll(): Task[] {
    return [...this.tasks.values()].map((t) => ({ ...t }));
  }

  delete(id: string): boolean {
    return this.tasks.delete(id);
  }

  clear(): void {
    this.tasks.clear();
  }
}
