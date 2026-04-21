import { ImageResponse } from "next/og";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${APP_NAME} — ${APP_TAGLINE}`;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="26" fill="#111111"/>
  <path d="M30 84 L60 48 L90 84" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="60" cy="98" r="6" fill="#ffffff"/>
</svg>`;

export default function OgImage() {
  const src = `data:image/svg+xml;base64,${Buffer.from(iconSvg).toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8f8f7",
          gap: "28px",
        }}
      >
        <img src={src} width={120} height={120} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#111111",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            {APP_NAME}
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#666666",
              letterSpacing: "-0.5px",
            }}
          >
            {APP_TAGLINE}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
