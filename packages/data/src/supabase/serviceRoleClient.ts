import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey, getSupabaseUrl } from "./env";

/**
 * Cliente con service role: salta RLS. SOLO para Route Handlers bajo
 * apps/web/app/api/v1/ que de verdad lo necesiten (envíos con Resend,
 * agregados que cruzan datos que el usuario no podría leer directo por RLS).
 * El import "server-only" hace que Next.js falle el build si esto se cuela
 * en un bundle de cliente.
 */
export function createSupabaseServiceRoleClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
