import { RegisterForm } from "@/components/auth/RegisterForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Inscription — Essai gratuit 15 jours",
  description:
    "Créez votre compte DevisPropre. Essai Starter 15 jours gratuit avec carte bancaire, puis 19€/mois sans résiliation.",
  path: "/inscription",
});

export default function InscriptionPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:py-24">
      <h1 className="heading-section">Créer mon compte</h1>
      <p className="text-lead mt-3 font-light">
        30 secondes · Essai Starter 15 jours · Carte bancaire requise
      </p>
      <div className="ui-card-padded mt-10">
        <RegisterForm />
      </div>
    </div>
  );
}
