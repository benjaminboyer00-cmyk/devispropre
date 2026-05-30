import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { TurnstileScript } from "@/components/auth/TurnstileScript";
import { getTurnstilePublicConfig } from "@/lib/turnstile-config";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false, follow: false },
};

export default function ConnexionPage() {
  const turnstile = getTurnstilePublicConfig();

  return (
    <>
      {turnstile.enabled && <TurnstileScript siteKey={turnstile.siteKey} />}
      <div className="mx-auto max-w-md px-4 py-20 sm:py-24">
      <h1 className="heading-section text-3xl">Connexion</h1>
      <p className="text-lead mt-3 font-light">
        Retrouvez vos devis, vos factures et gérez votre abonnement. Connexion par lien email — sans
        mot de passe.
      </p>
      <div className="ui-card-padded mt-10">
        <Suspense fallback={<p className="text-body text-center">Chargement…</p>}>
          <LoginForm turnstileSiteKey={turnstile.enabled ? turnstile.siteKey : undefined} />
        </Suspense>
      </div>
    </div>
    </>
  );
}
