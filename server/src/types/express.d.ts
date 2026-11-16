import type { Role } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      // set by requireAuth once the session token checks out
      user?: {
        id: string;
        email: string;
        name: string;
        role: Role;
      };
    }
  }
}

export {};
