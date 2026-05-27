import { describe, expect, it } from "vitest";
import { AUTH_RESPONSE_MIN_MS, ensureMinimumElapsed } from "../timing-safe";

describe("ensureMinimumElapsed", () => {
  it("respecte une durée minimale", async () => {
    const start = Date.now();
    await ensureMinimumElapsed(start, 60);
    expect(Date.now() - start).toBeGreaterThanOrEqual(55);
  });

  it("n'attend pas si le délai est déjà écoulé", async () => {
    const start = Date.now() - AUTH_RESPONSE_MIN_MS;
    const before = Date.now();
    await ensureMinimumElapsed(start, 50);
    expect(Date.now() - before).toBeLessThan(20);
  });
});
