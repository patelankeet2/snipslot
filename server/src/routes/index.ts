import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import serviceRoutes from './service.routes';
import barberRoutes from './barber.routes';
import settingsRoutes from './settings.routes';
import bookingRoutes from './booking.routes';
import { apiLimiter } from '../middleware/rateLimit';

// All API routes are mounted here under /api
const router = Router();

router.use('/health', healthRoutes);

router.use(apiLimiter);
router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/barbers', barberRoutes);
router.use('/settings', settingsRoutes);
router.use('/bookings', bookingRoutes);

export default router;
