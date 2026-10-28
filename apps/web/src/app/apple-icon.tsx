import { ImageResponse } from "next/og";

// iOS no usa los íconos del manifest para "Agregar a inicio"; necesita este.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0088b0",
          color: "#f3f2f2",
          fontSize: 66,
          fontWeight: 700,
        }}
      >
        GB
      </div>
    ),
    size
  );
}
