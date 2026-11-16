import { Router } from 'express';
import healthRoutes from './health.routes';

// All API routes are mounted here under /api
const router = Router();

router.use('/health', healthRoutes);

export default router;
