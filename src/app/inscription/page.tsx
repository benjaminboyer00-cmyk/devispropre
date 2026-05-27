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
    <div className="page-shell max-w-lg">
      <h1 className="page-title text-2xl sm:text-3xl">Inscription en 30 secondes</h1>
      <p className="mt-2 text-muted-foreground">
        Gratuit 30 jours · Sans carte bleue · Premier devis en 2 minutes
      </p>
      <div className="card-padded mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
