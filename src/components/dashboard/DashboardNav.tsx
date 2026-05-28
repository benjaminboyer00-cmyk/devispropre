"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ROUTES } from "@/lib/routes";

const NAV_LINKS = [
  { href: ROUTES.dashboard, label: "Accueil", prefix: "/dashboard/activer" },
  { href: ROUTES.dashboardDevisList, label: "Devis", prefix: "/dashboard/devis" },
  { href: ROUTES.dashboardFactures, label: "Factures", prefix: "/dashboard/factures" },
  { href: ROUTES.dashboardSettings, label: "Mon compte", prefix: "/dashboard/settings" },
] as const;

function isActive(pathname: string, href: string, prefix: string): boolean {
  if (href === ROUTES.dashboard) {
    return pathname === ROUTES.dashboard;
  }
  if (href === ROUTES.dashboardDevisList) {
    return pathname.startsWith("/dashboard/devis");
  }
  return pathname === href || pathname.startsWith(`${prefix}/`);
}

export function DashboardNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href={ROUTES.dashboard} className="heading shrink-0 text-sm font-semibold">
            DevisPropre
          </Link>
          <div className="flex items-center gap-2">
            <Link href={ROUTES.dashboardDevisNew} className="ui-btn-primary px-3 py-2 text-sm sm:px-4">
              + Devis
            </Link>
            <LogoutButton className="hidden sm:inline-flex" />
          </div>
        </div>

        <div className="mt-3 flex gap-1 overflow-x-auto pb-1 sm:gap-2">
          {NAV_LINKS.map(({ href, label, prefix }) => {
            const active = isActive(pathname, href, prefix);
            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--blue-soft)] text-[var(--blue)]"
                    : "text-[var(--text-body)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="ml-auto sm:hidden">
            <LogoutButton className="px-2 py-2 text-sm" />
          </div>
        </div>
      </div>
    </nav>
  );
}
