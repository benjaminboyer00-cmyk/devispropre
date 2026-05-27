import { notFound } from "next/navigation";
import { LocalSeoContent } from "@/components/seo/LocalSeoContent";
import { getTrade, localKeywords, localPageDescription, localPageTitle } from "@/lib/local-seo";
import { pageMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ metier: string }> };

export async function generateStaticParams() {
  const { TRADES } = await import("@/lib/local-seo");
  return Object.keys(TRADES).map((metier) => ({ metier }));
}

export async function generateMetadata({ params }: PageProps) {
  const { metier } = await params;
  const trade = getTrade(metier);
  if (!trade) return {};

  return pageMetadata({
    title: localPageTitle(trade),
    description: localPageDescription(trade),
    path: `/devis-artisan/${metier}`,
    keywords: localKeywords(trade),
  });
}

export default async function LocalTradePage({ params }: PageProps) {
  const { metier } = await params;
  const trade = getTrade(metier);
  if (!trade) notFound();

  return <LocalSeoContent trade={trade} />;
}
