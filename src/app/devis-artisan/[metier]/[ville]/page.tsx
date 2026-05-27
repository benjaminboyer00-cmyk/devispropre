import { notFound } from "next/navigation";
import { LocalSeoContent } from "@/components/seo/LocalSeoContent";
import {
  CITIES,
  TRADES,
  getCity,
  getTrade,
  localKeywords,
  localPageDescription,
  localPageTitle,
} from "@/lib/local-seo";
import { pageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ metier: string; ville: string }> };

export async function generateStaticParams() {
  const params: { metier: string; ville: string }[] = [];
  for (const metier of Object.keys(TRADES)) {
    for (const ville of Object.keys(CITIES)) {
      params.push({ metier, ville });
    }
  }
  return params;
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
  });
}

export default async function LocalCityPage({ params }: PageProps) {
  const { metier, ville } = await params;
  const trade = getTrade(metier);
  const city = getCity(ville);
  if (!trade || !city) notFound();

  return <LocalSeoContent trade={trade} city={city} />;
}
