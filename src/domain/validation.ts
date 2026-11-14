import { ValidationError } from './errors';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskPriority,
  TaskStatus,
} from './task';

const MAX_TITLE_LENGTH = 100;

export function validateTitle(title: unknown): string {
  if (typeof title !== 'string' || title.trim() === '') {
    throw new ValidationError('O titulo e obrigatorio');
  }
  const trimmed = title.trim();
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`O titulo deve ter no maximo ${MAX_TITLE_LENGTH} caracteres`);
  }
  return trimmed;
}

export function validatePriority(priority: unknown): TaskPriority {
  if (!TASK_PRIORITIES.includes(priority as TaskPriority)) {
    throw new ValidationError(`Prioridade invalida: ${String(priority)}`);
  }
  return priority as TaskPriority;
}

export function validateStatus(status: unknown): TaskStatus {
  if (!TASK_STATUSES.includes(status as TaskStatus)) {
    throw new ValidationError(`Status invalido: ${String(status)}`);
  }
  return status as TaskStatus;
}

export function validateDueDate(dueDate: unknown): string | null {
  if (dueDate === null || dueDate === undefined) return null;
  if (typeof dueDate !== 'string' || Number.isNaN(Date.parse(dueDate))) {
    throw new ValidationError(`Data de vencimento invalida: ${String(dueDate)}`);
  }
  return new Date(dueDate).toISOString();
}
