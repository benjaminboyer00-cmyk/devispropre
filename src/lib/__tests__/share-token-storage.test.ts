import { afterEach, describe, expect, it, vi } from "vitest";
import {
  decryptShareToken,
  encryptShareToken,
  isLegacyShareTokenCiphertext,
} from "../share-token-storage";

const RAW = "b".repeat(64);
const KEY = "1f".repeat(32);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("share-token-storage — clé dédiée", () => {
  it("chiffre avec DATA_ENCRYPTION_KEY (préfixe k2.) et déchiffre", () => {
    vi.stubEnv("DATA_ENCRYPTION_KEY", KEY);
    const enc = encryptShareToken(RAW);
    expect(enc.startsWith("k2.")).toBe(true);
    expect(isLegacyShareTokenCiphertext(enc)).toBe(false);
    expect(decryptShareToken(enc)).toBe(RAW);
  });

  it("déchiffre encore les jetons legacy une fois la clé dédiée configurée", () => {
    vi.stubEnv("DATA_ENCRYPTION_KEY", "");
    const legacy = encryptShareToken(RAW);
    expect(isLegacyShareTokenCiphertext(legacy)).toBe(true);

    vi.stubEnv("DATA_ENCRYPTION_KEY", KEY);
    expect(decryptShareToken(legacy)).toBe(RAW);
  });

  it("refuse un chiffré k2. avec une autre clé ou sans clé", () => {
    vi.stubEnv("DATA_ENCRYPTION_KEY", KEY);
    const enc = encryptShareToken(RAW);

    vi.stubEnv("DATA_ENCRYPTION_KEY", "2e".repeat(32));
    expect(decryptShareToken(enc)).toBeNull();
    vi.stubEnv("DATA_ENCRYPTION_KEY", "");
    expect(decryptShareToken(enc)).toBeNull();
  });
});
