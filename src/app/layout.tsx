import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { PlausibleScript } from "@/components/analytics/PlausibleScript";
import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import { SkipLink } from "@/components/ui/SkipLink";
import { UiProviders } from "@/components/ui/UiProviders";
import { getRequestNonce } from "@/lib/nonce";
import { defaultMetadata, jsonLdSiteGraph } from "@/lib/seo";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

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
    { media: "(prefers-color-scheme: light)", color: "#1a3a5c" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0e0d" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = await getRequestNonce();

  return (
    <html lang="fr" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://m.stripe.network" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
        <link rel="dns-prefetch" href="https://plausible.io" />
        <link rel="dns-prefetch" href="https://eu.i.posthog.com" />
        <PlausibleScript />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <Script
          id="json-ld-site-graph"
          type="application/ld+json"
          strategy="beforeInteractive"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdSiteGraph()),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background font-sans antialiased text-foreground">
        <UiProviders>
          <SiteAnalytics>
            <SkipLink />
            <RegisterServiceWorker />
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </SiteAnalytics>
        </UiProviders>
      </body>
    </html>
  );
}
