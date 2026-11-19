import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { singlePhoto } from '../middleware/upload';
import { mediaService } from '../container';

const router = Router();

const folderQuery = z.object({ folder: z.enum(['services', 'barbers']) });

// Owner uploads a photo, gets back its URL, then saves that URL on the service or barber
router.post(
  '/image',
  requireAuth,
  requireRole('owner'),
  validate({ query: folderQuery }),
  singlePhoto,
  async (req, res) => {
    const { url } = await mediaService.uploadPhoto(
      req.file!.buffer,
      req.query.folder as 'services' | 'barbers',
    );
    res.status(201).json({ url });
  },
);

export default router;
