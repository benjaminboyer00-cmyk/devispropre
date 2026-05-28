import { describe, expect, it } from "vitest";
import { validateClientSignatureDataUri } from "../signature-payload";

/** PNG 1×1 px valide. */
const VALID_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("validateClientSignatureDataUri", () => {
  it("accepte un PNG base64 léger", () => {
    expect(validateClientSignatureDataUri(VALID_PNG)).toBe(true);
  });

  it("rejette un SVG ou un préfixe incorrect", () => {
    expect(validateClientSignatureDataUri("data:image/svg+xml;base64,PHN2Zy8+")).toBe(false);
    expect(validateClientSignatureDataUri("data:image/jpeg;base64,/9j/")).toBe(false);
  });

  it("rejette un payload trop volumineux", () => {
    const huge = `${VALID_PNG}${"A".repeat(200_000)}`;
    expect(validateClientSignatureDataUri(huge)).toBe(false);
  });
});
