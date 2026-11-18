import request from 'supertest';
import { createApp } from '../../src/app';
import { TaskService } from '../../src/domain/task-service';
import { makeApp } from '../helpers/make-app';

describe('erros 400 (requisicao invalida)', () => {
  describe('POST /tasks', () => {
    it.each([
      ['sem titulo', {}],
      ['titulo em branco', { title: '   ' }],
      ['titulo que nao e texto', { title: 123 }],
      ['titulo com mais de 100 caracteres', { title: 'a'.repeat(101) }],
      ['prioridade invalida', { title: 'x', priority: 'urgente' }],
      ['data invalida', { title: 'x', dueDate: 'amanha' }],
      ['descricao que nao e texto', { title: 'x', description: 42 }],
    ])('recusa %s', async (_caso, body) => {
      const { app } = makeApp();
      const res = await request(app).post('/tasks').send(body);
      expect(res.status).toBe(400);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error.length).toBeGreaterThan(0);
    });

    it('descreve o motivo no corpo da resposta', async () => {
      const { app } = makeApp();
      const res = await request(app).post('/tasks').send({ title: 'x', priority: 'urgente' });
      expect(res.body).toEqual({ error: 'Prioridade invalida: urgente' });
    });

    it('recusa JSON malformado', async () => {
      const { app } = makeApp();
      const res = await request(app)
        .post('/tasks')
        .set('Content-Type', 'application/json')
        .send('{"title": ');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'JSON invalido no corpo da requisicao' });
    });

    it('recusa corpo que e uma lista', async () => {
      const { app } = makeApp();
      const res = await request(app).post('/tasks').send([{ title: 'x' }]);
      expect(res.status).toBe(400);
    });

    it('recusa requisicao sem corpo JSON', async () => {
      const { app } = makeApp();
      const res = await request(app).post('/tasks');
      expect(res.status).toBe(400);
    });

    it('nao cria nada quando a requisicao e invalida', async () => {
      const { app } = makeApp();
      await request(app).post('/tasks').send({ title: '' });
      expect((await request(app).get('/tasks')).body).toEqual([]);
    });
  });

  describe('GET /tasks (filtros)', () => {
    it.each(['status=arquivada', 'priority=urgente', 'status=todo&status=done'])(
      'recusa ?%s',
      async (query) => {
        const { app } = makeApp();
        const res = await request(app).get(`/tasks?${query}`);
        expect(res.status).toBe(400);
      },
    );
  });

  describe('PATCH /tasks/:id', () => {
    it.each([
      ['titulo em branco', { title: '' }],
      ['prioridade invalida', { priority: 'urgente' }],
      ['data invalida', { dueDate: 'ontem' }],
      ['descricao que nao e texto', { description: {} }],
    ])('recusa %s e nao altera a tarefa', async (_caso, body) => {
      const { app } = makeApp();
      const created = await request(app).post('/tasks').send({ title: 'Intacta' });

      const res = await request(app).patch('/tasks/id-1').send(body);
      expect(res.status).toBe(400);
      expect((await request(app).get('/tasks/id-1')).body).toEqual(created.body);
    });
  });

  describe('PATCH /tasks/:id/status', () => {
    it.each([
      ['status invalido', { status: 'arquivada' }],
      ['status ausente', {}],
      ['status que nao e texto', { status: 1 }],
    ])('recusa %s', async (_caso, body) => {
      const { app } = makeApp();
      await request(app).post('/tasks').send({ title: 'X' });
      const res = await request(app).patch('/tasks/id-1/status').send(body);
      expect(res.status).toBe(400);
      expect((await request(app).get('/tasks/id-1')).body.status).toBe('todo');
    });
  });
});

describe('erros 404 (nao encontrado)', () => {
  it.each([
    ['GET', '/tasks/nope', undefined],
    ['PATCH', '/tasks/nope', { title: 'x' }],
    ['PATCH', '/tasks/nope/status', { status: 'done' }],
    ['DELETE', '/tasks/nope', undefined],
  ] as const)('%s %s responde 404 para id inexistente', async (method, path, body) => {
    const { app } = makeApp();
    const req = request(app)[method.toLowerCase() as 'get' | 'patch' | 'delete'](path);
    const res = await (body ? req.send(body) : req);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Tarefa nope nao encontrada' });
  });

  it('remover duas vezes: a segunda responde 404', async () => {
    const { app } = makeApp();
    await request(app).post('/tasks').send({ title: 'X' });
    expect((await request(app).delete('/tasks/id-1')).status).toBe(204);
    expect((await request(app).delete('/tasks/id-1')).status).toBe(404);
  });

  it('rota desconhecida responde 404 em JSON', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Rota nao encontrada' });
  });

  it('metodo nao suportado na rota responde 404 em JSON', async () => {
    const { app } = makeApp();
    const res = await request(app).put('/tasks/id-1').send({ title: 'x' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Rota nao encontrada' });
  });
});

describe('outros erros', () => {
  it('corpo maior que o limite responde 413', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'x', description: 'a'.repeat(200_000) });
    expect(res.status).toBe(413);
  });

  it('falha inesperada responde 500 sem vazar detalhes', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const quebrado = {
      list: () => {
        throw new Error('detalhe interno secreto');
      },
    } as unknown as TaskService;

    const res = await request(createApp(quebrado)).get('/tasks');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Erro interno do servidor' });
    expect(JSON.stringify(res.body)).not.toContain('secreto');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
