import type { Request, Response } from 'express';
import { authService } from '../container';
import { SESSION_COOKIE, sessionCookieOptions } from '../config/cookies';
import { logger } from '../utils/logger';

export async function googleLogin(req: Request, res: Response) {
  const { user, token } = await authService.loginWithGoogle(req.body.credential);

  res.cookie(SESSION_COOKIE, token, sessionCookieOptions);
  logger.info('User signed in', { userId: user.id, role: user.role });

  // the token itself stays in the cookie, only the profile goes in the body
  res.json({ user });
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
