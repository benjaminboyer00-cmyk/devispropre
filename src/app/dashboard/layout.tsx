import type { Metadata } from "next";
import { Suspense } from "react";
import { PendingDevisRedirect } from "@/components/billing/PendingDevisRedirect";
import { SubscriptionSetupBanner } from "@/components/billing/SubscriptionSetupBanner";
import { BillingPastDueBanner } from "@/components/billing/BillingPastDueBanner";
import { CheckoutFeedback } from "@/components/billing/CheckoutFeedback";
import { ClaimGuestDraftOnMount } from "@/components/devis/ClaimGuestDraftOnMount";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { OfflineSyncBar } from "@/components/pwa/OfflineSyncBar";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import { dashboardRobotsOnly } from "@/lib/dashboard-metadata";

export const metadata: Metadata = dashboardRobotsOnly;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClaimGuestDraftOnMount />
      <RegisterServiceWorker />
      <Suspense fallback={null}>
        <CheckoutFeedback />
      </Suspense>
      <Suspense fallback={null}>
        <PendingDevisRedirect />
      </Suspense>
      <DashboardNav />
      <SubscriptionSetupBanner />
      <BillingPastDueBanner />
      <OfflineSyncBar />
      {children}
    </>
  );
}
