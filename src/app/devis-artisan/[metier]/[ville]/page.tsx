import { notFound } from "next/navigation";
import { LocalSeoContent } from "@/components/seo/LocalSeoContent";
import {
  getCity,
  getStaticLocalSeoParams,
  getTrade,
  localKeywords,
  localPageDescription,
  localPageTitle,
} from "@/lib/local-seo";
import { pageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ metier: string; ville: string }> };

/** ISR : génération à la demande, cache 7 jours — évite un build de centaines de milliers de pages. */
export const revalidate = 604800;
export const dynamicParams = true;

export function generateStaticParams() {
  return getStaticLocalSeoParams();
}

export async function generateMetadata({ params }: PageProps) {
  const { metier, ville } = await params;
  const trade = getTrade(metier);
  const city = getCity(ville);
  if (!trade || !city) return {};

  return pageMetadata({
    title: localPageTitle(trade, city),
    description: localPageDescription(trade, city),
    path: `/devis-artisan/${metier}/${ville}`,
    keywords: localKeywords(trade, city),
    ogImagePath: `/devis-artisan/${metier}/${ville}/opengraph-image`,
  });
}

export default async function LocalCityPage({ params }: PageProps) {
  const { metier, ville } = await params;
  const trade = getTrade(metier);
  const city = getCity(ville);
  if (!trade || !city) notFound();

  return <LocalSeoContent trade={trade} city={city} />;
}
