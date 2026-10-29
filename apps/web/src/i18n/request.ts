import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_COOKIE, tourMessages, type Locale } from "@gigbridge/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;

  return {
    locale,
    // El namespace `tour` sale de @gigbridge/config: la capa de datos (y la
    // app nativa) usan el mismo diccionario.
    messages: { ...(await import(`../../messages/${locale}.json`)).default, tour: tourMessages(locale) },
  };
});
