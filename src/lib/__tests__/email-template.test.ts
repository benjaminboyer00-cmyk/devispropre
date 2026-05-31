import { describe, expect, it } from "vitest";
import { emailParagraph, renderBrandedEmail } from "@/lib/email-template";

describe("renderBrandedEmail", () => {
  it("échappe le contenu utilisateur", () => {
    const html = renderBrandedEmail({
      title: 'Test <script>alert("x")</script>',
      greeting: "Bonjour <b>Jean</b>",
      bodyHtml: emailParagraph('Lien : https://evil.com"><img'),
      cta: { label: "Cliquer & go", href: "https://devispropre.com/verify?x=1" },
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Cliquer &amp; go");
    expect(html).toContain('href="https://devispropre.com/verify?x=1"');
  });

  it("inclut le logo et le wordmark", () => {
    const html = renderBrandedEmail({
      title: "Confirmez votre email",
      bodyHtml: emailParagraph("Contenu"),
    });

    expect(html).toContain("/icon.png");
    expect(html).toContain("Devis");
    expect(html).toContain("Propre");
  });
});
