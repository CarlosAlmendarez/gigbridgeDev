import type { SupabaseClient } from "@supabase/supabase-js";
import type { GuestStatus, SetlistRow } from "@gigbridge/types";
import type { ActionResult } from "../auth/actions";
import { addGuestSchema, guestStatusUpdateSchema, reorderListSchema } from "../validation/tour";

/**
 * Escrituras del módulo de gira sobre las tablas reales. Igual que
 * supabaseRepository.ts: no re-chequean permisos, escriben con el cliente
 * de sesión y la RLS decide (0006). Cuando la RLS rechaza en silencio (un
 * update que afecta 0 filas) se traduce a un mensaje para la UI.
 *
 * Las usan las Server Actions de apps/web y, a futuro, la app nativa con su
 * propio cliente — por eso validan aquí con los schemas compartidos.
 */

async function currentProfileId(client: SupabaseClient): Promise<string | null> {
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await client.from("profiles").select("id").eq("user_id", data.user.id).maybeSingle();
  return (profile?.id as string | undefined) ?? null;
}

export async function addGuestEntry(
  client: SupabaseClient,
  input: { tourDateId: string; name: string }
): Promise<ActionResult<{ id: string }>> {
  const parsed = addGuestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { data, error } = await client
    .from("guest_list_entries")
    .insert({ tour_date_id: parsed.data.tourDateId, guest_name: parsed.data.name, added_by: await currentProfileId(client) })
    .select("id")
    .single();
  // 42501: la RLS rechazó el insert (no es miembro de la gira).
  if (error?.code === "42501") return { ok: false, message: "Solo el equipo de la gira puede agregar invitados." };
  if (error) return { ok: false, message: "No se pudo agregar el invitado." };
  return { ok: true, result: { id: data.id as string } };
}

export async function setGuestEntryStatus(
  client: SupabaseClient,
  input: { tourDateId: string; guestId: string; status: GuestStatus }
): Promise<
  { ok: true; result: { name: string; status: GuestStatus } } | { ok: false; message: string; status: 400 | 404 | 500 }
> {
  const parsed = guestStatusUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos inválidos", status: 400 };

  const { data, error } = await client
    .from("guest_list_entries")
    .update({ status: parsed.data.status })
    .eq("tour_date_id", parsed.data.tourDateId)
    .eq("id", parsed.data.guestId)
    .select("guest_name, status")
    .maybeSingle();
  // 22P02: id con formato inválido (no es uuid).
  if (error?.code === "22P02") return { ok: false, message: "Id de invitado o fecha inválido", status: 400 };
  if (error) return { ok: false, message: "No se pudo actualizar el invitado", status: 500 };
  // 0 filas: no existe o la RLS no deja (solo admins cambian status). No se
  // distingue a propósito, para no revelar qué ids existen.
  if (!data) return { ok: false, message: "Invitado no encontrado", status: 404 };
  return { ok: true, result: { name: data.guest_name as string, status: data.status as GuestStatus } };
}

export async function moveSetlistSong(
  client: SupabaseClient,
  input: { tourDateId: string; fromIndex: number; toIndex: number }
): Promise<ActionResult<null>> {
  const parsed = reorderListSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos inválidos" };
  const { tourDateId, fromIndex, toIndex } = parsed.data;

  const { data: row, error } = await client.from("setlists").select("id, songs").eq("tour_date_id", tourDateId).maybeSingle();
  if (error || !row) return { ok: false, message: "Esta fecha no tiene setlist." };

  const songs = ((row.songs ?? []) as SetlistRow["songs"]).slice().sort((a, b) => a.order - b.order);
  if (fromIndex >= songs.length || toIndex >= songs.length) return { ok: false, message: "Posición fuera del setlist." };
  const [moved] = songs.splice(fromIndex, 1);
  songs.splice(toIndex, 0, moved);

  const { data: updated } = await client
    .from("setlists")
    .update({ songs: songs.map((s, i) => ({ ...s, order: i + 1 })), updated_at: new Date().toISOString() })
    .eq("id", row.id)
    .select("id");
  if (!updated?.length) return { ok: false, message: "Solo un admin de la gira puede cambiar el setlist." };
  return { ok: true, result: null };
}

/**
 * Nota sobre una fecha o sobre el venue de esa fecha. Se resuelve gira y
 * venue desde la fecha (con RLS), así quien llama solo necesita el dateId.
 */
export async function addDateNote(
  client: SupabaseClient,
  input: { tourDateId: string; target: "tour_date" | "venue"; body: string }
): Promise<ActionResult<null>> {
  const body = input.body.trim();
  if (!body) return { ok: false, message: "La nota no puede estar vacía" };

  const { data: date } = await client.from("tour_dates").select("tour_id, venue_id").eq("id", input.tourDateId).maybeSingle();
  if (!date) return { ok: false, message: "Fecha no encontrada." };
  if (input.target === "venue" && !date.venue_id) return { ok: false, message: "Esta fecha no tiene venue." };

  const { error } = await client.from("tour_notes").insert({
    tour_id: date.tour_id,
    entity_type: input.target,
    entity_id: input.target === "venue" ? date.venue_id : input.tourDateId,
    body,
    created_by: await currentProfileId(client),
  });
  if (error) return { ok: false, message: "No se pudo guardar la nota." };
  return { ok: true, result: null };
}
