import { ImageResponse } from "next/og";
import { siteHostname } from "@/lib/seo";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

export function renderLocalOgImage(title: string, subtitle: string) {
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
          background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #f0fdf4 100%)",
        }}
      >
        <div style={{ fontSize: 26, color: "#1a3a5c", fontWeight: 600 }}>DevisPropre</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#0f172a",
            marginTop: 20,
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 28, color: "#475569", marginTop: 28, maxWidth: 900 }}>{subtitle}</div>
        <div style={{ fontSize: 22, color: "#d97706", marginTop: 40, fontWeight: 600 }}>
          {siteHostname()} · Conforme TVA 2018
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE }
  );
}
