import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@gigbridge/data", "@gigbridge/types", "@gigbridge/config"],
  experimental: {
    // El proxy corre también en /api: sin esto corta el cuerpo a 10 MB y
    // una subida de documento (hasta 20 MB, ver packages/data tour/uploads.ts)
    // llegaría truncada.
    proxyClientMaxBodySize: "21mb",
  },
  images: {
    // Avatares/covers/galería de venues viven en Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  async headers() {
    return [
      {
        // Sin caché HTTP para el service worker: si no, el navegador puede
        // quedarse hasta 24 h con una versión vieja de sw.js.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
