import request from 'supertest';
import { makeApp, START } from '../helpers/make-app';

describe('POST /tasks', () => {
  it('cria tarefa com os padroes e responde 201', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/tasks').send({ title: 'Escrever plano' });
    expect(res.status).toBe(201);
    expect(res.type).toBe('application/json');
    expect(res.body).toEqual({
      id: 'id-1',
      title: 'Escrever plano',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      createdAt: START,
      updatedAt: START,
    });
  });

  it('grava todos os campos informados e normaliza a data', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Entregar TP1', description: 'Pipeline', priority: 'high', dueDate: '2030-01-15' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      description: 'Pipeline',
      priority: 'high',
      dueDate: '2030-01-15T00:00:00.000Z',
    });
  });

  it('remove espacos do titulo', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/tasks').send({ title: '  Estudar GC  ' });
    expect(res.body.title).toBe('Estudar GC');
  });

  it('ignora id e status enviados pelo cliente', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'X', id: 'forjado', status: 'done', createdAt: '2000-01-01T00:00:00.000Z' });
    expect(res.body).toMatchObject({ id: 'id-1', status: 'todo', createdAt: START });
  });
});

describe('GET /tasks', () => {
  it('responde lista vazia quando nao ha tarefas', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  describe('com tarefas cadastradas', () => {
    // id-1: A (high, todo) | id-2: B (low, done) | id-3: C (high, done)
    const titles = (res: request.Response) => res.body.map((t: { title: string }) => t.title);
    let app: ReturnType<typeof makeApp>['app'];

    beforeEach(async () => {
      ({ app } = makeApp());
      await request(app).post('/tasks').send({ title: 'A', priority: 'high' });
      await request(app).post('/tasks').send({ title: 'B', priority: 'low' });
      await request(app).post('/tasks').send({ title: 'C', priority: 'high' });
      await request(app).patch('/tasks/id-2/status').send({ status: 'done' });
      await request(app).patch('/tasks/id-3/status').send({ status: 'done' });
    });

    it('lista todas sem filtro, na ordem de criacao', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(titles(res)).toEqual(['A', 'B', 'C']);
    });
    it('filtra por status', async () => {
      expect(titles(await request(app).get('/tasks?status=done'))).toEqual(['B', 'C']);
    });
    it('filtra por prioridade', async () => {
      expect(titles(await request(app).get('/tasks?priority=high'))).toEqual(['A', 'C']);
    });
    it('combina os filtros', async () => {
      expect(titles(await request(app).get('/tasks?status=done&priority=high'))).toEqual(['C']);
    });
    it('responde lista vazia quando nada corresponde', async () => {
      const res = await request(app).get('/tasks?status=doing');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});

describe('GET /tasks/summary', () => {
  it('conta por status e tarefas atrasadas', async () => {
    const { app } = makeApp();
    await request(app).post('/tasks').send({ title: 'Atrasada', dueDate: '2026-11-01T00:00:00Z' });
    await request(app).post('/tasks').send({ title: 'No prazo', dueDate: '2026-12-01T00:00:00Z' });
    await request(app).post('/tasks').send({ title: 'Feita', dueDate: '2026-11-01T00:00:00Z' });
    await request(app).patch('/tasks/id-3/status').send({ status: 'done' });

    const res = await request(app).get('/tasks/summary');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 3,
      byStatus: { todo: 2, doing: 0, done: 1 },
      overdue: 1,
    });
  });

  it('nao confunde "summary" com um id de tarefa', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/tasks/summary');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 0, byStatus: { todo: 0, doing: 0, done: 0 }, overdue: 0 });
  });
});

describe('GET /tasks/:id', () => {
  it('devolve a tarefa pedida', async () => {
    const { app } = makeApp();
    const created = await request(app).post('/tasks').send({ title: 'Consultar' });
    const res = await request(app).get('/tasks/id-1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });
});

describe('PATCH /tasks/:id', () => {
  it('altera so os campos enviados e atualiza updatedAt', async () => {
    const { app, clock } = makeApp();
    await request(app).post('/tasks').send({ title: 'Velho', description: 'mantida' });
    clock.now = new Date('2026-11-14T12:00:00.000Z');

    const res = await request(app).patch('/tasks/id-1').send({ title: 'Novo', priority: 'low' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 'id-1',
      title: 'Novo',
      priority: 'low',
      description: 'mantida',
      status: 'todo',
      createdAt: START,
      updatedAt: '2026-11-14T12:00:00.000Z',
    });
  });

  it('persiste a alteracao', async () => {
    const { app } = makeApp();
    await request(app).post('/tasks').send({ title: 'Antes' });
    await request(app).patch('/tasks/id-1').send({ title: 'Depois' });
    expect((await request(app).get('/tasks/id-1')).body.title).toBe('Depois');
  });

  it('limpa a data de vencimento com dueDate null', async () => {
    const { app } = makeApp();
    await request(app).post('/tasks').send({ title: 'X', dueDate: '2030-01-01' });
    const res = await request(app).patch('/tasks/id-1').send({ dueDate: null });
    expect(res.status).toBe(200);
    expect(res.body.dueDate).toBeNull();
  });

  it('nao muda o status (ha rota propria para isso)', async () => {
    const { app } = makeApp();
    await request(app).post('/tasks').send({ title: 'X' });
    const res = await request(app).patch('/tasks/id-1').send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('todo');
  });
});

describe('PATCH /tasks/:id/status', () => {
  it('percorre todo -> doing -> done', async () => {
    const { app } = makeApp();
    await request(app).post('/tasks').send({ title: 'Fluxo' });

    const doing = await request(app).patch('/tasks/id-1/status').send({ status: 'doing' });
    expect(doing.status).toBe(200);
    expect(doing.body.status).toBe('doing');

    const done = await request(app).patch('/tasks/id-1/status').send({ status: 'done' });
    expect(done.status).toBe(200);
    expect(done.body.status).toBe('done');
  });

  it('mantem os demais campos', async () => {
    const { app } = makeApp();
    await request(app).post('/tasks').send({ title: 'X', priority: 'high' });
    const res = await request(app).patch('/tasks/id-1/status').send({ status: 'done' });
    expect(res.body).toMatchObject({ title: 'X', priority: 'high', status: 'done' });
  });
});

describe('DELETE /tasks/:id', () => {
  it('responde 204 sem corpo e a tarefa deixa de existir', async () => {
    const { app } = makeApp();
    await request(app).post('/tasks').send({ title: 'Remover' });

    const res = await request(app).delete('/tasks/id-1');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect((await request(app).get('/tasks/id-1')).status).toBe(404);
    expect((await request(app).get('/tasks')).body).toEqual([]);
  });
});
