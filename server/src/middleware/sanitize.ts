import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

// Mongo treats keys like $gt, $ne or $where as operators. If a client sends
// { "email": { "$ne": null } } it could change what a query matches, which is
// the NoSQL version of SQL injection. We refuse those keys outright.
const isUnsafeKey = (key: string) => key.startsWith('$') || key.includes('.') || key.includes('[$');

export function findUnsafeKey(value: unknown, depth = 0): string | null {
  if (depth > 10 || value === null || typeof value !== 'object') return null;

  for (const [key, child] of Object.entries(value)) {
    if (isUnsafeKey(key)) return key;
    const nested = findUnsafeKey(child, depth + 1);
    if (nested) return nested;
  }
  return null;
}

export const rejectNoSqlOperators: RequestHandler = (req, _res, next) => {
  const badKey = findUnsafeKey(req.body) ?? findUnsafeKey(req.query) ?? findUnsafeKey(req.params);

  if (badKey) {
    logger.warn('Blocked request with an operator key', {
      key: badKey,
      path: req.originalUrl,
      ip: req.ip,
    });
    return next(AppError.badRequest('Request contains keys that are not allowed'));
  }
  next();
};
