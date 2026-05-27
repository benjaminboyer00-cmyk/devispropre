export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnvAtRuntime } = await import("./lib/env");
    validateEnvAtRuntime();
  }
}
