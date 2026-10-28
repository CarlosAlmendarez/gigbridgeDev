import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow } from "@gigbridge/types";

/**
 * Esto SÍ es real: `auth.users` y `public.profiles` ya existen en el
 * proyecto Supabase de GigBridge. Funciona igual reciba el cliente de
 * browser o el de servidor — y funcionará igual desde React Native con
 * @supabase/supabase-js más adelante.
 */
export async function getCurrentUser(client: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) return null;
  return user;
}

export async function getCurrentProfile(client: SupabaseClient): Promise<ProfileRow | null> {
  const user = await getCurrentUser(client);
  if (!user) return null;
  const { data, error } = await client.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}
