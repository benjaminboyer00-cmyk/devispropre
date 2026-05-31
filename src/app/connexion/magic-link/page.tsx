import type { Metadata } from "next";
import { MagicLinkCompleteForm } from "@/components/auth/MagicLinkCompleteForm";
import { AuthEmailPanel, AuthKeyIcon } from "@/components/auth/AuthEmailPanel";

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
    <AuthEmailPanel
      title="Finaliser la connexion"
      subtitle="Un dernier clic pour accéder à vos devis et factures."
      icon={<AuthKeyIcon />}
    >
      <MagicLinkCompleteForm token={token} />
    </AuthEmailPanel>
  );
}
