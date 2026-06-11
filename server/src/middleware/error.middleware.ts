import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error: AppError = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Zod Validation Error handling
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.url} - Status ${statusCode} - ${message}`);
  if (error.stack) {
    console.error(error.stack);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
  });
}
