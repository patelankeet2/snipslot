import type { Request, Response } from 'express';
import { authService } from '../container';
import { SESSION_COOKIE, sessionCookieOptions } from '../config/cookies';
import { logger } from '../utils/logger';
import { readToken } from '../middleware/auth';
import { verifySessionToken } from '../utils/jwt';

export async function googleLogin(req: Request, res: Response) {
  const { user, token } = await authService.loginWithGoogle(req.body.credential);

  res.cookie(SESSION_COOKIE, token, sessionCookieOptions);
  logger.info('User signed in', { userId: user.id, role: user.role });

  // the token itself stays in the cookie, only the profile goes in the body
  res.json({ user });
}

// Used by the app on start up. Not being signed in is a normal answer here,
// so it returns { user: null } with 200 instead of a 401.
export async function session(req: Request, res: Response) {
  const token = readToken(req);
  if (!token) return res.json({ user: null });

  try {
    const { sub } = verifySessionToken(token);
    const user = await authService.getUser(sub);
    return res.json({ user });
  } catch {
    // expired or invalid cookie: clear it so the browser stops sending it
    const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions;
    res.clearCookie(SESSION_COOKIE, clearOptions);
    return res.json({ user: null });
  }
}

export async function me(req: Request, res: Response) {
  const user = await authService.getUser(req.user!.id);
  res.json({ user });
}

export function logout(_req: Request, res: Response) {
  const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions;
  res.clearCookie(SESSION_COOKIE, clearOptions);
  res.status(204).end();
}
