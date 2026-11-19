import { Router, type RequestHandler } from 'express';
import { timingSafeEqual } from 'crypto';
import { env } from '../config/env';
import { reminderJob } from '../container';
import { AppError } from '../utils/AppError';

const router = Router();

// Only our scheduler knows this secret. timingSafeEqual stops anyone guessing it
// character by character from how long the comparison takes.
const requireCronSecret: RequestHandler = (req, _res, next) => {
  const given = Buffer.from(req.get('x-cron-secret') ?? '');
  const expected = Buffer.from(env.CRON_SECRET);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return next(AppError.unauthorized('Invalid job secret'));
  }
  next();
};

// Called every few minutes by a scheduled GitHub Action in production
router.post('/reminders', requireCronSecret, async (_req, res) => {
  const result = await reminderJob.run();
  res.json(result);
});

export default router;
