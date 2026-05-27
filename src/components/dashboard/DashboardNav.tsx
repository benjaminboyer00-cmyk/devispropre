"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function DashboardNav() {
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="heading text-sm font-semibold">
          DevisPropre
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard" className="text-body text-sm hover:underline">
            Tableau de bord
          </Link>
          <Link href="/dashboard/settings" className="text-body text-sm hover:underline">
            Paramètres
          </Link>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
