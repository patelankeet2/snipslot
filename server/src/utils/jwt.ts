import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '../models/User';

export interface SessionPayload {
  sub: string; // our user id
  role: Role;
}

export function signSessionToken(payload: SessionPayload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

// Throws if the token is expired, tampered with or signed with another key
export function verifySessionToken(token: string): SessionPayload {
  // pin the algorithm so a token cannot switch to "none" or another alg
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof decoded === 'string' || !decoded.sub || !decoded.role) {
    throw new Error('Malformed session token');
  }
  return { sub: String(decoded.sub), role: decoded.role as Role };
}
