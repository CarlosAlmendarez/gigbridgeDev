import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_LOCALE, tourMessages, type Locale } from "@gigbridge/config";
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
 * `locale` solo elige el idioma de los mensajes de rechazo (i18n/tour.ts).
 */

async function currentProfileId(client: SupabaseClient): Promise<string | null> {
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await client.from("profiles").select("id").eq("user_id", data.user.id).maybeSingle();
  return (profile?.id as string | undefined) ?? null;
}

export async function addGuestEntry(
  client: SupabaseClient,
  input: { tourDateId: string; name: string },
  locale: Locale = DEFAULT_LOCALE
): Promise<ActionResult<{ id: string }>> {
  const e = tourMessages(locale).errors;
  const parsed = addGuestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.path[0] === "name" ? e.guestNameEmpty : e.invalidData };
  }

  const { data, error } = await client
    .from("guest_list_entries")
    .insert({ tour_date_id: parsed.data.tourDateId, guest_name: parsed.data.name, added_by: await currentProfileId(client) })
    .select("id")
    .single();
  // 42501: la RLS rechazó el insert (no es miembro de la gira).
  if (error?.code === "42501") return { ok: false, message: e.guestTeamOnly };
  if (error) return { ok: false, message: e.guestAddFailed };
  return { ok: true, result: { id: data.id as string } };
}

export async function setGuestEntryStatus(
  client: SupabaseClient,
  input: { tourDateId: string; guestId: string; status: GuestStatus },
  locale: Locale = DEFAULT_LOCALE
): Promise<
  { ok: true; result: { name: string; status: GuestStatus } } | { ok: false; message: string; status: 400 | 404 | 500 }
> {
  const e = tourMessages(locale).errors;
  const parsed = guestStatusUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: e.invalidData, status: 400 };

  const { data, error } = await client
    .from("guest_list_entries")
    .update({ status: parsed.data.status })
    .eq("tour_date_id", parsed.data.tourDateId)
    .eq("id", parsed.data.guestId)
    .select("guest_name, status")
    .maybeSingle();
  // 22P02: id con formato inválido (no es uuid).
  if (error?.code === "22P02") return { ok: false, message: e.guestInvalidId, status: 400 };
  if (error) return { ok: false, message: e.guestUpdateFailed, status: 500 };
  // 0 filas: no existe o la RLS no deja (solo admins cambian status). No se
  // distingue a propósito, para no revelar qué ids existen.
  if (!data) return { ok: false, message: e.guestNotFound, status: 404 };
  return { ok: true, result: { name: data.guest_name as string, status: data.status as GuestStatus } };
}

export async function moveSetlistSong(
  client: SupabaseClient,
  input: { tourDateId: string; fromIndex: number; toIndex: number },
  locale: Locale = DEFAULT_LOCALE
): Promise<ActionResult<null>> {
  const e = tourMessages(locale).errors;
  const parsed = reorderListSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: e.invalidData };
  const { tourDateId, fromIndex, toIndex } = parsed.data;

  const { data: row, error } = await client.from("setlists").select("id, songs").eq("tour_date_id", tourDateId).maybeSingle();
  if (error || !row) return { ok: false, message: e.noSetlist };

  const songs = ((row.songs ?? []) as SetlistRow["songs"]).slice().sort((a, b) => a.order - b.order);
  if (fromIndex >= songs.length || toIndex >= songs.length) return { ok: false, message: e.setlistOutOfRange };
  const [moved] = songs.splice(fromIndex, 1);
  songs.splice(toIndex, 0, moved);

  const { data: updated } = await client
    .from("setlists")
    .update({ songs: songs.map((s, i) => ({ ...s, order: i + 1 })), updated_at: new Date().toISOString() })
    .eq("id", row.id)
    .select("id");
  if (!updated?.length) return { ok: false, message: e.setlistAdminOnly };
  return { ok: true, result: null };
}

/**
 * Nota sobre una fecha o sobre el venue de esa fecha. Se resuelve gira y
 * venue desde la fecha (con RLS), así quien llama solo necesita el dateId.
 */
export async function addDateNote(
  client: SupabaseClient,
  input: { tourDateId: string; target: "tour_date" | "venue"; body: string },
  locale: Locale = DEFAULT_LOCALE
): Promise<ActionResult<null>> {
  const e = tourMessages(locale).errors;
  const body = input.body.trim();
  if (!body) return { ok: false, message: e.noteEmpty };

  const { data: date } = await client.from("tour_dates").select("tour_id, venue_id").eq("id", input.tourDateId).maybeSingle();
  if (!date) return { ok: false, message: e.dateNotFound };
  if (input.target === "venue" && !date.venue_id) return { ok: false, message: e.noVenue };

  const { error } = await client.from("tour_notes").insert({
    tour_id: date.tour_id,
    entity_type: input.target,
    entity_id: input.target === "venue" ? date.venue_id : input.tourDateId,
    body,
    created_by: await currentProfileId(client),
  });
  if (error) return { ok: false, message: e.noteFailed };
  return { ok: true, result: null };
}

/** Reordena el "Orden de carga" (tour_vehicles.load_order). Solo admins (RLS). */
export async function moveTourVehicle(
  client: SupabaseClient,
  input: { tourDateId: string; fromIndex: number; toIndex: number },
  locale: Locale = DEFAULT_LOCALE
): Promise<ActionResult<null>> {
  const e = tourMessages(locale).errors;
  const parsed = reorderListSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: e.invalidData };
  const { tourDateId, fromIndex, toIndex } = parsed.data;

  const { data: date } = await client.from("tour_dates").select("tour_id").eq("id", tourDateId).maybeSingle();
  if (!date) return { ok: false, message: e.dateNotFound };
  const { data: rows } = await client
    .from("tour_vehicles")
    .select("id")
    .eq("tour_id", date.tour_id)
    .order("load_order", { nullsFirst: false });
  const ids = (rows ?? []).map((r) => r.id as string);
  if (fromIndex >= ids.length || toIndex >= ids.length) return { ok: false, message: e.listOutOfRange };
  const [moved] = ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, moved);

  // Solo cambian las filas entre ambas posiciones; si la RLS rechaza la
  // primera, rechaza todas (misma gira, misma policy).
  const lo = Math.min(fromIndex, toIndex);
  const hi = Math.max(fromIndex, toIndex);
  for (let i = lo; i <= hi; i++) {
    const { data } = await client.from("tour_vehicles").update({ load_order: i + 1 }).eq("id", ids[i]).select("id");
    if (!data?.length) return { ok: false, message: e.vehiclesAdminOnly };
  }
  return { ok: true, result: null };
}

/**
 * Referencia en vivo (doc de estrategia §3): la fecha pasa a usar la
 * versión vigente del documento. Solo admins (tour_date_document_refs).
 */
export async function adoptCurrentDocumentVersion(
  client: SupabaseClient,
  input: { tourDateId: string; documentId: string },
  locale: Locale = DEFAULT_LOCALE
): Promise<ActionResult<null>> {
  const e = tourMessages(locale).errors;
  const { data: doc } = await client.from("documents").select("current_version_id").eq("id", input.documentId).maybeSingle();
  if (!doc?.current_version_id) return { ok: false, message: e.docNoCurrent };

  const { data } = await client
    .from("tour_date_document_refs")
    .update({ seen_version_id: doc.current_version_id })
    .eq("tour_date_id", input.tourDateId)
    .eq("document_id", input.documentId)
    .select("id");
  if (!data?.length) return { ok: false, message: e.docAdminOnly };
  return { ok: true, result: null };
}
