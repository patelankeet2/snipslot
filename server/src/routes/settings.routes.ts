import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { hoursUpdateSchema } from '../validators/settings.schemas';
import { getSettings, updateHours } from '../controllers/settings.controller';

const router = Router();

router.use(requireAuth);
router.get('/', getSettings);
router.put('/hours', requireRole('owner'), validate({ body: hoursUpdateSchema }), updateHours);

export default router;
