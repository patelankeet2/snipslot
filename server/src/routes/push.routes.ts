import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  pushSubscriptionSchema,
  testPushSchema,
  unsubscribeSchema,
} from '../validators/push.schemas';
import { getPublicKey, sendTest, subscribe, unsubscribe } from '../controllers/push.controller';

const router = Router();

router.get('/public-key', getPublicKey);
router.post('/subscribe', requireAuth, validate({ body: pushSubscriptionSchema }), subscribe);
router.delete('/subscribe', requireAuth, validate({ body: unsubscribeSchema }), unsubscribe);
router.post(
  '/test',
  requireAuth,
  requireRole('owner'),
  validate({ body: testPushSchema }),
  sendTest,
);

export default router;
