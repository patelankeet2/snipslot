import type { UserRepository } from '../repositories/UserRepository';
import type { TokenVerifier } from './GoogleTokenVerifier';
import type { Role, UserDoc } from '../models/User';
import { signSessionToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly verifier: TokenVerifier,
    private readonly ownerEmails: string[],
  ) {}

  // The owner list in .env decides the role, so the shop owner never has to
  // be promoted by hand and nobody can make themselves an owner from the UI.
  roleFor(email: string): Role {
    return this.ownerEmails.includes(email.toLowerCase()) ? 'owner' : 'customer';
  }

  async loginWithGoogle(idToken: string): Promise<{ user: UserDoc; token: string }> {
    const profile = await this.verifier.verify(idToken);
    const role = this.roleFor(profile.email);

    let user = await this.users.findByGoogleId(profile.googleId);
    if (user) {
      user.set({ name: profile.name, picture: profile.picture, email: profile.email, role });
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      user = await this.users.create({ ...profile, role, lastLoginAt: new Date() });
    }

    const token = signSessionToken({ sub: user.id, role: user.role });
    return { user, token };
  }

  async getUser(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw AppError.unauthorized('Your account no longer exists');
    return user;
  }
}
