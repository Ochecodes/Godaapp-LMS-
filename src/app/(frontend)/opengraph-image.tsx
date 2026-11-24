import { ImageResponse } from "next/og";

export const alt = "Godaapp - Digital Asset Education";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #0b1020 0%, #14233f 55%, #183c48 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "80px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ color: "#78e6c1", fontSize: 28, fontWeight: 700, letterSpacing: 4 }}>
            Godaapp
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.08, maxWidth: 760 }}>
            Learn digital assets with confidence.
          </div>
          <div style={{ color: "#c5d2df", fontSize: 30 }}>
            Practical courses. Clear thinking. Better decisions.
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            border: "2px solid rgba(120, 230, 193, 0.6)",
            borderRadius: 28,
            color: "#78e6c1",
            display: "flex",
            fontSize: 94,
            fontWeight: 700,
            height: 190,
            justifyContent: "center",
            width: 190,
          }}
        >
          G
        </div>
      </div>
    ),
    size,
  );
}
