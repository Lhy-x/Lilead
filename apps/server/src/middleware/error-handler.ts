import { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const errorHandler = (
  err: Error | HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err.message || 'Internal server error';
  const details = err instanceof HttpError ? err.details : undefined;

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({ message, details });
};
