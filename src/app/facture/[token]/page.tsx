import type { Metadata } from "next";
import { PublicFactureView } from "@/components/facture/PublicFactureView";

export const metadata: Metadata = {
  title: "Votre facture",
  robots: { index: false },
};

type PageProps = { params: Promise<{ token: string }> };

export default async function PublicFacturePage({ params }: PageProps) {
  const { token } = await params;
  return <PublicFactureView token={token} />;
}
