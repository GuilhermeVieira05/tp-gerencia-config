import { NextFunction, Request, Response } from 'express';
import { NotFoundError, ValidationError } from '../domain/errors';

// Erros do body-parser (JSON malformado, corpo grande demais) trazem `status` 4xx.
interface ClientHttpError extends Error {
  status: number;
  type?: string;
}

function isClientHttpError(err: unknown): err is ClientHttpError {
  if (!(err instanceof Error)) return false;
  const { status } = err as Error & { status?: unknown };
  return typeof status === 'number' && status >= 400 && status < 500;
}

export function statusFromError(err: unknown): number {
  if (err instanceof ValidationError) return 400;
  if (err instanceof NotFoundError) return 404;
  if (isClientHttpError(err)) return err.status;
  return 500;
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Rota nao encontrada' });
}

// Middleware de erro do Express: precisa declarar os 4 parametros.
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  const status = statusFromError(err);
  if (status === 500) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
    return;
  }
  const message =
    isClientHttpError(err) && err.type === 'entity.parse.failed'
      ? 'JSON invalido no corpo da requisicao'
      : (err as Error).message;
  res.status(status).json({ error: message });
}
