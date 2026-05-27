import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
          DevisPropre
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <Link href="/tarifs" className="hidden text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white sm:inline">
            Tarifs
          </Link>
          <Link href="/conformite" className="hidden text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white sm:inline">
            Conformité TVA
          </Link>
          <ThemeToggle />
          <Link
            href="/inscription"
            className="rounded-lg bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 sm:px-4"
          >
            Essai gratuit
          </Link>
        </nav>
      </div>
    </header>
  );
}
