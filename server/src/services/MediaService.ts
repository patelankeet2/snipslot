import { randomUUID } from 'crypto';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';
import { bucketHost, getS3Client, publicUrl } from '../config/s3';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export type PhotoFolder = 'services' | 'barbers';

// The browser tells us the file type, but anyone can lie about that.
// The first bytes of the file ("magic numbers") show what it really is.
const SIGNATURES: { type: string; ext: string; matches: (b: Buffer) => boolean }[] = [
  {
    type: 'image/jpeg',
    ext: 'jpg',
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    type: 'image/png',
    ext: 'png',
    matches: (b) =>
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    type: 'image/webp',
    ext: 'webp',
    matches: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
];

export function detectImageType(buffer: Buffer) {
  return SIGNATURES.find((s) => s.matches(buffer)) ?? null;
}

export class MediaService {
  private assertEnabled() {
    if (!env.uploadsEnabled) {
      throw new AppError(503, 'Photo uploads are not set up on this server', 'UPLOADS_DISABLED');
    }
  }

  async uploadPhoto(buffer: Buffer, folder: PhotoFolder) {
    // check the file itself first, so a bad file is always a 400 whatever the setup
    const kind = detectImageType(buffer);
    if (!kind) throw AppError.badRequest('Only JPG, PNG or WebP photos are allowed');

    this.assertEnabled();

    // random name: nobody can guess other photo URLs, and a new photo never
    // overwrites an old one that a cached page might still show
    const key = `public/${folder}/${randomUUID()}.${kind.ext}`;

    await getS3Client().send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: kind.type,
        // the name never changes, so browsers can keep it for a year
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    logger.info('Photo uploaded to S3', { key, bytes: buffer.length });
    return { url: publicUrl(key) };
  }

  // True only for photos we stored ourselves, so a crafted URL can never
  // point the API at somebody else's file
  isOurPhoto(url?: string | null) {
    if (!url || !env.uploadsEnabled) return false;
    try {
      const u = new URL(url);
      return (
        u.protocol === 'https:' && u.host === bucketHost() && u.pathname.startsWith('/public/')
      );
    } catch {
      return false;
    }
  }

  // Best effort clean up when a photo is replaced or its record deleted.
  // A failure here should never block the actual edit.
  async deletePhoto(url?: string | null) {
    if (!this.isOurPhoto(url)) return;
    const key = new URL(url!).pathname.slice(1);
    try {
      await getS3Client().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
      logger.info('Old photo removed from S3', { key });
    } catch (err) {
      logger.warn('Could not remove old photo', {
        key,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
