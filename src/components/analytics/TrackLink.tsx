"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics";

type TrackLinkProps = ComponentProps<typeof Link> & {
  event: string;
  eventProps?: Record<string, string | number>;
};

/** Lien avec événement Plausible/PostHog au clic (CTA, conversions SEO). */
export function TrackLink({ event, eventProps, onClick, ...props }: TrackLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(event, { ...eventProps, href: String(props.href) });
        onClick?.(e);
      }}
    />
  );
}
