import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

// Turn the different kinds of errors we can hit into one consistent shape
function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return AppError.badRequest('Some fields are invalid', details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return AppError.badRequest(`Invalid value for ${err.path}`);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return AppError.badRequest('Some fields are invalid', details);
  }

  // unique index violation, eg two bookings for the same barber and time
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    return AppError.conflict('That record already exists');
  }

  // express.json() throws this for a malformed body
  if (
    typeof err === 'object' &&
    err !== null &&
    (err as { type?: string }).type === 'entity.parse.failed'
  ) {
    return AppError.badRequest('Request body is not valid JSON');
  }

  return new AppError(500, 'Something went wrong on our side', 'INTERNAL_ERROR');
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const appError = toAppError(err);
  const context = { method: req.method, path: req.originalUrl, status: appError.statusCode };

  if (appError.statusCode >= 500) {
    // keep the real stack in the logs, never send it to the client
    logger.error(err instanceof Error ? err.message : String(err), {
      ...context,
      stack: err instanceof Error ? err.stack : undefined,
    });
  } else {
    logger.warn(appError.message, context);
  }

  res.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details ? { details: appError.details } : {}),
    },
  });
};
