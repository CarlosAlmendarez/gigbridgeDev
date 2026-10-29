import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { clientMessages } from "@/lib/clientMessages";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

// Antes decía "Norte 2026" (la gira de ejemplo) también con giras reales.
const DESCRIPTION = {
  es: "Administración de giras: hoja del día, equipo, documentos y logística.",
  en: "Tour management: day sheets, crew, documents and logistics.",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) === "en" ? "en" : "es";
  return {
    title: "GigBridge Tour Manager",
    description: DESCRIPTION[locale],
    applicationName: "GigBridge",
    appleWebApp: { capable: true, title: "GigBridge", statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0088b0",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  // Base para páginas sin provider propio (auth, venue público); dashboard,
  // tour e invite montan el suyo con lo que necesitan.
  const messages = await clientMessages(["auth", "venue"]);

  return (
    <html lang={locale} className={sourceSerif.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
