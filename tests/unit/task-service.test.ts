import { NotFoundError, ValidationError } from '../../src/domain/errors';
import { InMemoryTaskRepository } from '../../src/domain/task-repository';
import { TaskService } from '../../src/domain/task-service';

describe('TaskService', () => {
  let service: TaskService;
  let clock: Date;
  let seq: number;

  beforeEach(() => {
    clock = new Date('2026-11-13T12:00:00.000Z');
    seq = 0;
    service = new TaskService(new InMemoryTaskRepository(), {
      now: () => clock,
      generateId: () => `id-${++seq}`,
    });
  });

  describe('create', () => {
    it('cria tarefa com padroes', () => {
      const task = service.create({ title: 'Escrever plano' });
      expect(task).toMatchObject({
        id: 'id-1',
        title: 'Escrever plano',
        status: 'todo',
        priority: 'medium',
        dueDate: null,
        createdAt: '2026-11-13T12:00:00.000Z',
      });
    });
    it('rejeita titulo vazio', () => {
      expect(() => service.create({ title: '' })).toThrow(ValidationError);
    });
  });

  describe('get', () => {
    it('lanca NotFoundError quando nao existe', () => {
      expect(() => service.get('nope')).toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    beforeEach(() => {
      service.create({ title: 'A', priority: 'high' });
      service.create({ title: 'B', priority: 'low' });
      service.changeStatus('id-2', 'done');
    });
    it('lista tudo sem filtro', () => {
      expect(service.list()).toHaveLength(2);
    });
    it('filtra por status', () => {
      expect(service.list({ status: 'done' }).map((t) => t.title)).toEqual(['B']);
    });
    it('filtra por prioridade', () => {
      expect(service.list({ priority: 'high' }).map((t) => t.title)).toEqual(['A']);
    });
  });

  describe('update', () => {
    it('altera apenas os campos informados e atualiza updatedAt', () => {
      service.create({ title: 'Velho', description: 'desc' });
      clock = new Date('2026-11-14T12:00:00.000Z');
      const updated = service.update('id-1', { title: 'Novo' });
      expect(updated.title).toBe('Novo');
      expect(updated.description).toBe('desc');
      expect(updated.updatedAt).toBe('2026-11-14T12:00:00.000Z');
      expect(updated.createdAt).toBe('2026-11-13T12:00:00.000Z');
    });
    it('valida os campos alterados', () => {
      service.create({ title: 'X' });
      expect(() => service.update('id-1', { priority: 'urgent' as never })).toThrow(
        ValidationError,
      );
    });
    it('lanca NotFoundError para id inexistente', () => {
      expect(() => service.update('nope', { title: 'Y' })).toThrow(NotFoundError);
    });
  });

  describe('changeStatus', () => {
    it('muda o status', () => {
      service.create({ title: 'X' });
      expect(service.changeStatus('id-1', 'doing').status).toBe('doing');
    });
    it('rejeita status invalido', () => {
      service.create({ title: 'X' });
      expect(() => service.changeStatus('id-1', 'blocked' as never)).toThrow(ValidationError);
    });
  });

  describe('remove', () => {
    it('remove tarefa existente', () => {
      service.create({ title: 'X' });
      service.remove('id-1');
      expect(service.list()).toEqual([]);
    });
    it('lanca NotFoundError ao remover inexistente', () => {
      expect(() => service.remove('nope')).toThrow(NotFoundError);
    });
  });

  describe('summary', () => {
    it('conta por status e tarefas atrasadas', () => {
      service.create({ title: 'Atrasada', dueDate: '2026-11-01T00:00:00Z' });
      service.create({ title: 'No prazo', dueDate: '2026-12-01T00:00:00Z' });
      service.create({ title: 'Feita atrasada', dueDate: '2026-11-01T00:00:00Z' });
      service.changeStatus('id-3', 'done');
      expect(service.summary()).toEqual({
        total: 3,
        byStatus: { todo: 2, doing: 0, done: 1 },
        overdue: 1,
      });
    });
  });
});
