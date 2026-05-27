import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Inscription gratuite — 30 secondes",
  description:
    "Créez votre compte DevisPropre gratuitement. Devis et factures pour artisans, conformes loi anti-fraude TVA 2018.",
};

export default function InscriptionPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold">Inscription en 30 secondes</h1>
      <p className="mt-2 text-slate-600">
        Gratuit 30 jours · Sans carte bleue · Premier devis en 2 minutes
      </p>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
