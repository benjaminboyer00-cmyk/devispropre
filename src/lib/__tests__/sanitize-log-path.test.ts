import { describe, expect, it } from "vitest";
import { sanitizePathForLog } from "../sanitize-log-path";

describe("sanitizePathForLog", () => {
  it("masque un shareToken devis", () => {
    const token = "a".repeat(64);
    expect(sanitizePathForLog(`/devis/${token}`)).toBe("/devis/[REDACTED]");
    expect(sanitizePathForLog(`/api/public/devis/${token}`)).toBe("/api/public/devis/[REDACTED]");
  });

  it("masque un token magic link", () => {
    expect(sanitizePathForLog("/api/auth/magic-link/verify?token=abc123XYZ")).toBe(
      "/api/auth/magic-link/verify?token=[REDACTED]"
    );
  });
});
