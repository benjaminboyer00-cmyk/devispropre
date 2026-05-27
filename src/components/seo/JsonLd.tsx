import { NonceScript } from "@/components/NonceScript";

interface JsonLdProps {
  data: Record<string, unknown> | object;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <NonceScript
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
