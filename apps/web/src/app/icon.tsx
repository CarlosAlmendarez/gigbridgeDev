import { ImageResponse } from "next/og";

/**
 * Íconos de la PWA generados en build (rutas /icon/192 y /icon/512, que
 * referencia app/manifest.ts). Placeholder con las iniciales sobre el color
 * de acento hasta que exista el logo definitivo; el monograma ocupa el
 * 60% central para que sobreviva el recorte de un ícono "maskable".
 */
const SIZES = [192, 512] as const;

export function generateImageMetadata() {
  return SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
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
          fontSize: size * 0.36,
          fontWeight: 700,
          letterSpacing: -size * 0.01,
        }}
      >
        GB
      </div>
    ),
    { width: size, height: size }
  );
}
