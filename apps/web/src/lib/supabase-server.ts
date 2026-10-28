import "server-only";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@gigbridge/data/server";

/**
 * Adapta el `cookies()` de Next.js (async, específico de este framework) al
 * `CookieAdapter` genérico que espera @gigbridge/data — así ese paquete no
 * depende de next/headers y puede, en teoría, alimentarse desde cualquier
 * runtime de servidor.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Se llamó desde el render de un Server Component: no se pueden
        // escribir cookies ahí. El middleware (si se agrega) o un Route
        // Handler se encargan de refrescar la sesión.
      }
    },
  });
}
