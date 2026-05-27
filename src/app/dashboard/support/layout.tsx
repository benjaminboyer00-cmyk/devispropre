import type { Metadata } from "next";
import { dashboardMetadata } from "@/lib/dashboard-metadata";

export const metadata: Metadata = dashboardMetadata("Support Pro");

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
