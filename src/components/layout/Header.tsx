import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export async function Header() {
  const session = await getSession();

  return (
    <header className="site-header sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold transition-colors duration-200">
          <span className="text-brand">Devis</span>
          <span className="text-[var(--accent)]">Propre</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link href={ROUTES.tarifs} className="nav-link hidden sm:inline">
            Tarifs
          </Link>
          <Link href={ROUTES.conformite} className="nav-link hidden sm:inline">
            Conformité TVA
          </Link>
          <ThemeToggle />
          {session ? (
            <>
              <Link href={ROUTES.dashboard} className="nav-link text-sm">
                Mon espace
              </Link>
              <Link href={ROUTES.dashboardDevisNew} className="ui-btn-primary px-3 py-2 sm:px-4">
                + Devis
              </Link>
            </>
          ) : (
            <>
              <Link href={ROUTES.connexion} className="nav-link text-sm">
                Connexion
              </Link>
              <Link href={ROUTES.inscription} className="ui-btn-primary px-3 py-2 sm:px-4">
                Essai gratuit
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
