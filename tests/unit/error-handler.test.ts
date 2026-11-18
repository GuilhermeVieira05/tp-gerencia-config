import { NotFoundError, ValidationError } from '../../src/domain/errors';
import { errorHandler, notFoundHandler, statusFromError } from '../../src/http/error-handler';
import { mockRequest, mockResponse } from '../helpers/http-mocks';

// Imita os erros do body-parser (http-errors): Error com `status` e `type`.
function httpError(status: number, message: string, type?: string): Error {
  return Object.assign(new Error(message), { status, type });
}

describe('statusFromError', () => {
  it('ValidationError vira 400', () => {
    expect(statusFromError(new ValidationError('x'))).toBe(400);
  });
  it('NotFoundError vira 404', () => {
    expect(statusFromError(new NotFoundError('id'))).toBe(404);
  });
  it.each([400, 413, 415])('mantem o status %i de erro do cliente', (status) => {
    expect(statusFromError(httpError(status, 'x'))).toBe(status);
  });
  it.each([
    ['status 500 explicito', httpError(500, 'x')],
    ['status 3xx', httpError(302, 'x')],
    ['Error comum', new Error('boom')],
    ['texto', 'boom'],
    ['null', null],
    ['objeto que nao e Error', { status: 400 }],
  ])('trata %s como 500', (_caso, err) => {
    expect(statusFromError(err)).toBe(500);
  });
});

describe('notFoundHandler', () => {
  it('responde 404 com mensagem', () => {
    const res = mockResponse();
    notFoundHandler(mockRequest(), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Rota nao encontrada' });
  });
});

describe('errorHandler', () => {
  const next = jest.fn();
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    next.mockClear();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => consoleError.mockRestore());

  it('ValidationError: 400 com a mensagem do dominio', () => {
    const res = mockResponse();
    errorHandler(new ValidationError('O titulo e obrigatorio'), mockRequest(), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'O titulo e obrigatorio' });
  });

  it('NotFoundError: 404 com a mensagem do dominio', () => {
    const res = mockResponse();
    errorHandler(new NotFoundError('abc'), mockRequest(), res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tarefa abc nao encontrada' });
  });

  it('JSON malformado: 400 com mensagem propria', () => {
    const res = mockResponse();
    errorHandler(
      httpError(400, 'Unexpected token } in JSON', 'entity.parse.failed'),
      mockRequest(),
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'JSON invalido no corpo da requisicao' });
  });

  it('outro erro de cliente: mantem status e mensagem', () => {
    const res = mockResponse();
    errorHandler(httpError(413, 'request entity too large'), mockRequest(), res, next);
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({ error: 'request entity too large' });
  });

  it('erro inesperado: 500 generico, sem vazar detalhes, e registra no log', () => {
    const res = mockResponse();
    const err = new Error('senha do banco: 1234');
    errorHandler(err, mockRequest(), res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno do servidor' });
    expect(consoleError).toHaveBeenCalledWith(err);
  });

  it('nao registra no log erros de cliente', () => {
    errorHandler(new ValidationError('x'), mockRequest(), mockResponse(), next);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('resposta ja iniciada: delega ao handler padrao do Express', () => {
    const res = mockResponse({ headersSent: true });
    const err = new Error('tarde demais');
    errorHandler(err, mockRequest(), res, next);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
