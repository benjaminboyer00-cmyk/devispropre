import type { Metadata } from "next";
import { MagicLinkCompleteForm } from "@/components/auth/MagicLinkCompleteForm";

export const metadata: Metadata = {
  title: "Finaliser la connexion",
  robots: { index: false, follow: false },
};

export default async function ConnexionMagicLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:py-24">
      <h1 className="heading-section text-3xl">Finaliser la connexion</h1>
      <p className="text-lead mt-3 font-light">
        Un dernier clic pour accéder à vos devis et factures.
      </p>
      <div className="ui-card-padded mt-10">
        <MagicLinkCompleteForm token={token} />
      </div>
    </div>
  );
}
