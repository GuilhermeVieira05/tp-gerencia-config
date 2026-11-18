import request from 'supertest';
import { makeApp } from '../helpers/make-app';

// Jornada que atravessa varias rotas e confere o estado ao longo do caminho:
// valida que HTTP, dominio e repositorio funcionam juntos.
describe('jornada completa de uma tarefa', () => {
  it('cria, lista, edita, move de status, resume e remove', async () => {
    const { app, clock } = makeApp();

    // criar
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Entregar TP1', priority: 'low', dueDate: '2026-11-20T00:00:00Z' });
    expect(created.status).toBe(201);
    expect(created.body.id).toBe('id-1');

    // listar
    expect((await request(app).get('/tasks')).body.map((t: { id: string }) => t.id)).toEqual([
      'id-1',
    ]);

    // editar
    clock.now = new Date('2026-11-14T09:00:00.000Z');
    const edited = await request(app).patch('/tasks/id-1').send({ priority: 'high' });
    expect(edited.body).toMatchObject({ priority: 'high', status: 'todo' });

    // mover de status
    await request(app).patch('/tasks/id-1/status').send({ status: 'doing' });
    expect((await request(app).get('/tasks?status=doing')).body).toHaveLength(1);
    expect((await request(app).get('/tasks?status=todo')).body).toHaveLength(0);

    // resumo antes do prazo
    expect((await request(app).get('/tasks/summary')).body).toEqual({
      total: 1,
      byStatus: { todo: 0, doing: 1, done: 0 },
      overdue: 0,
    });

    // prazo vence: a tarefa em andamento passa a contar como atrasada
    clock.now = new Date('2026-11-21T09:00:00.000Z');
    expect((await request(app).get('/tasks/summary')).body.overdue).toBe(1);

    // concluir: deixa de ser atrasada
    await request(app).patch('/tasks/id-1/status').send({ status: 'done' });
    expect((await request(app).get('/tasks/summary')).body).toEqual({
      total: 1,
      byStatus: { todo: 0, doing: 0, done: 1 },
      overdue: 0,
    });

    // remover
    expect((await request(app).delete('/tasks/id-1')).status).toBe(204);
    expect((await request(app).get('/tasks/id-1')).status).toBe(404);
    expect((await request(app).get('/tasks/summary')).body.total).toBe(0);
  });

  it('mantem tarefas independentes entre si', async () => {
    const { app } = makeApp();
    await request(app).post('/tasks').send({ title: 'Primeira' });
    await request(app).post('/tasks').send({ title: 'Segunda' });

    await request(app).patch('/tasks/id-1').send({ title: 'Primeira editada' });
    await request(app).delete('/tasks/id-2');

    const lista = (await request(app).get('/tasks')).body;
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ id: 'id-1', title: 'Primeira editada' });
  });

  it('cada app novo comeca sem dados (isolamento entre testes)', async () => {
    const primeira = makeApp().app;
    await request(primeira).post('/tasks').send({ title: 'X' });
    const segunda = makeApp().app;
    expect((await request(segunda).get('/tasks')).body).toEqual([]);
  });
});
