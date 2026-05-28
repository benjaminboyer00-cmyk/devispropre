"use client";

import { usePathname } from "next/navigation";

interface SiteChromeProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

/** Masque header/footer marketing dans l'espace connecté (/dashboard). */
export function SiteChrome({ header, footer, children }: SiteChromeProps) {
  const pathname = usePathname() ?? "";
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <>
      {!isDashboard && header}
      {children}
      {!isDashboard && footer}
    </>
  );
}
