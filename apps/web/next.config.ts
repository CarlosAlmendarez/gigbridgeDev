import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@gigbridge/data", "@gigbridge/types", "@gigbridge/config"],
  images: {
    // Avatares/covers/galería de venues viven en Supabase Storage.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default withNextIntl(nextConfig);
