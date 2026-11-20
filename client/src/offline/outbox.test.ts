import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enqueue, flushOutbox, pendingChanges } from './outbox';
import { getDb } from './db';

const cancel = (bookingId: string) => ({
  method: 'DELETE' as const,
  path: `/bookings/${bookingId}`,
  bookingId,
  kind: 'cancel' as const,
  label: `Cancel ${bookingId}`,
});

const respond = (status: number, body: unknown = {}) =>
  Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status }));

beforeEach(async () => {
  const db = await getDb();
  await db.clear('outbox');
});

afterEach(() => vi.unstubAllGlobals());

describe('offline outbox', () => {
  it('queues changes made offline', async () => {
    await enqueue(cancel('b1'));
    await enqueue(cancel('b2'));
    expect((await pendingChanges()).map((i) => i.bookingId)).toEqual(['b1', 'b2']);
  });

  it('keeps only the latest change for the same booking', async () => {
    await enqueue({ ...cancel('b1'), method: 'PUT', kind: 'reschedule', body: { start: 'x' } });
    await enqueue(cancel('b1'));
    const items = await pendingChanges();
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('cancel');
  });

  it('sends everything in order once back online and empties the queue', async () => {
    const fetchMock = vi.fn(() => respond(200, {}));
    vi.stubGlobal('fetch', fetchMock);
    await enqueue(cancel('b1'));
    await enqueue(cancel('b2'));

    const result = await flushOutbox();

    expect(result.synced.map((i) => i.bookingId)).toEqual(['b1', 'b2']);
    expect(result.remaining).toBe(0);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/bookings/b1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('stops at the first network failure and keeps the rest for later', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
    await enqueue(cancel('b1'));

    const result = await flushOutbox();
    expect(result.synced).toEqual([]);
    expect(result.remaining).toBe(1);
  });

  it('drops a change the server refuses and reports why', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respond(409, { error: { message: 'That time is not available any more' } })),
    );
    await enqueue({ ...cancel('b1'), method: 'PUT', kind: 'reschedule', body: { start: 'x' } });

    const result = await flushOutbox();
    expect(result.rejected[0].message).toBe('That time is not available any more');
    expect(result.remaining).toBe(0);
  });

  it('keeps the change if the session expired (401), so it can be sent after signing in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respond(401, {})),
    );
    await enqueue(cancel('b1'));
    expect((await flushOutbox()).remaining).toBe(1);
  });
});
