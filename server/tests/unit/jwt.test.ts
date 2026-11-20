import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { signSessionToken, verifySessionToken } from '../../src/utils/jwt';

describe('session tokens', () => {
  it('round trips the user id and role', () => {
    const token = signSessionToken({ sub: 'user-123', role: 'owner' });
    expect(verifySessionToken(token)).toEqual({ sub: 'user-123', role: 'owner' });
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign({ sub: 'user-123', role: 'owner' }, 'not-our-secret');
    expect(() => verifySessionToken(forged)).toThrow();
  });

  it('rejects a token where someone changed the role', () => {
    const [header, , signature] = signSessionToken({ sub: 'user-123', role: 'customer' }).split(
      '.',
    );
    const tamperedBody = Buffer.from(JSON.stringify({ sub: 'user-123', role: 'owner' })).toString(
      'base64url',
    );
    expect(() => verifySessionToken(`${header}.${tamperedBody}.${signature}`)).toThrow();
  });

  it('rejects an unsigned token ("alg": "none")', () => {
    const unsigned = jwt.sign({ sub: 'user-123', role: 'owner' }, '', { algorithm: 'none' });
    expect(() => verifySessionToken(unsigned)).toThrow();
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ sub: 'u', role: 'owner' }, process.env.JWT_SECRET!, {
      expiresIn: -10,
    });
    expect(() => verifySessionToken(expired)).toThrow(/expired/);
  });
});
