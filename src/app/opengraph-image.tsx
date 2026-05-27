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
          background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f8fafc 100%)",
        }}
      >
        <div style={{ fontSize: 28, color: "#2563eb", fontWeight: 600 }}>{SITE.tagline}</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#0f172a", marginTop: 16, lineHeight: 1.1 }}>
          Devis pro en 2 minutes
        </div>
        <div style={{ fontSize: 28, color: "#475569", marginTop: 24, maxWidth: 900 }}>
          Devis · Factures conformes TVA 2018 · WhatsApp · Artisans BTP
        </div>
        <div style={{ fontSize: 24, color: "#2563eb", marginTop: 48, fontWeight: 700 }}>
          devispropre.fr
        </div>
      </div>
    ),
    { ...size }
  );
}
