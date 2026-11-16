import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const common = {
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, try again soon' } },
};

// sign in is the obvious target for abuse, so it gets a tight limit
export const authLimiter = rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 20 });

// general limit for the rest of the API
export const apiLimiter = rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 300 });
