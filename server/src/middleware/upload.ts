import multer from 'multer';
import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB is plenty for a phone photo of a haircut
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// Keep the file in memory: it goes straight to S3, never to the server's disk
const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 5 },
  fileFilter: (_req, file, cb) => {
    // first quick check on the declared type; the real bytes are checked again later
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(AppError.badRequest('Only JPG, PNG or WebP photos are allowed'));
  },
}).single('photo');

// Wrap multer so its errors come out as our normal 400 responses
export const singlePhoto: RequestHandler = (req, res, next) => {
  parser(req, res, (err: unknown) => {
    if (!err) {
      if (!req.file) return next(AppError.badRequest('Choose a photo to upload'));
      return next();
    }
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be 2 MB or smaller' : 'Upload a single photo';
      return next(AppError.badRequest(message));
    }
    next(err);
  });
};
