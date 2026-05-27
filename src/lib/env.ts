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

/** Valide les variables critiques — crash au démarrage en prod si manquantes. */
export function validateEnv(): void {
  if (isProd) {
    requireEnv("JWT_SECRET");
    requireEnv("DATABASE_URL");
    if (process.env.JWT_SECRET === DEV_JWT_SECRET) {
      throw new Error("JWT_SECRET ne doit pas utiliser la valeur de développement en production.");
    }
  }
}

export const env = {
  isProd,
  jwtSecret: optionalEnv("JWT_SECRET", DEV_JWT_SECRET),
  databaseUrl: optionalEnv("DATABASE_URL", "file:./dev.db"),
  appUrl: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  cronSecret: process.env.CRON_SECRET?.trim() ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
  stripePriceStarter: process.env.STRIPE_PRICE_STARTER?.trim() ?? "",
  stripePricePro: process.env.STRIPE_PRICE_PRO?.trim() ?? "",
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS?.trim() ||
    optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
  ).split(",").map((o) => o.trim()),
};

/** Appelé au démarrage serveur via instrumentation.ts */
export function validateEnvAtRuntime(): void {
  if (!isProd) return;
  validateEnv();
}
