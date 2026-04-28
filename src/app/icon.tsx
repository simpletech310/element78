import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle at 30% 20%, #4DA9D6 0%, #2E7FB0 35%, #0A0E14 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#F2EEE8",
          fontWeight: 700,
        }}
      >
        <div style={{ fontSize: 240, lineHeight: 1, letterSpacing: -8 }}>78</div>
        <div style={{ fontSize: 32, color: "#8FB8D6", letterSpacing: 12, marginTop: 6 }}>ELEMENT</div>
      </div>
    ),
    size,
  );
}
