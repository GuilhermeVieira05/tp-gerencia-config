/**
 * Testes de aceitacao (caixa-preta).
 *
 * Diferente dos testes de unidade e de integracao, estes NAO importam nada de `src/`.
 * Eles falam com a aplicacao ja em execucao (no pipeline, o conteiner Docker que
 * vira o artefato de release) somente por HTTP, como um cliente real faria.
 *
 * Alvo: variavel de ambiente BASE_URL (padrao http://localhost:3000).
 * Execucao: `npm run test:acceptance` com a API no ar.
 *
 * Cada cenario segue o formato Dado / Quando / Entao e corresponde a um
 * criterio de aceitacao descrito em docs/plano/secao-qualidade-aceitacao.md.
 */

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  total: number;
  byStatus: Record<'todo' | 'doing' | 'done', number>;
  overdue: number;
}

interface ApiResponse<T> {
  status: number;
  body: T;
}

async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    // corpo nao-JSON: mantem o texto cru
  }
  return { status: res.status, body: parsed as T };
}

// Titulos unicos: o servidor e compartilhado entre cenarios e pode ja ter dados.
let seq = 0;
const uniqueTitle = (label: string) => `[aceitacao ${Date.now()}-${++seq}] ${label}`;

async function createTask(input: Record<string, unknown>): Promise<Task> {
  const res = await api<Task>('POST', '/tasks', input);
  expect(res.status).toBe(201);
  return res.body;
}

beforeAll(async () => {
  // Espera a aplicacao responder (o conteiner pode ainda estar subindo).
  const deadline = Date.now() + 30_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return;
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`API nao respondeu em ${BASE_URL}/health: ${String(lastError)}`);
});

describe('CA01 - Disponibilidade', () => {
  it('Dado a aplicacao implantada, Quando consulto /health, Entao recebo 200 e status ok', async () => {
    const res = await api<{ status: string }>('GET', '/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});

describe('CA02 - Criar tarefa', () => {
  it('Dado um titulo valido, Quando crio a tarefa, Entao ela nasce com status todo e prioridade medium', async () => {
    const title = uniqueTitle('Estudar GC');
    const res = await api<Task>('POST', '/tasks', { title: `  ${title}  ` });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title,
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
    });
    expect(typeof res.body.id).toBe('string');
    expect(res.body.id.length).toBeGreaterThan(0);
  });

  it('Dado todos os campos, Quando crio a tarefa, Entao eles sao gravados', async () => {
    const title = uniqueTitle('Entregar TP1');
    const task = await createTask({
      title,
      description: 'Pipeline completo',
      priority: 'high',
      dueDate: '2030-01-15',
    });
    expect(task).toMatchObject({ title, description: 'Pipeline completo', priority: 'high' });
    expect(task.dueDate).toBe(new Date('2030-01-15').toISOString());
  });

  it.each([
    ['sem titulo', {}],
    ['titulo em branco', { title: '   ' }],
    ['titulo com mais de 100 caracteres', { title: 'a'.repeat(101) }],
    ['prioridade invalida', { title: 'x', priority: 'urgente' }],
    ['data invalida', { title: 'x', dueDate: 'amanha' }],
  ])('Dado %s, Quando tento criar, Entao recebo 400', async (_caso, input) => {
    const res = await api('POST', '/tasks', input);
    expect(res.status).toBe(400);
  });
});

describe('CA03 - Consultar tarefas', () => {
  it('Dado uma tarefa criada, Quando consulto pelo id, Entao recebo a mesma tarefa', async () => {
    const created = await createTask({ title: uniqueTitle('Consultar') });
    const res = await api<Task>('GET', `/tasks/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created);
  });

  it('Dado um id inexistente, Quando consulto, Entao recebo 404', async () => {
    const res = await api('GET', '/tasks/id-que-nao-existe');
    expect(res.status).toBe(404);
  });

  it('Dado tarefas de prioridades diferentes, Quando filtro por prioridade, Entao so vem as da prioridade pedida', async () => {
    const alta = await createTask({ title: uniqueTitle('Alta'), priority: 'high' });
    const baixa = await createTask({ title: uniqueTitle('Baixa'), priority: 'low' });

    const res = await api<Task[]>('GET', '/tasks?priority=high');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((t) => t.priority === 'high')).toBe(true);
    const ids = res.body.map((t) => t.id);
    expect(ids).toContain(alta.id);
    expect(ids).not.toContain(baixa.id);
  });

  it('Dado tarefas com status diferentes, Quando filtro por status, Entao so vem as do status pedido', async () => {
    const feita = await createTask({ title: uniqueTitle('Feita') });
    await api('PATCH', `/tasks/${feita.id}/status`, { status: 'done' });
    const aFazer = await createTask({ title: uniqueTitle('A fazer') });

    const res = await api<Task[]>('GET', '/tasks?status=done');
    expect(res.status).toBe(200);
    expect(res.body.every((t) => t.status === 'done')).toBe(true);
    const ids = res.body.map((t) => t.id);
    expect(ids).toContain(feita.id);
    expect(ids).not.toContain(aFazer.id);
  });
});

describe('CA04 - Atualizar tarefa', () => {
  it('Dado uma tarefa, Quando altero titulo e prioridade, Entao so esses campos mudam', async () => {
    const created = await createTask({ title: uniqueTitle('Antes'), description: 'mantida' });
    const novoTitulo = uniqueTitle('Depois');

    const res = await api<Task>('PATCH', `/tasks/${created.id}`, { title: novoTitulo, priority: 'low' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: created.id,
      title: novoTitulo,
      priority: 'low',
      description: 'mantida',
      status: 'todo',
      createdAt: created.createdAt,
    });

    const relido = await api<Task>('GET', `/tasks/${created.id}`);
    expect(relido.body.title).toBe(novoTitulo);
  });

  it('Dado um titulo invalido, Quando atualizo, Entao recebo 400 e a tarefa nao muda', async () => {
    const created = await createTask({ title: uniqueTitle('Intacta') });
    const res = await api('PATCH', `/tasks/${created.id}`, { title: '' });
    expect(res.status).toBe(400);
    const relido = await api<Task>('GET', `/tasks/${created.id}`);
    expect(relido.body.title).toBe(created.title);
  });

  it('Dado um id inexistente, Quando atualizo, Entao recebo 404', async () => {
    const res = await api('PATCH', '/tasks/id-que-nao-existe', { title: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('CA05 - Mudar status', () => {
  it('Dado uma tarefa, Quando a movo de todo para doing e depois done, Entao o status acompanha', async () => {
    const created = await createTask({ title: uniqueTitle('Fluxo de status') });

    const doing = await api<Task>('PATCH', `/tasks/${created.id}/status`, { status: 'doing' });
    expect(doing.status).toBe(200);
    expect(doing.body.status).toBe('doing');

    const done = await api<Task>('PATCH', `/tasks/${created.id}/status`, { status: 'done' });
    expect(done.status).toBe(200);
    expect(done.body.status).toBe('done');
  });

  it('Dado um status invalido, Quando tento mudar, Entao recebo 400', async () => {
    const created = await createTask({ title: uniqueTitle('Status invalido') });
    const res = await api('PATCH', `/tasks/${created.id}/status`, { status: 'arquivada' });
    expect(res.status).toBe(400);
  });

  it('Dado um id inexistente, Quando mudo o status, Entao recebo 404', async () => {
    const res = await api('PATCH', '/tasks/id-que-nao-existe/status', { status: 'done' });
    expect(res.status).toBe(404);
  });
});

describe('CA06 - Resumo', () => {
  it('Dado novas tarefas (uma atrasada e uma concluida), Quando consulto o resumo, Entao os contadores refletem as mudancas', async () => {
    const antes = await api<Summary>('GET', '/tasks/summary');
    expect(antes.status).toBe(200);

    await createTask({ title: uniqueTitle('Atrasada'), dueDate: '2000-01-01' });
    const concluida = await createTask({ title: uniqueTitle('Concluida atrasada'), dueDate: '2000-01-01' });
    await api('PATCH', `/tasks/${concluida.id}/status`, { status: 'done' });

    const depois = await api<Summary>('GET', '/tasks/summary');
    expect(depois.status).toBe(200);
    expect(depois.body.total).toBe(antes.body.total + 2);
    expect(depois.body.byStatus.todo).toBe(antes.body.byStatus.todo + 1);
    expect(depois.body.byStatus.done).toBe(antes.body.byStatus.done + 1);
    // Tarefa concluida nao conta como atrasada
    expect(depois.body.overdue).toBe(antes.body.overdue + 1);
  });
});

describe('CA07 - Remover tarefa', () => {
  it('Dado uma tarefa, Quando a removo, Entao recebo 204 e ela deixa de existir', async () => {
    const created = await createTask({ title: uniqueTitle('Remover') });

    const res = await api('DELETE', `/tasks/${created.id}`);
    expect(res.status).toBe(204);

    const depois = await api('GET', `/tasks/${created.id}`);
    expect(depois.status).toBe(404);
  });

  it('Dado um id inexistente, Quando removo, Entao recebo 404', async () => {
    const res = await api('DELETE', '/tasks/id-que-nao-existe');
    expect(res.status).toBe(404);
  });
});

describe('CA08 - Jornada completa do usuario', () => {
  it('cria, consulta, atualiza, conclui e remove uma tarefa', async () => {
    const title = uniqueTitle('Jornada');
    const created = await createTask({ title, priority: 'low' });

    const lista = await api<Task[]>('GET', '/tasks');
    expect(lista.body.map((t) => t.id)).toContain(created.id);

    await api('PATCH', `/tasks/${created.id}`, { priority: 'high' });
    await api('PATCH', `/tasks/${created.id}/status`, { status: 'done' });

    const final = await api<Task>('GET', `/tasks/${created.id}`);
    expect(final.body).toMatchObject({ title, priority: 'high', status: 'done' });

    expect((await api('DELETE', `/tasks/${created.id}`)).status).toBe(204);
    expect((await api('GET', `/tasks/${created.id}`)).status).toBe(404);
  });
});
