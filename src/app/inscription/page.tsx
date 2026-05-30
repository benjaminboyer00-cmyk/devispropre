import { RegisterForm } from "@/components/auth/RegisterForm";
import { TurnstileScript } from "@/components/auth/TurnstileScript";
import { pageMetadata } from "@/lib/seo";
import { getTurnstilePublicConfig } from "@/lib/turnstile-config";

export const metadata = pageMetadata({
  title: "Inscription — Essai gratuit 15 jours",
  description:
    "Créez votre compte DevisPropre. Essai Starter 15 jours gratuit, puis 19€/mois sans résiliation.",
  path: "/inscription",
  noindex: true,
});

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;
  const fromDevis = params.from === "devis";
  const fromFacture = params.from === "facture";

  const turnstile = getTurnstilePublicConfig();

  return (
    <>
      {turnstile.enabled && <TurnstileScript siteKey={turnstile.siteKey} />}
      <div className="mx-auto max-w-lg px-4 py-20 sm:py-24">
      <h1 className="heading-section">Créer mon compte</h1>
      {fromDevis ? (
        <p className="text-lead mt-3 font-light">
          Votre devis sera automatiquement enregistré sur votre compte — puis choix de
          l&apos;abonnement pour obtenir le lien client.
        </p>
      ) : fromFacture ? (
        <p className="text-lead mt-3 font-light">
          Les factures se créent à partir d&apos;un devis accepté. Créez d&apos;abord votre devis,
          puis convertissez-le en facture conforme en 1 clic.
        </p>
      ) : (
        <p className="text-lead mt-3 font-light">
          30 secondes · Essai Starter 15 jours · Puis 19€/mois
        </p>
      )}
      <div className="ui-card-padded mt-10">
        <RegisterForm turnstileSiteKey={turnstile.enabled ? turnstile.siteKey : undefined} />
      </div>
    </div>
    </>
  );
}
