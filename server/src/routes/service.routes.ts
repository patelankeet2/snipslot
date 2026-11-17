import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParamSchema } from '../validators/common.schemas';
import {
  serviceCreateSchema,
  serviceListQuerySchema,
  serviceUpdateSchema,
} from '../validators/service.schemas';
import {
  createService,
  deleteService,
  getService,
  listServices,
  updateService,
} from '../controllers/service.controller';

const router = Router();

// anyone signed in can read the menu
router.use(requireAuth);
router.get('/', validate({ query: serviceListQuerySchema }), listServices);
router.get('/:id', validate({ params: idParamSchema }), getService);

// only the owner can change it
router.post('/', requireRole('owner'), validate({ body: serviceCreateSchema }), createService);
router.put(
  '/:id',
  requireRole('owner'),
  validate({ params: idParamSchema, body: serviceUpdateSchema }),
  updateService,
);
router.delete('/:id', requireRole('owner'), validate({ params: idParamSchema }), deleteService);

export default router;
