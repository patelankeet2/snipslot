import type { Request, RequestHandler } from 'express';
import { SESSION_COOKIE } from '../config/cookies';
import { verifySessionToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { authService } from '../container';
import type { Role } from '../models/User';

// The browser sends the httpOnly cookie. Postman and other API clients can
// send the same token as "Authorization: Bearer <token>" instead.
function readToken(req: Request): string | null {
  const cookieToken = req.cookies?.[SESSION_COOKIE];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();

  return null;
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = readToken(req);
  if (!token) return next(AppError.unauthorized());

  let payload;
  try {
    payload = verifySessionToken(token);
  } catch {
    return next(AppError.unauthorized('Your session has expired, please sign in again'));
  }

  // load the user so a deleted account or changed role takes effect straight away
  const user = await authService.getUser(payload.sub);
  req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
  next();
};

// Use after requireAuth, eg router.post('/', requireAuth, requireRole('owner'), handler)
export const requireRole =
  (...allowed: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!allowed.includes(req.user.role)) {
      return next(AppError.forbidden('Only the shop owner can do this'));
    }
    next();
  };
