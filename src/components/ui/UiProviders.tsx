"use client";

import { ToastProvider } from "@/components/ui/ToastProvider";

export function UiProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
