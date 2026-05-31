import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/BrandMark";

interface AuthEmailPanelProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function AuthEmailPanel({ title, subtitle, icon, children }: AuthEmailPanelProps) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-20">
      <div className="text-center">
        <BrandMark size="lg" />
        {icon ? (
          <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--blue-soft)] text-[var(--blue)]">
            {icon}
          </div>
        ) : null}
      </div>
      <h1 className="heading-section mt-8 text-center text-2xl sm:text-3xl">{title}</h1>
      {subtitle ? <p className="text-lead mx-auto mt-3 max-w-md text-center font-light">{subtitle}</p> : null}
      <div className="ui-card-padded mt-8 space-y-5">{children}</div>
    </div>
  );
}

export function AuthMailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-7 w-7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

export function AuthKeyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-7 w-7" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}
