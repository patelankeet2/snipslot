import { env } from './config/env';
import { UserRepository } from './repositories/UserRepository';
import { GoogleTokenVerifier } from './services/GoogleTokenVerifier';
import { AuthService } from './services/AuthService';

// Composition root: every service gets its dependencies here, in one place.
// Controllers import from this file instead of creating things themselves.
const userRepository = new UserRepository();

export const authService = new AuthService(
  userRepository,
  new GoogleTokenVerifier(env.GOOGLE_CLIENT_ID),
  env.ownerEmails,
);
