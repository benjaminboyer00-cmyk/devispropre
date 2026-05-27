import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header() {
  return (
    <header className="site-header sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-xl font-bold transition-colors duration-200"
        >
          <span className="text-brand">Devis</span>
          <span className="text-[var(--accent)]">Propre</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link href="/tarifs" className="nav-link hidden sm:inline">
            Tarifs
          </Link>
          <Link href="/conformite" className="nav-link hidden sm:inline">
            Conformité TVA
          </Link>
          <ThemeToggle />
          <Link href="/inscription" className="ui-btn-primary px-3 py-2 sm:px-4">
            Essai gratuit
          </Link>
        </nav>
      </div>
    </header>
  );
}
