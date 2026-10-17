import { z } from "zod";

/**
 * Environment configuration schema for Qalam.
 * Validates required runtime variables and safely handles defaults.
 */
const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .default("postgresql://qalam:qalam_dev_password@localhost:5432/qalam_dev"),
  AUTH_SECRET: z
    .string()
    .min(1, "AUTH_SECRET is required")
    .default("local-development-secret-must-be-replaced-in-production-min-32-chars"),
  BASE_URL: z
    .string()
    .min(1, "BASE_URL is required")
    .default("http://localhost:3000"),
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required").default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z
    .string()
    .min(1, "SMTP_FROM is required")
    .default("Qalam <noreply@qalam.local>"),
  ALLOWED_EMAIL_DOMAINS: z
    .string()
    .default("gmail.com,outlook.com,hotmail.com,yahoo.com,icloud.com"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates environment variables.
 * Does NOT print secret values in logs on failure.
 */
export function getEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errorIssues = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    console.error(`[Configuration Error] Invalid environment variables for keys: ${errorIssues}`);
    throw new Error(`Invalid environment configuration: ${errorIssues}`);
  }
  return result.data;
}

export const env = getEnv();
