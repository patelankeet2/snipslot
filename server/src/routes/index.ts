import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import { apiLimiter } from '../middleware/rateLimit';

// All API routes are mounted here under /api
const router = Router();

router.use('/health', healthRoutes);

router.use(apiLimiter);
router.use('/auth', authRoutes);

export default router;
