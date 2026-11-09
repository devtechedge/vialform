import { z } from "zod";

const booleanFlag = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === "boolean") return value;
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DEMO_MODE: booleanFlag.default(true),
  DATABASE_URL: z.string().optional(),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  APP_URL: z.string().default("http://localhost:3000"),
  AUTH_SECRET: z.string().default("dev-only-insecure-secret-change-me-0000000000"),
  FILE_SIGNING_SECRET: z.string().default("dev-only-insecure-file-secret-change-me-000000"),
  ALLOW_PROD_SEED: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === "production") {
    if (env.AUTH_SECRET.length < 32 || env.AUTH_SECRET.startsWith("dev-only")) {
      throw new Error("AUTH_SECRET must be a strong (>= 32 char) non-default value in production.");
    }
    if (env.FILE_SIGNING_SECRET.length < 32 || env.FILE_SIGNING_SECRET.startsWith("dev-only")) {
      throw new Error("FILE_SIGNING_SECRET must be a strong (>= 32 char) non-default value in production.");
    }
  }
  cached = env;
  return env;
}

export function isDemoMode(): boolean {
  return getEnv().DEMO_MODE;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}