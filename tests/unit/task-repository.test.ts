import { InMemoryTaskRepository } from '../../src/domain/task-repository';
import { Task } from '../../src/domain/task';

const makeTask = (id: string): Task => ({
  id,
  title: `Tarefa ${id}`,
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('InMemoryTaskRepository', () => {
  let repo: InMemoryTaskRepository;
  beforeEach(() => {
    repo = new InMemoryTaskRepository();
  });

  it('salva e busca por id', () => {
    repo.save(makeTask('1'));
    expect(repo.findById('1')?.title).toBe('Tarefa 1');
  });
  it('retorna undefined para id inexistente', () => {
    expect(repo.findById('x')).toBeUndefined();
  });
  it('lista todas as tarefas', () => {
    repo.save(makeTask('1'));
    repo.save(makeTask('2'));
    expect(repo.findAll()).toHaveLength(2);
  });
  it('nao expoe o estado interno por referencia', () => {
    repo.save(makeTask('1'));
    const copy = repo.findById('1')!;
    copy.title = 'alterado';
    expect(repo.findById('1')?.title).toBe('Tarefa 1');
  });
  it('remove e informa se removeu', () => {
    repo.save(makeTask('1'));
    expect(repo.delete('1')).toBe(true);
    expect(repo.delete('1')).toBe(false);
  });
  it('clear esvazia o repositorio', () => {
    repo.save(makeTask('1'));
    repo.clear();
    expect(repo.findAll()).toEqual([]);
  });
});
