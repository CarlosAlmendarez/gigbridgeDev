import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Norte 2026 · GigBridge Tour Manager",
  description: "Administración de gira para Las Bestias del Valle · Norte 2026",
  applicationName: "GigBridge",
  appleWebApp: { capable: true, title: "GigBridge", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0088b0",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={sourceSerif.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
