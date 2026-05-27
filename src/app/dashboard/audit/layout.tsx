import type { Metadata } from "next";
import { dashboardMetadata } from "@/lib/dashboard-metadata";

export const metadata: Metadata = dashboardMetadata("Journal d'audit");

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
