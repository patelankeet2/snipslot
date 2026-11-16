import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../utils/AppError';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

// Kept behind an interface so tests can swap in a fake verifier
// without calling Google.
export interface TokenVerifier {
  verify(idToken: string): Promise<GoogleProfile>;
}

export class GoogleTokenVerifier implements TokenVerifier {
  private readonly client: OAuth2Client;

  constructor(private readonly clientId: string) {
    this.client = new OAuth2Client(clientId);
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    let payload;
    try {
      // checks Google's signature, expiry, issuer and that the token was made for OUR client id
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
      payload = ticket.getPayload();
    } catch {
      throw AppError.unauthorized('Google sign-in could not be verified');
    }

    if (!payload?.sub || !payload.email) {
      throw AppError.unauthorized('Google account details are missing');
    }
    if (!payload.email_verified) {
      throw AppError.unauthorized('Please verify your Google email first');
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name ?? payload.email.split('@')[0],
      picture: payload.picture,
    };
  }
}
