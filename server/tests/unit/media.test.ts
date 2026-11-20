import { describe, expect, it } from 'vitest';
import { detectImageType, MediaService } from '../../src/services/MediaService';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const webp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from('WEBPVP8 '),
]);

describe('detectImageType (checks the real file bytes)', () => {
  it('recognises JPG, PNG and WebP', () => {
    expect(detectImageType(jpg)?.ext).toBe('jpg');
    expect(detectImageType(png)?.ext).toBe('png');
    expect(detectImageType(webp)?.ext).toBe('webp');
  });

  it('rejects a text file pretending to be an image', () => {
    expect(detectImageType(Buffer.from('hello, I am not a photo'))).toBeNull();
  });

  it('rejects other file types such as PDF and GIF', () => {
    expect(detectImageType(Buffer.from('%PDF-1.7'))).toBeNull();
    expect(detectImageType(Buffer.from('GIF89a'))).toBeNull();
  });
});

describe('MediaService.isOurPhoto', () => {
  const media = new MediaService();
  const ours = 'https://test-bucket.s3.ap-southeast-2.amazonaws.com/public/services/abc.jpg';

  it('accepts photos stored in our own bucket', () => {
    expect(media.isOurPhoto(ours)).toBe(true);
  });

  it('rejects photos from anywhere else', () => {
    expect(media.isOurPhoto('https://example.com/cat.jpg')).toBe(false);
    expect(
      media.isOurPhoto('https://other-bucket.s3.ap-southeast-2.amazonaws.com/public/x.jpg'),
    ).toBe(false);
  });

  it('rejects files outside the public folder and non https links', () => {
    expect(
      media.isOurPhoto('https://test-bucket.s3.ap-southeast-2.amazonaws.com/private/x.jpg'),
    ).toBe(false);
    expect(media.isOurPhoto(ours.replace('https', 'http'))).toBe(false);
    expect(media.isOurPhoto('not a url')).toBe(false);
  });
});
