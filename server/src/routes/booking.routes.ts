import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParamSchema } from '../validators/common.schemas';
import {
  bookingCreateSchema,
  bookingRescheduleSchema,
  myBookingsQuerySchema,
  scheduleQuerySchema,
  statusUpdateSchema,
} from '../validators/booking.schemas';
import {
  cancelBooking,
  createBooking,
  getBooking,
  getSchedule,
  myBookings,
  rescheduleBooking,
  updateBookingStatus,
} from '../controllers/booking.controller';

const router = Router();

router.use(requireAuth);

// fixed paths first, otherwise "/:id" would swallow "mine" and "schedule"
router.get('/mine', validate({ query: myBookingsQuerySchema }), myBookings);
router.get(
  '/schedule',
  requireRole('owner'),
  validate({ query: scheduleQuerySchema }),
  getSchedule,
);

// customers book for themselves
router.post('/', requireRole('customer'), validate({ body: bookingCreateSchema }), createBooking);

// the service layer checks the booking belongs to the customer (or the user is the owner)
router.get('/:id', validate({ params: idParamSchema }), getBooking);
router.put(
  '/:id',
  validate({ params: idParamSchema, body: bookingRescheduleSchema }),
  rescheduleBooking,
);
router.delete('/:id', validate({ params: idParamSchema }), cancelBooking);

router.patch(
  '/:id/status',
  requireRole('owner'),
  validate({ params: idParamSchema, body: statusUpdateSchema }),
  updateBookingStatus,
);

export default router;
