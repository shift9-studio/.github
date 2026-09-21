import { ImageResponse } from "next/og";

/* The link preview. Generated rather than shipped as a PNG so it cannot go
   stale or go missing, and so the colours stay the same tokens the site uses
   (espresso ground, saffron signal, paprika pulse, cream ink).
   Next serves this as og:image and twitter:image for every page that does not
   define its own. */

export const alt =
  "Feelspoon — every recipe in one place, then walked through cooking it. Android, on Google Play.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const VOID = "#1b1410";
const SIGNAL = "#f5a524";
const PULSE = "#e8633a";
const INK = "#f6ead8";
const DIM = "#a99780";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: VOID,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 13,
              background: SIGNAL,
              alignItems: "center",
              justifyContent: "center",
              color: VOID,
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            F
          </div>
          <div
            style={{
              display: "flex",
              color: DIM,
              fontSize: 22,
              letterSpacing: 6,
            }}
          >
            FEELSPOON · RECIPE ORGANIZER · ANDROID
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: INK,
              fontSize: 96,
              lineHeight: 1.02,
              letterSpacing: -2,
              fontWeight: 700,
            }}
          >
            <span>Every recipe.</span>
            <span style={{ color: PULSE }}>Finally cooked.</span>
          </div>
          <div
            style={{
              display: "flex",
              color: DIM,
              fontSize: 30,
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            One place for every recipe, then step-by-step cook mode — scaled to
            your servings, saved from a link, a photo or pasted text.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `2px solid ${SIGNAL}`,
            paddingTop: 28,
            color: DIM,
            fontSize: 24,
          }}
        >
          <span>feelspoon.app</span>
          <span style={{ color: SIGNAL }}>Free on Google Play</span>
        </div>
      </div>
    ),
    size,
  );
}
