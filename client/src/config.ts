// Values baked in at build time from .env.local / Vercel env settings
export const config = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  // empty means "same origin", which is what we want in dev (proxy) and on Vercel (rewrite)
  apiBase: import.meta.env.VITE_API_BASE ?? '',
  shopTimezone: 'Pacific/Auckland',
};

if (!config.googleClientId) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not set, Google sign-in will not work');
}
