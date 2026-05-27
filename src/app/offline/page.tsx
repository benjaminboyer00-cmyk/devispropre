import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hors ligne",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-4xl">📡</p>
      <h1 className="mt-4 text-2xl font-bold">Vous êtes hors ligne</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Reconnectez-vous au réseau pour synchroniser vos devis et factures.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        Réessayer
      </Link>
    </div>
  );
}
