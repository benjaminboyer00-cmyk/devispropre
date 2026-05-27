import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false },
};

export default function ConnexionPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:py-24">
      <h1 className="heading-section text-3xl">Connexion</h1>
      <p className="text-lead mt-3 font-light">Accédez à vos devis et factures.</p>
      <div className="ui-card-padded mt-10">
        <LoginForm />
      </div>
    </div>
  );
}
