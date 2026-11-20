import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { AuthService } from '../../src/services/AuthService';
import { UserRepository } from '../../src/repositories/UserRepository';
import type { GoogleProfile, TokenVerifier } from '../../src/services/GoogleTokenVerifier';
import { AppError } from '../../src/utils/AppError';
import { verifySessionToken } from '../../src/utils/jwt';
import { clearTestDb, startTestDb, stopTestDb } from '../helpers/db';
import { createUser } from '../helpers/factory';

const app = createApp();

// Stands in for Google so tests never call the real service
class FakeVerifier implements TokenVerifier {
  constructor(private readonly profiles: Record<string, GoogleProfile>) {}
  async verify(idToken: string) {
    const profile = this.profiles[idToken];
    if (!profile) throw AppError.unauthorized('Google sign-in could not be verified');
    return profile;
  }
}

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

describe('AuthService.loginWithGoogle', () => {
  const verifier = new FakeVerifier({
    'owner-token': { googleId: 'g-owner', email: 'owner@test.nz', name: 'Shop Owner' },
    'customer-token': { googleId: 'g-cust', email: 'aroha@test.nz', name: 'Aroha' },
  });
  const auth = new AuthService(new UserRepository(), verifier, ['owner@test.nz']);

  it('creates a customer on first sign in and returns a valid session token', async () => {
    const { user, token } = await auth.loginWithGoogle('customer-token');
    expect(user.role).toBe('customer');
    expect(user.email).toBe('aroha@test.nz');
    expect(verifySessionToken(token)).toEqual({ sub: user.id, role: 'customer' });
  });

  it('gives the owner role only to emails on the owner list', async () => {
    const { user } = await auth.loginWithGoogle('owner-token');
    expect(user.role).toBe('owner');
  });

  it('updates the same user on the next sign in instead of creating a duplicate', async () => {
    const first = await auth.loginWithGoogle('customer-token');
    const second = await auth.loginWithGoogle('customer-token');
    expect(second.user.id).toBe(first.user.id);
    expect(second.user.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(
      first.user.lastLoginAt!.getTime(),
    );
  });

  it('removes the owner role if the email is taken off the list', async () => {
    await auth.loginWithGoogle('owner-token');
    const demoted = new AuthService(new UserRepository(), verifier, []);
    const { user } = await demoted.loginWithGoogle('owner-token');
    expect(user.role).toBe('customer');
  });

  it('rejects a token Google did not issue', async () => {
    await expect(auth.loginWithGoogle('made-up')).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('auth routes', () => {
  it('session says nobody is signed in when there is no cookie', async () => {
    const res = await request(app).get('/api/auth/session');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });

  it('session returns the user for a valid cookie', async () => {
    const { user, token } = await createUser('customer');
    const res = await request(app)
      .get('/api/auth/session')
      .set('Cookie', `snipslot_session=${token}`);
    expect(res.body.user.id).toBe(user.id);
  });

  it('session clears a broken cookie instead of failing', async () => {
    const res = await request(app)
      .get('/api/auth/session')
      .set('Cookie', 'snipslot_session=garbage');
    expect(res.body).toEqual({ user: null });
    expect(res.headers['set-cookie'][0]).toMatch(/snipslot_session=;/);
  });

  it('/me needs a session (401) and works with a Bearer token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);

    const { auth } = await createUser('owner', 'Owner');
    const res = await request(app).get('/api/auth/me').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('owner');
  });

  it('refuses a token for a user that no longer exists', async () => {
    const { user, auth } = await createUser('customer');
    await user.deleteOne();
    const res = await request(app).get('/api/auth/me').set(auth);
    expect(res.status).toBe(401);
  });

  it('rejects a Google credential that is far too short before calling Google', async () => {
    const res = await request(app).post('/api/auth/google').send({ credential: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0]).toEqual({
      field: 'credential',
      message: 'Missing Google credential',
    });
  });

  it('logout clears the cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
    expect(res.headers['set-cookie'][0]).toMatch(/snipslot_session=;.*HttpOnly/);
  });
});
