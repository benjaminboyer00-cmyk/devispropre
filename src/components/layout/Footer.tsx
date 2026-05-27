import Link from "next/link";
import { SITE } from "@/lib/seo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <p className="font-bold text-blue-600 dark:text-blue-400">DevisPropre</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Devis et factures pour artisans. Simple, rapide, conforme.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Produit</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/tarifs" className="hover:text-blue-600 dark:hover:text-blue-400">Tarifs</Link></li>
              <li><Link href="/conformite" className="hover:text-blue-600 dark:hover:text-blue-400">Conformité TVA</Link></li>
              <li><Link href="/inscription" className="hover:text-blue-600 dark:hover:text-blue-400">Inscription</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Légal</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/mentions-legales">Mentions légales</Link></li>
              <li><Link href="/politique-confidentialite">Confidentialité</Link></li>
              <li><Link href="/cgu">CGU</Link></li>
              <li><Link href="/cgv">CGV</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Contact</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {SITE.owner}<br />
              <a href={`tel:+${SITE.phoneRaw}`} className="hover:text-blue-600 dark:hover:text-blue-400">{SITE.phone}</a>
            </p>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} DevisPropre · devispropre.fr
        </p>
      </div>
    </footer>
  );
}
