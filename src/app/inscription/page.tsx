import { RegisterForm } from "@/components/auth/RegisterForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Inscription gratuite — 30 secondes",
  description:
    "Créez votre compte DevisPropre gratuitement. Devis et factures pour artisans, conformes loi anti-fraude TVA 2018.",
  path: "/inscription",
});

export default function InscriptionPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:py-24">
      <h1 className="heading-section">Inscription en 30 secondes</h1>
      <p className="text-lead mt-3 font-light">
        Gratuit 30 jours · Sans carte bleue · Premier devis en 2 minutes
      </p>
      <div className="ui-card-padded mt-10">
        <RegisterForm />
      </div>
    </div>
  );
}
