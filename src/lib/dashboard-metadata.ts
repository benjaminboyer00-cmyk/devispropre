import type { Metadata } from "next";

const DASHBOARD_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

/** Metadata robots explicite — chaque page dashboard doit l'exporter en plus du layout. */
export function dashboardMetadata(title: string): Metadata {
  return { title, robots: DASHBOARD_ROBOTS };
}

export const dashboardRobotsOnly: Metadata = { robots: DASHBOARD_ROBOTS };
