import { getTrade } from "@/lib/local-seo";
import { OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE, renderLocalOgImage } from "@/lib/og-local-image";

export const runtime = "edge";
export const revalidate = 31536000;
export const alt = "DevisPropre — Devis artisan";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

type ImageProps = { params: Promise<{ metier: string }> };

export default async function OpenGraphImage({ params }: ImageProps) {
  const { metier } = await params;
  const trade = getTrade(metier);

  if (!trade) {
    return renderLocalOgImage("DevisPropre", "Devis et factures artisans BTP");
  }

  return renderLocalOgImage(
    `Devis ${trade.label}`,
    `${trade.plural} · France entière · Conforme TVA 2018`
  );
}
