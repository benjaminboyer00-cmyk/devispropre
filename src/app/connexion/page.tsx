import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false },
};

export default function ConnexionPage() {
  return (
    <div className="page-shell max-w-md">
      <h1 className="page-title text-2xl">Connexion</h1>
      <p className="mt-2 text-muted-foreground">Accédez à vos devis et factures.</p>
      <div className="card-padded mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
