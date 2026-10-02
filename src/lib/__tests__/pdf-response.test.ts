import { describe, expect, it } from "vitest";
import { contentDisposition, pdfResponse } from "../pdf-response";

describe("contentDisposition", () => {
  it("produit un repli ASCII et un filename* UTF-8", () => {
    expect(contentDisposition("attachment", "devis-é’🙂.pdf")).toBe(
      `attachment; filename="devis-e___.pdf"; filename*=UTF-8''devis-%C3%A9%E2%80%99%F0%9F%99%82.pdf`
    );
  });

  it("neutralise guillemets et retours à la ligne", () => {
    const header = contentDisposition("inline", 'a"b\r\nc.pdf');
    expect(header).toContain('filename="a_b__c.pdf"');
    expect(header).not.toMatch(/[\r\n]/);
  });

  it("ne fait pas échouer Headers avec un nom non Latin-1", () => {
    expect(() => pdfResponse(Buffer.from("%PDF-"), "devis’.pdf")).not.toThrow();
  });
});
