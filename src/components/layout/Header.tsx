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
