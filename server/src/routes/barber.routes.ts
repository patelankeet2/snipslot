import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParamSchema } from '../validators/common.schemas';
import { serviceListQuerySchema } from '../validators/service.schemas';
import { barberCreateSchema, barberUpdateSchema } from '../validators/barber.schemas';
import {
  createBarber,
  deleteBarber,
  getBarber,
  listBarbers,
  updateBarber,
} from '../controllers/barber.controller';

const router = Router();

router.use(requireAuth);
router.get('/', validate({ query: serviceListQuerySchema }), listBarbers);
router.get('/:id', validate({ params: idParamSchema }), getBarber);

router.post('/', requireRole('owner'), validate({ body: barberCreateSchema }), createBarber);
router.put(
  '/:id',
  requireRole('owner'),
  validate({ params: idParamSchema, body: barberUpdateSchema }),
  updateBarber,
);
router.delete('/:id', requireRole('owner'), validate({ params: idParamSchema }), deleteBarber);

export default router;
