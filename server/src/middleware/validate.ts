import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

// Validates and cleans the request before it reaches the controller.
// Unknown fields are stripped by the schemas, so nothing extra reaches the database.
// A ZodError is turned into a 400 response by the error handler.
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.query) {
      // req.query is a getter in Express 5, so replace it on this request only
      Object.defineProperty(req, 'query', {
        value: schemas.query.parse(req.query),
        writable: true,
        configurable: true,
      });
    }
    next();
  };
