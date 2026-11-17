import { Router } from 'express';
import { googleLogin, logout, me, session } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import { googleLoginSchema } from '../validators/auth.schemas';

const router = Router();

router.post('/google', authLimiter, validate({ body: googleLoginSchema }), googleLogin);
router.get('/session', session);
router.get('/me', requireAuth, me);
router.post('/logout', logout);

export default router;
