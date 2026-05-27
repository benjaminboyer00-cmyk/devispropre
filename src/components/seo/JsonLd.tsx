import Script from "next/script";
import { createHash } from "crypto";

interface JsonLdProps {
  data: Record<string, unknown> | object;
  /** Identifiant stable — auto-généré si absent. */
  id?: string;
}

function jsonLdScriptId(data: object, id?: string): string {
  if (id) return id;
  const type = (data as { "@type"?: string })["@type"] ?? "schema";
  const hash = createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 10);
  return `json-ld-${String(type).toLowerCase()}-${hash}`;
}

/** JSON-LD SEO — via next/script (compatible React 19, pas de <script> React direct). */
export function JsonLd({ data, id }: JsonLdProps) {
  const scriptId = jsonLdScriptId(data, id);

  return (
    <Script
      id={scriptId}
      type="application/ld+json"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
