import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { OfflineSyncBar } from "@/components/pwa/OfflineSyncBar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardNav />
      <OfflineSyncBar />
      {children}
    </>
  );
}
