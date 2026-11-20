import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, errorMessage, NetworkError, UNAUTHORIZED_EVENT } from './client';

const reply = (status: number, body?: unknown) =>
  vi.fn(() =>
    Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status })),
  );

afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('sends JSON with the session cookie and returns the parsed body', async () => {
    const fetchMock = reply(200, { services: [] });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.post('/services', { name: 'Cut' })).resolves.toEqual({ services: [] });
    expect(fetchMock).toHaveBeenCalledWith('/api/services', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"Cut"}',
    });
  });

  it('lets the browser set the header for file uploads', async () => {
    const fetchMock = reply(201, { url: 'x' });
    vi.stubGlobal('fetch', fetchMock);
    const form = new FormData();

    await api.upload('/uploads/image', form);
    const options = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(options.headers).toBeUndefined();
    expect(options.body).toBe(form);
  });

  it('turns an error response into an ApiError with the field details', async () => {
    vi.stubGlobal(
      'fetch',
      reply(400, {
        error: {
          code: 'BAD_REQUEST',
          message: 'Some fields are invalid',
          details: [{ field: 'price', message: 'Too low' }],
        },
      }),
    );

    const err = await api.post('/services', {}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
      details: [{ field: 'price', message: 'Too low' }],
    });
  });

  it('reports no connection as a NetworkError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
    const err = await api.get('/services').catch((e) => e);
    expect(err).toBeInstanceOf(NetworkError);
    expect(errorMessage(err)).toBe('You appear to be offline');
  });

  it('announces an expired session so the app can sign the user out', async () => {
    vi.stubGlobal(
      'fetch',
      reply(401, { error: { code: 'UNAUTHORIZED', message: 'Please sign in' } }),
    );
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);

    await api.get('/bookings/mine').catch(() => undefined);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it('handles 204 No Content', async () => {
    vi.stubGlobal('fetch', reply(204));
    await expect(api.post('/auth/logout')).resolves.toBeUndefined();
  });

  it('gives a safe generic message for unexpected errors', () => {
    expect(errorMessage(new Error('stack trace details'))).toBe(
      'Something went wrong, please try again',
    );
  });
});
