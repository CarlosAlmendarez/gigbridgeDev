import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@gigbridge/types";

/**
 * Lógica pura (sin `redirect`/`revalidatePath`/FormData) detrás de las
 * Server Actions de v1 (GigBridge/gigbridge/src/lib/actions/auth.ts) y
 * de POST /api/setup-profile — ambos creaban profile+band con código
 * casi idéntico; aquí queda en un solo lugar.
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function isSlugAvailable(client: SupabaseClient, slug: string): Promise<boolean> {
  const normalized = slugify(slug);
  if (!normalized || normalized.length < 2) return false;

  const { data } = await client.from("profiles").select("id").eq("slug", normalized).maybeSingle();
  return !data;
}

export interface CreateProfileAndBandInput {
  userId: string;
  slug: string;
  displayName: string;
  role: UserRole;
}

export interface CreateProfileAndBandResult {
  profileId: string;
  slug: string;
}

export type ActionResult<T> = { ok: true; result: T } | { ok: false; message: string };

/**
 * Crea el profile y su fila de bands (necesaria para el editor de EPK de
 * CUALQUIER perfil, no solo artistas — así lo hacía ya v1). Requiere un
 * cliente que salte RLS (service-role): justo después del signUp la
 * sesión todavía no está en cookies en ese mismo request, así que
 * `auth.uid()` sería NULL y las policies de `profiles`/`bands` fallarían.
 */
export async function createProfileAndBand(
  client: SupabaseClient,
  { userId, slug, displayName, role }: CreateProfileAndBandInput
): Promise<ActionResult<CreateProfileAndBandResult>> {
  const normalizedSlug = slugify(slug || displayName);
  if (normalizedSlug.length < 2) {
    return { ok: false, message: "El slug es demasiado corto." };
  }

  const { data: existing } = await client
    .from("profiles")
    .select("id")
    .eq("slug", normalizedSlug)
    .maybeSingle();
  if (existing) {
    return { ok: false, message: "Ese slug ya está en uso. Elige otro nombre de URL." };
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .insert({
      user_id: userId,
      slug: normalizedSlug,
      display_name: displayName,
      role,
      availability_status: "available",
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    return { ok: false, message: profileError?.message ?? "Error interno del servidor" };
  }

  const { error: bandError } = await client
    .from("bands")
    .insert({ profile_id: profile.id, name: displayName });

  if (bandError) {
    return { ok: false, message: bandError.message };
  }

  return { ok: true, result: { profileId: profile.id, slug: normalizedSlug } };
}

export async function updateProfileRole(
  client: SupabaseClient,
  userId: string,
  role: UserRole
): Promise<{ error: string | null }> {
  const { error } = await client.from("profiles").update({ role }).eq("user_id", userId);
  return { error: error?.message ?? null };
}

export async function updateAvailabilityCity(
  client: SupabaseClient,
  userId: string,
  city: string
): Promise<{ error: string | null }> {
  const trimmed = city.trim();
  const { error } = await client
    .from("profiles")
    .update({ availability_city: trimmed || null })
    .eq("user_id", userId);
  return { error: error?.message ?? null };
}
