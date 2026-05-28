import { describe, expect, it } from "vitest";
import {
  SHARE_LINK_MAX_AGE_DAYS,
  computeShareLinkExpiresAt,
  isShareLinkExpired,
  isValidShareTokenFormat,
} from "../share-token";

const VALID_TOKEN = "a".repeat(64);

describe("share-token", () => {
  it("accepte un token hex 64 caractères", () => {
    expect(isValidShareTokenFormat(VALID_TOKEN)).toBe(true);
  });

  it("rejette un token trop court ou non hex", () => {
    expect(isValidShareTokenFormat("abc")).toBe(false);
    expect(isValidShareTokenFormat("g".repeat(64))).toBe(false);
    expect(isValidShareTokenFormat("")).toBe(false);
  });

  it("expire au validUntil ou au plafond 90 jours (le plus tôt)", () => {
    const sentAt = new Date("2026-01-01T10:00:00Z");
    const validUntil = new Date("2026-06-01T23:59:59Z");
    const expiresAt = computeShareLinkExpiresAt({ sentAt, validUntil });
    const maxAge = new Date(sentAt);
    maxAge.setDate(maxAge.getDate() + SHARE_LINK_MAX_AGE_DAYS);
    expect(expiresAt!.getTime()).toBeLessThan(validUntil.getTime());
    expect(expiresAt!.getTime()).toBe(maxAge.getTime());
  });

  it("détecte un lien expiré", () => {
    const sentAt = new Date("2020-01-01T10:00:00Z");
    const validUntil = new Date("2030-01-01T23:59:59Z");
    expect(
      isShareLinkExpired({
        sentAt,
        validUntil,
        now: new Date("2026-05-27T12:00:00Z"),
      })
    ).toBe(true);
  });

  it("considère un lien valide avant expiration", () => {
    const sentAt = new Date("2026-05-01T10:00:00Z");
    const validUntil = new Date("2026-06-15T23:59:59Z");
    expect(
      isShareLinkExpired({
        sentAt,
        validUntil,
        now: new Date("2026-05-27T12:00:00Z"),
      })
    ).toBe(false);
  });
});
