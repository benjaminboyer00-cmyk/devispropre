import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { WebVitals } from "@/components/analytics/WebVitals";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import { defaultMetadata, jsonLdOrganization, jsonLdWebSite } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  ...defaultMetadata,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DevisPropre",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#080d16" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdWebSite()),
          }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdOrganization()),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background font-sans antialiased text-foreground">
        <WebVitals />
        <RegisterServiceWorker />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
