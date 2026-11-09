import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_CA_CERT_PATH: z.string().trim().min(1).optional(),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // Authentication
  JWT_SECRET: z
    .string()
    .min(32)
    .default("change-me-in-production-use-openssl-rand-base64-64-for-real-secret"),
  COOKIE_SECRET: z
    .string()
    .min(32)
    .default("change-me-in-production-use-openssl-rand-base64-64-for-real-secret"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Image storage (Phase 4)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  UPLOAD_DIR: z.string().default("uploads"),

  // Paystack (Phase 6)
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_BASE_URL: z.string().url().default("https://api.paystack.co"),
  PAYSTACK_CALLBACK_URL: z.string().url().optional(),

  // Supabase Auth (customer Google sign-in). Publishable key is safe for
  // server-side token verification requests; never use a service-role key here.
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),

  // Transactional email (Brevo). Credentials are intentionally backend-only.
  EMAIL_PROVIDER: z.literal("brevo").default("brevo"),
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().default("Nestora"),
  EMAIL_PROVIDER_URL: z
    .string()
    .url()
    .default("https://api.brevo.com/v3/smtp/email"),
  EMAIL_WEBHOOK_SECRET: z.string().min(16).optional(),
  EMAIL_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60_000).default(10_000),
  EMAIL_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),

  // Scheduler interval (ms). Default: 60 seconds.
  JOB_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),

  // Demo apartment seeding — only allowed in development/test.
  // Set ENABLE_DEMO_SEED=true to run the demo seed script.
  ENABLE_DEMO_SEED: z.string().optional(),
});

export const env = envSchema.parse(process.env);
