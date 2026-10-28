import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getCurrentUser } from "./session";

/**
 * Port framework-agnostic de v1 (GigBridge/gigbridge/src/lib/apiAuth.ts):
 * mismos 4 guards (requireUser/requireProfile/requireAdmin/
 * requireSuperAdmin), pero sin `NextResponse` — devuelven un resultado
 * puro (`status` + `message`) y el caller en apps/web decide cómo
 * convertirlo en respuesta HTTP. También cambia cómo se lee el perfil
 * completo: v1 usaba el cliente service-role para saltar el column-grant
 * hardening de `profiles`; aquí se usa la función `current_profile()`
 * (security definer, ver 0001_foundations.sql) hecha exactamente para
 * esto — un guard no necesita el cliente service-role solo para leer
 * el propio perfil del caller.
 */

export interface AuthProfile {
  id: string;
  is_admin: boolean;
  is_super_admin: boolean;
}

export type GuardFail = { ok: false; status: number; message: string };
export type UserOk = { ok: true; user: User };
export type ProfileOk = { ok: true; user: User; profile: AuthProfile };

export async function requireUser(client: SupabaseClient): Promise<UserOk | GuardFail> {
  const user = await getCurrentUser(client);
  if (!user) return { ok: false, status: 401, message: "No autenticado" };
  return { ok: true, user };
}

export async function requireProfile(client: SupabaseClient): Promise<ProfileOk | GuardFail> {
  const auth = await requireUser(client);
  if (!auth.ok) return auth;

  const { data, error } = await client.rpc("current_profile");
  if (error) return { ok: false, status: 500, message: "Error interno del servidor" };

  const profile = (data as AuthProfile[] | null)?.[0] ?? null;
  if (!profile) return { ok: false, status: 404, message: "Perfil no encontrado" };
  return { ok: true, user: auth.user, profile };
}

export async function requireAdmin(client: SupabaseClient): Promise<ProfileOk | GuardFail> {
  const auth = await requireProfile(client);
  if (!auth.ok) return auth;
  if (!auth.profile.is_admin) {
    return { ok: false, status: 403, message: "Sin permisos de administrador" };
  }
  return auth;
}

export async function requireSuperAdmin(client: SupabaseClient): Promise<ProfileOk | GuardFail> {
  const auth = await requireProfile(client);
  if (!auth.ok) return auth;
  if (!auth.profile.is_super_admin) {
    return { ok: false, status: 403, message: "Acceso denegado" };
  }
  return auth;
}
