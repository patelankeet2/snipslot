import type { CookieOptions } from 'express';
import { env } from './env';

export const SESSION_COOKIE = 'snipslot_session';

// httpOnly: page JavaScript can never read the token (protects against XSS theft)
// secure: only sent over HTTPS in production
// sameSite lax: not sent on cross site POSTs, which blocks CSRF
export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // matches the 1 day token lifetime
};
