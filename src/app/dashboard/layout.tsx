import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { OfflineSyncBar } from "@/components/pwa/OfflineSyncBar";
import { dashboardRobotsOnly } from "@/lib/dashboard-metadata";

export const metadata: Metadata = dashboardRobotsOnly;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardNav />
      <OfflineSyncBar />
      {children}
    </>
  );
}
