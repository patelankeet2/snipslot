import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { slotsQuerySchema } from '../validators/booking.schemas';
import { getSlots } from '../controllers/booking.controller';

const router = Router();

// free start times for one service with one barber on one day
router.get('/', requireAuth, validate({ query: slotsQuerySchema }), getSlots);

export default router;
