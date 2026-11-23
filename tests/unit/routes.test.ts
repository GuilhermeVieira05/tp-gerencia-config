import { Router } from 'express';
import { createHealthRouter } from '../../src/http/health-routes';
import { TaskController } from '../../src/http/task-controller';
import { createTaskRouter } from '../../src/http/task-routes';
import { mockRequest, mockResponse } from '../helpers/http-mocks';

// Le a tabela de rotas registrada no Router, sem subir servidor.
interface Layer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: (req: unknown, res: unknown) => void }>;
  };
}

function routesOf(router: Router) {
  return (router as unknown as { stack: Layer[] }).stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      key: `${Object.keys(layer.route!.methods)[0].toUpperCase()} ${layer.route!.path}`,
      handle: layer.route!.stack[0].handle,
    }));
}

describe('createTaskRouter', () => {
  const controller = {
    create: jest.fn(),
    list: jest.fn(),
    summary: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
  };
  const routes = routesOf(createTaskRouter(controller as unknown as TaskController));

  beforeEach(() => jest.clearAllMocks());

  it('registra exatamente as rotas do contrato HTTP', () => {
    expect(routes.map((r) => r.key).sort()).toEqual(
      [
        'POST /',
        'GET /',
        'GET /summary',
        'GET /:id',
        'PATCH /:id',
        'PATCH /:id/status',
        'DELETE /:id',
      ].sort(),
    );
  });

  it('registra /summary antes de /:id (senao "summary" viraria um id)', () => {
    const keys = routes.map((r) => r.key);
    expect(keys.indexOf('GET /summary')).toBeLessThan(keys.indexOf('GET /:id'));
  });

  it.each([
    ['POST /', 'create'],
    ['GET /', 'list'],
    ['GET /summary', 'summary'],
    ['GET /:id', 'get'],
    ['PATCH /:id', 'update'],
    ['PATCH /:id/status', 'changeStatus'],
    ['DELETE /:id', 'remove'],
  ] as const)('%s chama controller.%s', (key, method) => {
    const req = mockRequest();
    const res = mockResponse();
    routes.find((r) => r.key === key)!.handle(req, res);
    expect(controller[method]).toHaveBeenCalledWith(req, res);
  });
});

describe('createHealthRouter', () => {
  const routes = routesOf(createHealthRouter());

  it('registra apenas GET /health', () => {
    expect(routes.map((r) => r.key)).toEqual(['GET /health']);
  });
  it('responde status ok com a versao recebida', () => {
    const res = mockResponse();
    routesOf(createHealthRouter('1.2.3'))[0].handle(mockRequest(), res);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok', version: '1.2.3' });
  });
  it('sem versao informada, usa APP_VERSION ou "dev"', () => {
    const res = mockResponse();
    routes[0].handle(mockRequest(), res);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok', version: process.env.APP_VERSION ?? 'dev' });
  });
});
