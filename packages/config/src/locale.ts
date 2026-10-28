export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";
export const LOCALE_COOKIE = "GIGBRIDGE_LOCALE";

export function isSupportedLocale(value: string | undefined | null): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Detecta el idioma de un visitante nuevo (sin cookie de idioma todavía):
 * geolocalización primero (Vercel inyecta `x-vercel-ip-country` en el
 * edge), y si no hay dato de geo (ej. desarrollo local) cae al
 * `Accept-Language` del navegador/SO. Port puro de la función del mismo
 * nombre en GigBridge/gigbridge/src/proxy.ts — separada de Next para que
 * la reescritura de `proxy.ts` en apps/web (o el equivalente en una app
 * nativa futura) solo tenga que pasarle los dos headers.
 */
export function detectLocale(headers: { country: string | null; acceptLanguage: string | null }): Locale {
  if (headers.country === "US") return "en";
  if (headers.country === "MX") return "es";

  const preferred = headers.acceptLanguage?.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  if (isSupportedLocale(preferred)) return preferred;

  return DEFAULT_LOCALE;
}
