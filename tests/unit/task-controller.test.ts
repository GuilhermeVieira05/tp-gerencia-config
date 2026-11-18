import { NotFoundError, ValidationError } from '../../src/domain/errors';
import { Task } from '../../src/domain/task';
import { TaskService } from '../../src/domain/task-service';
import { TaskController } from '../../src/http/task-controller';
import { mockRequest, mockResponse } from '../helpers/http-mocks';

const task: Task = {
  id: 'id-1',
  title: 'Tarefa',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  createdAt: '2026-11-13T12:00:00.000Z',
  updatedAt: '2026-11-13T12:00:00.000Z',
};

// O servico e dublado: aqui so se testa a traducao HTTP -> chamada de dominio.
function makeService() {
  return {
    create: jest.fn(),
    get: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
    summary: jest.fn(),
  };
}

describe('TaskController', () => {
  let service: ReturnType<typeof makeService>;
  let controller: TaskController;

  beforeEach(() => {
    service = makeService();
    controller = new TaskController(service as unknown as TaskService);
  });

  describe('create', () => {
    it('responde 201 com a tarefa criada', () => {
      service.create.mockReturnValue(task);
      const res = mockResponse();
      controller.create(mockRequest({ body: { title: 'Tarefa', priority: 'high' } }), res);
      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Tarefa', priority: 'high' }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(task);
    });
    it('nao repassa id nem status enviados pelo cliente', () => {
      service.create.mockReturnValue(task);
      controller.create(
        mockRequest({ body: { title: 'X', id: 'forjado', status: 'done' } }),
        mockResponse(),
      );
      const input = service.create.mock.calls[0][0];
      expect(input).not.toHaveProperty('id');
      expect(input).not.toHaveProperty('status');
    });
    it('propaga o erro de validacao do dominio', () => {
      service.create.mockImplementation(() => {
        throw new ValidationError('O titulo e obrigatorio');
      });
      const res = mockResponse();
      expect(() => controller.create(mockRequest({ body: {} }), res)).toThrow(ValidationError);
      expect(res.json).not.toHaveBeenCalled();
    });
    it('rejeita corpo invalido sem chamar o servico', () => {
      expect(() => controller.create(mockRequest({ body: [] }), mockResponse())).toThrow(
        ValidationError,
      );
      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('lista sem filtro', () => {
      service.list.mockReturnValue([task]);
      const res = mockResponse();
      controller.list(mockRequest(), res);
      expect(service.list).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith([task]);
    });
    it('repassa os filtros da query', () => {
      service.list.mockReturnValue([]);
      controller.list(mockRequest({ query: { status: 'done', priority: 'low' } }), mockResponse());
      expect(service.list).toHaveBeenCalledWith({ status: 'done', priority: 'low' });
    });
    it('rejeita filtro invalido sem chamar o servico', () => {
      expect(() =>
        controller.list(mockRequest({ query: { status: 'x' } }), mockResponse()),
      ).toThrow(ValidationError);
      expect(service.list).not.toHaveBeenCalled();
    });
  });

  describe('summary', () => {
    it('responde com o resumo do servico', () => {
      const summary = { total: 1, byStatus: { todo: 1, doing: 0, done: 0 }, overdue: 0 };
      service.summary.mockReturnValue(summary);
      const res = mockResponse();
      controller.summary(mockRequest(), res);
      expect(res.json).toHaveBeenCalledWith(summary);
    });
  });

  describe('get', () => {
    it('busca pelo id da rota', () => {
      service.get.mockReturnValue(task);
      const res = mockResponse();
      controller.get(mockRequest({ params: { id: 'id-1' } }), res);
      expect(service.get).toHaveBeenCalledWith('id-1');
      expect(res.json).toHaveBeenCalledWith(task);
    });
    it('propaga NotFoundError', () => {
      service.get.mockImplementation(() => {
        throw new NotFoundError('nope');
      });
      expect(() => controller.get(mockRequest({ params: { id: 'nope' } }), mockResponse())).toThrow(
        NotFoundError,
      );
    });
  });

  describe('update', () => {
    it('envia so os campos informados', () => {
      service.update.mockReturnValue(task);
      const res = mockResponse();
      controller.update(mockRequest({ params: { id: 'id-1' }, body: { title: 'Novo' } }), res);
      expect(service.update).toHaveBeenCalledWith('id-1', { title: 'Novo' });
      expect(res.json).toHaveBeenCalledWith(task);
    });
    it('rejeita corpo invalido sem chamar o servico', () => {
      expect(() =>
        controller.update(
          mockRequest({ params: { id: 'id-1' }, body: { description: 5 } }),
          mockResponse(),
        ),
      ).toThrow(ValidationError);
      expect(service.update).not.toHaveBeenCalled();
    });
    it('propaga NotFoundError', () => {
      service.update.mockImplementation(() => {
        throw new NotFoundError('nope');
      });
      expect(() =>
        controller.update(mockRequest({ params: { id: 'nope' }, body: {} }), mockResponse()),
      ).toThrow(NotFoundError);
    });
  });

  describe('changeStatus', () => {
    it('repassa o novo status', () => {
      service.changeStatus.mockReturnValue({ ...task, status: 'doing' });
      const res = mockResponse();
      controller.changeStatus(
        mockRequest({ params: { id: 'id-1' }, body: { status: 'doing' } }),
        res,
      );
      expect(service.changeStatus).toHaveBeenCalledWith('id-1', 'doing');
      expect(res.json).toHaveBeenCalledWith({ ...task, status: 'doing' });
    });
    it('rejeita status invalido sem chamar o servico', () => {
      expect(() =>
        controller.changeStatus(
          mockRequest({ params: { id: 'id-1' }, body: { status: 'arquivada' } }),
          mockResponse(),
        ),
      ).toThrow(ValidationError);
      expect(service.changeStatus).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('responde 204 sem corpo', () => {
      const res = mockResponse();
      controller.remove(mockRequest({ params: { id: 'id-1' } }), res);
      expect(service.remove).toHaveBeenCalledWith('id-1');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledWith();
      expect(res.json).not.toHaveBeenCalled();
    });
    it('propaga NotFoundError e nao responde 204', () => {
      service.remove.mockImplementation(() => {
        throw new NotFoundError('nope');
      });
      const res = mockResponse();
      expect(() => controller.remove(mockRequest({ params: { id: 'nope' } }), res)).toThrow(
        NotFoundError,
      );
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
