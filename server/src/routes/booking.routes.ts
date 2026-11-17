import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParamSchema } from '../validators/common.schemas';
import { scheduleQuerySchema, statusUpdateSchema } from '../validators/booking.schemas';
import { getSchedule, updateBookingStatus } from '../controllers/booking.controller';

const router = Router();

router.use(requireAuth);

// owner only: the day view and closing off appointments
router.get(
  '/schedule',
  requireRole('owner'),
  validate({ query: scheduleQuerySchema }),
  getSchedule,
);
router.patch(
  '/:id/status',
  requireRole('owner'),
  validate({ params: idParamSchema, body: statusUpdateSchema }),
  updateBookingStatus,
);

export default router;
