import { z } from 'zod';

export const googleLoginSchema = z.object({
  // the ID token (JWT) the Google button hands back to the browser
  credential: z.string().min(100, 'Missing Google credential').max(4096),
});
