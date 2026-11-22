import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

// Validate env vars once at startup so a missing value fails fast
// instead of blowing up later on the first request that needs it.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB: z.string().default('snipslot'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  OWNER_EMAILS: z.string().default(''),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  // how many proxies sit in front of the app: 1 locally / on Render alone,
  // 2 in production where Vercel forwards /api to Render
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(1),
  // Web Push keys (npx web-push generate-vapid-keys). The private key never leaves the server.
  VAPID_PUBLIC_KEY: z.string().min(1, 'VAPID_PUBLIC_KEY is required'),
  VAPID_PRIVATE_KEY: z.string().min(1, 'VAPID_PRIVATE_KEY is required'),
  VAPID_SUBJECT: z
    .string()
    .regex(/^(mailto:|https:)/, 'VAPID_SUBJECT must start with mailto: or https:'),
  // run the reminder job inside this process (local dev); production uses the HTTP trigger
  ENABLE_CRON: z.enum(['true', 'false']).default('false'),
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),
  // S3 photo uploads. Optional: without them the app works, uploads just answer 503.
  AWS_REGION: z.string().default('ap-southeast-2'),
  S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
  console.error(`Invalid environment configuration:\n${problems.join('\n')}`);
  process.exit(1);
}

const raw = parsed.data;

const splitList = (value: string) =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  cronEnabled: raw.ENABLE_CRON === 'true',
  uploadsEnabled: Boolean(raw.S3_BUCKET && raw.AWS_ACCESS_KEY_ID && raw.AWS_SECRET_ACCESS_KEY),
  clientOrigins: splitList(raw.CLIENT_ORIGIN),
  // compare emails in lower case so "Owner@Gmail.com" still matches
  ownerEmails: splitList(raw.OWNER_EMAILS).map((e) => e.toLowerCase()),
};

export type Env = typeof env;
