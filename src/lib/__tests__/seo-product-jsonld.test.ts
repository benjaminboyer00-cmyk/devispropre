import { describe, expect, it } from "vitest";
import { jsonLdSoftwareApplication, jsonLdTarifs } from "@/lib/seo";

describe("JSON-LD Product / tarifs (Search Console)", () => {
  const product = jsonLdTarifs() as Record<string, unknown>;
  const offers = product.offers as Record<string, unknown>[];

  it("inclut image (critique fiches marchand)", () => {
    expect(product.image).toEqual(
      expect.arrayContaining([
        expect.stringContaining("/opengraph-image"),
        expect.stringContaining("/icon.png"),
      ])
    );
  });

  it("inclut review et aggregateRating (extraits produits)", () => {
    expect(Array.isArray(product.review)).toBe(true);
    expect((product.review as unknown[]).length).toBeGreaterThan(0);
    expect(product.aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      reviewCount: expect.any(String),
      ratingValue: expect.any(String),
    });
  });

  it("chaque offre a availability, shippingDetails et hasMerchantReturnPolicy", () => {
    expect(offers).toHaveLength(3);
    for (const offer of offers) {
      expect(offer.availability).toBe("https://schema.org/InStock");
      expect(offer.shippingDetails).toMatchObject({
        "@type": "OfferShippingDetails",
        shippingRate: { value: "0", currency: "EUR" },
      });
      expect(offer.hasMerchantReturnPolicy).toMatchObject({
        "@type": "MerchantReturnPolicy",
        applicableCountry: "FR",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      });
    }
  });
});

describe("JSON-LD SoftwareApplication", () => {
  it("offres avec availability pour éviter avertissements offers", () => {
    const app = jsonLdSoftwareApplication() as Record<string, unknown>;
    const offers = app.offers as Record<string, unknown>[];
    for (const offer of offers) {
      expect(offer.availability).toBe("https://schema.org/InStock");
    }
    expect(app.image).toBeDefined();
  });
});
