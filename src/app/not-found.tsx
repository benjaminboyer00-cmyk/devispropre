import type { Metadata } from "next";
import Link from "next/link";
import { localSeoPath } from "@/lib/local-seo";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-6xl font-bold text-blue-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-slate-600">
        Ce devis a peut-être expiré, ou la page n&apos;existe pas.
      </p>

      <nav aria-label="Liens utiles" className="mt-10 space-y-3 text-sm">
        <p>
          <Link href="/" className="link-blue hover:underline">
            Retour à l&apos;accueil
          </Link>
        </p>
        <p>
          <Link href={ROUTES.tarifs} className="link-blue hover:underline">
            Voir les tarifs
          </Link>
        </p>
        <p>
          <Link href={ROUTES.connexion} className="link-blue hover:underline">
            Se connecter
          </Link>
        </p>
        <p>
          <Link href={localSeoPath("plombier", "paris")} className="link-blue hover:underline">
            Devis plombier à Paris
          </Link>
        </p>
      </nav>

      <Link href="/" className="ui-btn-primary mt-10 inline-block px-6 py-3">
        Créer un devis gratuitement
      </Link>
    </div>
  );
}
