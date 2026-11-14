export const TASK_STATUSES = ['todo', 'doing', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

export interface NewTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export type UpdateTaskInput = Partial<NewTaskInput>;

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface TaskSummary {
  total: number;
  byStatus: Record<TaskStatus, number>;
  overdue: number;
}
