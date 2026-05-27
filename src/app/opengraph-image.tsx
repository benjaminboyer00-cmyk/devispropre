import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo";

export const runtime = "edge";
export const alt = "DevisPropre — Devis et factures pour artisans";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background: "linear-gradient(135deg, #e8f0f8 0%, #fafaf9 50%, #ffffff 100%)",
        }}
      >
        <div style={{ fontSize: 28, color: "#1a3a5c", fontWeight: 600 }}>{SITE.tagline}</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#1c1917", marginTop: 16, lineHeight: 1.1 }}>
          Devis pro en 2 minutes
        </div>
        <div style={{ fontSize: 28, color: "#57534e", marginTop: 24, maxWidth: 900 }}>
          Devis · Factures conformes TVA 2018 · WhatsApp · Artisans BTP
        </div>
        <div style={{ fontSize: 24, color: "#d97706", marginTop: 48, fontWeight: 700 }}>
          devispropre.fr
        </div>
      </div>
    ),
    { ...size }
  );
}
