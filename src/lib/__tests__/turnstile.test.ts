import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../env", () => ({
  env: {
    turnstileSecretKey: "test-secret",
    turnstileSiteKey: "test-site-key",
  },
}));

describe("verifyTurnstileToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("appelle l'API siteverify Cloudflare avec la clé secrète", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { verifyTurnstileToken } = await import("../turnstile");
    await verifyTurnstileToken("token-valid", "1.2.3.4");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" })
    );
    const body = fetchMock.mock.calls[0]![1]!.body as URLSearchParams;
    expect(body.get("secret")).toBe("test-secret");
    expect(body.get("response")).toBe("token-valid");
    expect(body.get("remoteip")).toBe("1.2.3.4");
  });

  it("rejette un jeton refusé par Cloudflare", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ success: false }) })
    );

    const { verifyTurnstileToken, TurnstileError } = await import("../turnstile");
    await expect(verifyTurnstileToken("bad", "1.2.3.4")).rejects.toBeInstanceOf(TurnstileError);
  });

  it("n'envoie pas remoteip si l'adresse est inconnue", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { verifyTurnstileToken } = await import("../turnstile");
    await verifyTurnstileToken("token-valid", "unknown");

    const body = fetchMock.mock.calls[0]![1]!.body as URLSearchParams;
    expect(body.get("remoteip")).toBeNull();
  });

  it("signale un domaine Turnstile non autorisé", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ success: false, "error-codes": ["hostname-mismatch"] }),
      })
    );

    const { verifyTurnstileToken } = await import("../turnstile");
    await expect(verifyTurnstileToken("token", "1.2.3.4")).rejects.toMatchObject({
      name: "TurnstileError",
      message: expect.stringContaining("devispropre.com"),
    });
  });

  it("ignore la vérification si une seule clé Turnstile est configurée", async () => {
    vi.doMock("../env", () => ({
      env: { turnstileSecretKey: "test-secret", turnstileSiteKey: "" },
    }));
    vi.resetModules();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { verifyTurnstileToken } = await import("../turnstile");
    await verifyTurnstileToken(undefined, "1.2.3.4");

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
