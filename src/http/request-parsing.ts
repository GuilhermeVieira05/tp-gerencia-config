import { ValidationError } from '../domain/errors';
import { NewTaskInput, TaskFilter, TaskStatus, UpdateTaskInput } from '../domain/task';
import { validatePriority, validateStatus } from '../domain/validation';

// Converte o que chega pela rede (`unknown`) nos tipos do dominio.
// So le campos conhecidos: qualquer outro (id, status, createdAt...) e ignorado,
// para o cliente nao conseguir forjar dados que pertencem ao servidor.
// A validacao de regra de negocio (tamanho do titulo, valores validos...) continua
// no dominio; aqui so se garante a forma da requisicao.

type JsonObject = Record<string, unknown>;

function asObject(body: unknown): JsonObject {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ValidationError('O corpo da requisicao deve ser um objeto JSON');
  }
  return body as JsonObject;
}

function ensureOptionalString(value: unknown, field: string): void {
  if (value !== undefined && typeof value !== 'string') {
    throw new ValidationError(`O campo ${field} deve ser um texto`);
  }
}

export function parseTaskFilter(query: JsonObject): TaskFilter {
  const filter: TaskFilter = {};
  if (query.status !== undefined) filter.status = validateStatus(query.status);
  if (query.priority !== undefined) filter.priority = validatePriority(query.priority);
  return filter;
}

export function parseNewTask(body: unknown): NewTaskInput {
  const data = asObject(body);
  ensureOptionalString(data.description, 'description');
  return {
    title: data.title as string,
    description: data.description as string | undefined,
    priority: data.priority as NewTaskInput['priority'],
    dueDate: data.dueDate as NewTaskInput['dueDate'],
  };
}

export function parseTaskUpdate(body: unknown): UpdateTaskInput {
  const data = asObject(body);
  ensureOptionalString(data.description, 'description');
  const changes: UpdateTaskInput = {};
  if (data.title !== undefined) changes.title = data.title as string;
  if (data.description !== undefined) changes.description = data.description as string;
  if (data.priority !== undefined) changes.priority = data.priority as UpdateTaskInput['priority'];
  if (data.dueDate !== undefined) changes.dueDate = data.dueDate as UpdateTaskInput['dueDate'];
  return changes;
}

export function parseStatusChange(body: unknown): TaskStatus {
  return validateStatus(asObject(body).status);
}
