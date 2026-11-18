import { Request, Response } from 'express';

// Dublês de req/res para testar controlador e handlers sem subir o Express.

export type MockResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
};

export function mockResponse(overrides: Partial<Response> = {}): MockResponse {
  const res: Record<string, unknown> = { headersSent: false, ...overrides };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as unknown as MockResponse;
}

export function mockRequest(parts: {
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
} = {}): Request {
  return {
    body: parts.body ?? {},
    query: parts.query ?? {},
    params: parts.params ?? {},
  } as unknown as Request;
}
