import Link from "next/link";
import { SITE } from "@/lib/seo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <p className="font-bold text-primary">DevisPropre</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Devis et factures pour artisans. Simple, rapide, conforme.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Produit</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li><Link href="/tarifs" className="hover:text-primary">Tarifs</Link></li>
              <li><Link href="/conformite" className="hover:text-primary">Conformité TVA</Link></li>
              <li><Link href="/inscription" className="hover:text-primary">Inscription</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Légal</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li><Link href="/mentions-legales" className="hover:text-primary">Mentions légales</Link></li>
              <li><Link href="/politique-confidentialite" className="hover:text-primary">Confidentialité</Link></li>
              <li><Link href="/cgu" className="hover:text-primary">CGU</Link></li>
              <li><Link href="/cgv" className="hover:text-primary">CGV</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Contact</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {SITE.owner}<br />
              <a href={`tel:+${SITE.phoneRaw}`} className="hover:text-primary">{SITE.phone}</a>
            </p>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} DevisPropre · devispropre.fr
        </p>
      </div>
    </footer>
  );
}
