"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

/**
 * Cliente de Supabase para Client Components. Usa la anon key + RLS —
 * exactamente el mismo cliente que usará la futura app en React Native/Expo
 * con @supabase/supabase-js (ahí no hace falta la variante @supabase/ssr,
 * pero la superficie de auth/queries es idéntica).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
