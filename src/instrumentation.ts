export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnvAtRuntime } = await import("./lib/env");
    validateEnvAtRuntime();

    // Migration paresseuse des jetons de partage vers la clé dédiée — n'empêche pas le démarrage.
    void import("./lib/share-token-storage")
      .then(({ reencryptLegacyShareTokens }) => reencryptLegacyShareTokens())
      .then((count) => {
        if (count > 0) console.info(`[keys] ${count} jeton(s) de partage re-chiffré(s) avec DATA_ENCRYPTION_KEY`);
      })
      .catch((error) => console.error("[keys] re-chiffrement des jetons de partage échoué", error));

    const shutdown = async () => {
      try {
        const { prisma } = await import("./lib/db");
        await prisma.$disconnect();
      } catch {
        // ignore
      }
      process.exit(0);
    };

    process.on("SIGTERM", () => {
      void shutdown();
    });
    process.on("SIGINT", () => {
      void shutdown();
    });
  }
}
