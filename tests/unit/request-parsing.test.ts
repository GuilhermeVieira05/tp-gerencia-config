import { ValidationError } from '../../src/domain/errors';
import {
  parseNewTask,
  parseStatusChange,
  parseTaskFilter,
  parseTaskUpdate,
} from '../../src/http/request-parsing';

describe('parseTaskFilter', () => {
  it('retorna filtro vazio quando nao ha query', () => {
    expect(parseTaskFilter({})).toEqual({});
  });
  it('le status e prioridade validos', () => {
    expect(parseTaskFilter({ status: 'done', priority: 'high' })).toEqual({
      status: 'done',
      priority: 'high',
    });
  });
  it('ignora parametros desconhecidos', () => {
    expect(parseTaskFilter({ status: 'todo', page: '2' })).toEqual({ status: 'todo' });
  });
  it.each([
    ['status invalido', { status: 'arquivada' }],
    ['prioridade invalida', { priority: 'urgente' }],
    ['status repetido na query', { status: ['todo', 'done'] }],
    ['status vazio', { status: '' }],
  ])('rejeita %s', (_caso, query) => {
    expect(() => parseTaskFilter(query)).toThrow(ValidationError);
  });
});

describe('parseNewTask', () => {
  it('repassa os campos conhecidos', () => {
    expect(
      parseNewTask({
        title: 'Estudar',
        description: 'cap. 3',
        priority: 'high',
        dueDate: '2030-01-15',
      }),
    ).toEqual({
      title: 'Estudar',
      description: 'cap. 3',
      priority: 'high',
      dueDate: '2030-01-15',
    });
  });
  it('nao exige campos opcionais', () => {
    expect(parseNewTask({ title: 'So titulo' })).toMatchObject({ title: 'So titulo' });
  });
  it('ignora campos que pertencem ao servidor', () => {
    const input = parseNewTask({
      title: 'X',
      id: 'forjado',
      status: 'done',
      createdAt: '2000-01-01T00:00:00.000Z',
    });
    expect(input).not.toHaveProperty('id');
    expect(input).not.toHaveProperty('status');
    expect(input).not.toHaveProperty('createdAt');
  });
  it('deixa o dominio validar o titulo ausente', () => {
    expect(parseNewTask({}).title).toBeUndefined();
  });
  it('rejeita descricao que nao e texto', () => {
    expect(() => parseNewTask({ title: 'X', description: 42 })).toThrow(ValidationError);
  });
  it.each([null, undefined, 'texto', 7, ['lista']])('rejeita corpo %p', (body) => {
    expect(() => parseNewTask(body)).toThrow(ValidationError);
  });
});

describe('parseTaskUpdate', () => {
  it('inclui so os campos enviados', () => {
    expect(parseTaskUpdate({ title: 'Novo' })).toEqual({ title: 'Novo' });
  });
  it('repassa todos os campos editaveis', () => {
    const body = { title: 'T', description: 'D', priority: 'low', dueDate: '2030-01-01' };
    expect(parseTaskUpdate(body)).toEqual(body);
  });
  it('aceita corpo vazio (nenhuma mudanca)', () => {
    expect(parseTaskUpdate({})).toEqual({});
  });
  it('preserva dueDate null para limpar a data', () => {
    expect(parseTaskUpdate({ dueDate: null })).toEqual({ dueDate: null });
  });
  it('ignora status e id (status muda em rota propria)', () => {
    expect(parseTaskUpdate({ title: 'X', status: 'done', id: 'outro' })).toEqual({ title: 'X' });
  });
  it('rejeita descricao que nao e texto', () => {
    expect(() => parseTaskUpdate({ description: { a: 1 } })).toThrow(ValidationError);
  });
  it.each([null, undefined, 'texto', ['lista']])('rejeita corpo %p', (body) => {
    expect(() => parseTaskUpdate(body)).toThrow(ValidationError);
  });
});

describe('parseStatusChange', () => {
  it.each(['todo', 'doing', 'done'])('aceita %s', (status) => {
    expect(parseStatusChange({ status })).toBe(status);
  });
  it.each([{}, { status: 'arquivada' }, { status: 1 }, { status: null }])(
    'rejeita %p',
    (body) => {
      expect(() => parseStatusChange(body)).toThrow(ValidationError);
    },
  );
  it('rejeita corpo que nao e objeto', () => {
    expect(() => parseStatusChange('done')).toThrow(ValidationError);
  });
});
