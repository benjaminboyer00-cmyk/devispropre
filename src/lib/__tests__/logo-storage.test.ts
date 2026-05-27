import { describe, expect, it } from "vitest";
import { assertImageMagicBytes, MAX_LOGO_BYTES, parseLogoDataUri } from "../logo-storage";

/** PNG 1×1 valide */
const VALID_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAD0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("parseLogoDataUri", () => {
  it("accepte un PNG valide et re-encode en PNG", async () => {
    const { ext, buffer } = await parseLogoDataUri(VALID_PNG);
    expect(ext).toBe("png");
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
  });

  it("rejette un MIME PNG avec magic bytes invalides (SVG forgé)", async () => {
    const fakeSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const b64 = fakeSvg.toString("base64");
    await expect(parseLogoDataUri(`data:image/png;base64,${b64}`)).rejects.toThrow(/magic bytes/i);
  });

  it("rejette un MIME non autorisé", async () => {
    await expect(parseLogoDataUri("data:image/gif;base64,AAAA")).rejects.toThrow(/invalide/i);
  });

  it("rejette une URL externe", async () => {
    await expect(parseLogoDataUri("https://evil.com/logo.png")).rejects.toThrow(/invalide/i);
  });

  it("rejette un fichier trop volumineux", async () => {
    const big = Buffer.alloc(MAX_LOGO_BYTES + 1, 0xff);
    big[0] = 0xff;
    big[1] = 0xd8;
    big[2] = 0xff;
    await expect(parseLogoDataUri(`data:image/jpeg;base64,${big.toString("base64")}`)).rejects.toThrow(
      /volumineux/i
    );
  });
});

describe("assertImageMagicBytes", () => {
  it("rejette un buffer vide", () => {
    expect(() => assertImageMagicBytes(Buffer.alloc(0))).toThrow();
  });
});
