"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function DashboardNav() {
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="heading shrink-0 text-sm font-semibold">
          DevisPropre
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/devis/nouveau" className="ui-btn-primary px-3 py-2 text-sm sm:px-4">
            + Devis
          </Link>
          <Link href="/dashboard/settings" className="ui-btn-outline hidden px-3 py-2 text-sm sm:inline-flex">
            Paramètres
          </Link>
          <LogoutButton className="hidden sm:inline-flex" />
          <Link href="/dashboard/settings" className="ui-btn-outline px-2 py-2 text-sm sm:hidden" aria-label="Paramètres">
            ⚙️
          </Link>
        </div>
      </div>
    </nav>
  );
}
