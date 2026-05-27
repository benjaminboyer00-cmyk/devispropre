import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hors ligne",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="page-shell max-w-md py-24 text-center">
      <p className="text-4xl">📡</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">Vous êtes hors ligne</h1>
      <p className="mt-2 text-muted-foreground">
        Reconnectez-vous au réseau pour synchroniser vos devis et factures.
      </p>
      <Link href="/dashboard" className="btn-primary mt-8 inline-block px-6 py-3">
        Réessayer
      </Link>
    </div>
  );
}
