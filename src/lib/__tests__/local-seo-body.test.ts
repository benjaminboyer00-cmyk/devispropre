import { describe, expect, it } from "vitest";
import { CITIES, TRADES } from "../local-seo";
import { countWords, getLocalPageSections } from "../local-seo-body";

describe("local-seo-body", () => {
  it("chaque page métier×ville dépasse 300 mots uniques", () => {
    for (const trade of Object.values(TRADES)) {
      for (const city of Object.values(CITIES)) {
        const sections = getLocalPageSections(trade, city);
        const allText = [
          ...sections.whyParagraphs,
          ...sections.featuresParagraphs,
          ...sections.workflowSteps,
          ...sections.marketParagraphs,
          sections.pricingParagraph,
          ...sections.faq.flatMap((f) => [f.q, f.a]),
        ];
        expect(countWords(allText)).toBeGreaterThanOrEqual(300);
      }
    }
  });
});
