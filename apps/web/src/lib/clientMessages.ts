import "server-only";
import { getMessages } from "next-intl/server";

/**
 * Solo los namespaces que usan los componentes cliente de una sección.
 * NextIntlClientProvider serializa en el HTML todo lo que recibe (y en
 * next-intl 4, si no se le pasa `messages`, hereda TODOS): pasar el
 * catálogo completo mandaba ~120 KB por página, la mayoría de módulos que
 * ni existen todavía en esta app. Cada layout pide lo suyo.
 */
export async function clientMessages(namespaces: string[]) {
  const all = (await getMessages()) as Record<string, unknown>;
  return Object.fromEntries(namespaces.filter((n) => n in all).map((n) => [n, all[n]]));
}
