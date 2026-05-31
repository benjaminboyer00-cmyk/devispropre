import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SessionRedirectIfLoggedIn } from "@/components/auth/SessionRedirectIfLoggedIn";
import { TurnstileScript } from "@/components/auth/TurnstileScript";
import { getSession } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { getTurnstilePublicConfig } from "@/lib/turnstile-config";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false, follow: false },
};

export default async function ConnexionPage() {
  const session = await getSession();
  if (session) {
    redirect(ROUTES.dashboard);
  }

  const turnstile = getTurnstilePublicConfig();

  return (
    <>
      <SessionRedirectIfLoggedIn />
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
