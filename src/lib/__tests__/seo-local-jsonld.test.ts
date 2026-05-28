import { describe, expect, it } from "vitest";
import { CITIES, TRADES } from "@/lib/local-seo";
import { getLocalPageSections } from "@/lib/local-seo-body";
import { jsonLdFaqFromItems, jsonLdLocalSeoWebPage } from "@/lib/seo";

describe("JSON-LD pages SEO local", () => {
  it("génère FAQPage et WebPage pour une page métier×ville", () => {
    const trade = TRADES.plombier;
    const city = CITIES.paris;
    const sections = getLocalPageSections(trade, city);

    const faq = jsonLdFaqFromItems(sections.faq);
    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity).toHaveLength(sections.faq.length);

    const page = jsonLdLocalSeoWebPage({
      name: "Devis plombier Paris",
      description: "Logiciel de devis pour plombiers à Paris",
      path: "/devis-artisan/plombier/paris",
      dateModified: "2026-05-28T00:00:00.000Z",
    });
    expect(page["@type"]).toBe("WebPage");
    expect(page.name).toBe("Devis plombier Paris");
    expect(page.url).toContain("/devis-artisan/plombier/paris");
    expect(page.about).toMatchObject({ "@type": "SoftwareApplication" });
  });
});
