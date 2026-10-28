import "server-only";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

export interface CookieAdapter {
  getAll(): Array<{ name: string; value: string }>;
  setAll(cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>): void;
}

/**
 * Cliente de Supabase para Server Components / Route Handlers, con RLS
 * (respeta la sesión del usuario autenticado). No importa `next/headers`
 * directamente para no atar este paquete a Next.js: quien lo llama desde
 * `apps/web` pasa un adaptador construido con `cookies()`.
 */
export function createSupabaseServerClient(cookieAdapter: CookieAdapter) {
  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll: () => cookieAdapter.getAll(),
      setAll: (cookiesToSet) => cookieAdapter.setAll(cookiesToSet),
    },
  });
}
