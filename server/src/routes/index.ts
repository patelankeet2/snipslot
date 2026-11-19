import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import serviceRoutes from './service.routes';
import barberRoutes from './barber.routes';
import settingsRoutes from './settings.routes';
import bookingRoutes from './booking.routes';
import slotRoutes from './slot.routes';
import pushRoutes from './push.routes';
import jobRoutes from './job.routes';
import uploadRoutes from './upload.routes';
import { apiLimiter } from '../middleware/rateLimit';

// All API routes are mounted here under /api
const router = Router();

router.use('/health', healthRoutes);
// scheduler trigger, protected by its own secret rather than a user session
router.use('/jobs', jobRoutes);

router.use(apiLimiter);
router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/barbers', barberRoutes);
router.use('/settings', settingsRoutes);
router.use('/slots', slotRoutes);
router.use('/bookings', bookingRoutes);
router.use('/push', pushRoutes);
router.use('/uploads', uploadRoutes);

export default router;
