import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          DevisPropre
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link href="/tarifs" className="hidden text-muted-foreground transition hover:text-foreground sm:inline">
            Tarifs
          </Link>
          <Link href="/conformite" className="hidden text-muted-foreground transition hover:text-foreground sm:inline">
            Conformité TVA
          </Link>
          <ThemeToggle />
          <Link href="/inscription" className="btn-primary px-3 py-2 sm:px-4">
            Essai gratuit
          </Link>
        </nav>
      </div>
    </header>
  );
}
