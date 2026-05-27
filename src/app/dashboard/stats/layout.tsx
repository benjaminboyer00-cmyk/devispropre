import type { Metadata } from "next";
import { dashboardMetadata } from "@/lib/dashboard-metadata";

export const metadata: Metadata = dashboardMetadata("Statistiques");

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
