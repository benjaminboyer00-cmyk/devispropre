import Link from "next/link";
import { SITE } from "@/lib/seo";

export function Footer() {
  return (
    <footer className="site-footer mt-auto border-t">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="text-brand text-lg font-bold">DevisPropre</p>
            <p className="text-body mt-3 text-sm leading-relaxed">
              Devis et factures pour artisans. Simple, rapide, conforme.
            </p>
          </div>
          <div>
            <p className="heading text-sm font-semibold">Produit</p>
            <ul className="text-body mt-3 space-y-2 text-sm">
              <li>
                <Link href="/tarifs" className="link-underline">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/conformite" className="link-underline">
                  Conformité TVA
                </Link>
              </li>
              <li>
                <Link href="/inscription" className="link-underline">
                  Inscription
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="heading text-sm font-semibold">Légal</p>
            <ul className="text-body mt-3 space-y-2 text-sm">
              <li>
                <Link href="/mentions-legales" className="link-underline">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/politique-confidentialite" className="link-underline">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/cgu" className="link-underline">
                  CGU
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="link-underline">
                  CGV
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="heading text-sm font-semibold">Contact</p>
            <p className="text-body mt-3 text-sm leading-relaxed">
              {SITE.owner}
              <br />
              <a href={`tel:+${SITE.phoneRaw}`} className="link-underline font-medium">
                {SITE.phone}
              </a>
            </p>
          </div>
        </div>
        <p className="text-subtle mt-12 text-center text-xs" suppressHydrationWarning>
          © {new Date().getFullYear()} DevisPropre · devispropre.fr
        </p>
      </div>
    </footer>
  );
}
