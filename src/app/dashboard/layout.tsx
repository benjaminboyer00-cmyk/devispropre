import type { Metadata } from "next";
import { Suspense } from "react";
import { PendingDevisRedirect } from "@/components/billing/PendingDevisRedirect";
import { ClaimGuestDraftOnMount } from "@/components/devis/ClaimGuestDraftOnMount";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { OfflineSyncBar } from "@/components/pwa/OfflineSyncBar";
import { dashboardRobotsOnly } from "@/lib/dashboard-metadata";

export const metadata: Metadata = dashboardRobotsOnly;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClaimGuestDraftOnMount />
      <Suspense fallback={null}>
        <PendingDevisRedirect />
      </Suspense>
      <DashboardNav />
      <OfflineSyncBar />
      {children}
    </>
  );
}
