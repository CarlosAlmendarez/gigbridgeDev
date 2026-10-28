import type { MetadataRoute } from "next";

/**
 * Manifest de la PWA (doc de estrategia, "PWA y uso en ruta"): lo mínimo
 * para que el teléfono ofrezca instalarla. Los íconos los genera
 * `app/icon.tsx` — no hay PNGs en public/. La caché offline del day sheet
 * es Fase 3 y vive en public/sw.js, no aquí.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GigBridge Tour Manager",
    short_name: "GigBridge",
    description: "Administración de gira: day sheet, venue, equipo y documentos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f2f2",
    theme_color: "#0088b0",
    lang: "es",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
