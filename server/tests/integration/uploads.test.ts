import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Stand in for AWS: capture what would have been sent to S3
const send = vi.fn();
vi.mock('../../src/config/s3', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/config/s3')>();
  return { ...real, getS3Client: () => ({ send }) };
});

import { createApp } from '../../src/app';
import { clearTestDb, startTestDb, stopTestDb } from '../helpers/db';
import { createUser, seedShop } from '../helpers/factory';

const app = createApp();
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(200),
]);

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearTestDb();
  send.mockReset();
  send.mockResolvedValue({});
});

const upload = (
  auth: Record<string, string>,
  file: Buffer,
  name: string,
  type: string,
  folder = 'services',
) =>
  request(app)
    .post(`/api/uploads/image?folder=${folder}`)
    .set(auth)
    .attach('photo', file, { filename: name, contentType: type });

describe('photo uploads', () => {
  it('stores a real PNG in S3 under a random name and returns its public URL', async () => {
    const { auth } = await createUser('owner');
    const res = await upload(auth, png, 'fade.png', 'image/png');

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(
      /^https:\/\/test-bucket\.s3\.ap-southeast-2\.amazonaws\.com\/public\/services\/[0-9a-f-]{36}\.png$/,
    );
    const command = send.mock.calls[0][0];
    expect(command.input).toMatchObject({ Bucket: 'test-bucket', ContentType: 'image/png' });
  });

  it('rejects a text file renamed to .png without touching S3', async () => {
    const { auth } = await createUser('owner');
    const res = await upload(auth, Buffer.from('not really a picture'), 'fake.png', 'image/png');
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects files over 2 MB', async () => {
    const { auth } = await createUser('owner');
    const big = Buffer.concat([png, Buffer.alloc(2 * 1024 * 1024)]);
    const res = await upload(auth, big, 'huge.png', 'image/png');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Photo must be 2 MB or smaller');
  });

  it('rejects other file types', async () => {
    const { auth } = await createUser('owner');
    const res = await upload(auth, Buffer.from('%PDF-1.7'), 'menu.pdf', 'application/pdf');
    expect(res.status).toBe(400);
  });

  it('is owner only', async () => {
    const { auth } = await createUser('customer');
    expect((await upload(auth, png, 'me.png', 'image/png')).status).toBe(403);
  });

  it('deletes the old photo from S3 when a service gets a new one', async () => {
    const { auth } = await createUser('owner');
    const { fade } = await seedShop();
    const first = (await upload(auth, png, 'a.png', 'image/png')).body.url;
    const second = (await upload(auth, png, 'b.png', 'image/png')).body.url;

    await request(app).put(`/api/services/${fade.id}`).set(auth).send({ photoUrl: first });
    send.mockClear();
    await request(app).put(`/api/services/${fade.id}`).set(auth).send({ photoUrl: second });

    // the clean up runs in the background, give it a moment
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send.mock.calls[0][0].input.Key).toBe(new URL(first).pathname.slice(1));
  });
});
