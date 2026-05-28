export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnvAtRuntime } = await import("./lib/env");
    validateEnvAtRuntime();

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
