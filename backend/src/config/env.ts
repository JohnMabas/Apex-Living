import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // Authentication
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters — run: openssl rand -base64 64")
    .default("change-me-in-production-use-openssl-rand-base64-64-for-real-secret"),

  // Cookie signing secret (for signed cookies)
  COOKIE_SECRET: z
    .string()
    .min(32, "COOKIE_SECRET must be at least 32 characters")
    .default("change-me-in-production-use-openssl-rand-base64-64-for-real-secret"),

  // JWT expiry (defaults to 7 days)
  JWT_EXPIRES_IN: z.string().default("7d"),
});

export const env = envSchema.parse(process.env);
