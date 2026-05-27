const DEV_JWT_SECRET = "dev-only-not-for-production-32chars!!";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Variable d'environnement obligatoire manquante : ${name}`);
  }
  return value.trim();
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

const isProd = process.env.NODE_ENV === "production";

export function validateEnv(): void {
  if (!isProd) return;

  const jwt = requireEnv("JWT_SECRET");
  if (jwt === DEV_JWT_SECRET || jwt.length < 32) {
    throw new Error("JWT_SECRET invalide en production (min 32 caractères, unique).");
  }

  requireEnv("DATABASE_URL");
  requireEnv("NEXT_PUBLIC_APP_URL");
  requireEnv("ALLOWED_ORIGINS");

  if (!process.env.DATABASE_URL?.startsWith("postgresql://")) {
    throw new Error("Production : DATABASE_URL doit être PostgreSQL.");
  }
}

export const env = {
  isProd,
  jwtSecret: optionalEnv("JWT_SECRET", DEV_JWT_SECRET),
  databaseUrl: optionalEnv(
    "DATABASE_URL",
    "postgresql://devispropre:devispropre@localhost:5433/devispropre?schema=public"
  ),
  appUrl: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000").replace(/\/$/, ""),
  cronSecret: process.env.CRON_SECRET?.trim() ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
  stripePriceStarter: process.env.STRIPE_PRICE_STARTER?.trim() ?? "",
  stripePricePro: process.env.STRIPE_PRICE_PRO?.trim() ?? "",
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS?.trim() ||
    optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
  )
    .split(",")
    .map((o) => o.trim().replace(/\/$/, "")),
};

export function validateEnvAtRuntime(): void {
  validateEnv();
}
