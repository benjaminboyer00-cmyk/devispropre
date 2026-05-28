import { getCity, getTrade } from "@/lib/local-seo";
import { OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE, renderLocalOgImage } from "@/lib/og-local-image";

export const runtime = "edge";
export const revalidate = 31536000;
export const alt = "DevisPropre — Devis artisan local";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

type ImageProps = { params: Promise<{ metier: string; ville: string }> };

export default async function OpenGraphImage({ params }: ImageProps) {
  const { metier, ville } = await params;
  const trade = getTrade(metier);
  const city = getCity(ville);

  if (!trade || !city) {
    return renderLocalOgImage("DevisPropre", "Devis et factures artisans BTP");
  }

  return renderLocalOgImage(
    `Devis ${trade.label} · ${city.label}`,
    `${city.region} · PDF conforme · WhatsApp · TVA 2018`
  );
}
