import type { Metadata } from "next";
import { PublicDevisView } from "@/components/devis/PublicDevisView";

export const metadata: Metadata = {
  title: "Votre devis",
  robots: { index: false },
};

type PageProps = { params: Promise<{ token: string }> };

export default async function PublicDevisPage({ params }: PageProps) {
  const { token } = await params;
  return <PublicDevisView token={token} />;
}
