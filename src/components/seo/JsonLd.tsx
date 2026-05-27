import { headers } from "next/headers";

interface JsonLdProps {
  data: Record<string, unknown> | object;
}

export async function JsonLd({ data }: JsonLdProps) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <script
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
