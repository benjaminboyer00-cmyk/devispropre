import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-blue-600">
          DevisPropre
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/tarifs" className="text-slate-600 hover:text-slate-900">
            Tarifs
          </Link>
          <Link href="/conformite" className="text-slate-600 hover:text-slate-900">
            Conformité TVA
          </Link>
          <Link
            href="/inscription"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Essai gratuit
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-bold text-blue-600">DevisPropre</p>
            <p className="mt-2 text-sm text-slate-600">
              Devis et factures pour artisans. Simple, rapide, conforme.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Produit</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li><Link href="/tarifs">Tarifs</Link></li>
              <li><Link href="/conformite">Loi anti-fraude TVA</Link></li>
              <li><Link href="/inscription">Inscription</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Contact</p>
            <p className="mt-2 text-sm text-slate-600">
              Assistance WhatsApp · Réponse sous 1h
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
