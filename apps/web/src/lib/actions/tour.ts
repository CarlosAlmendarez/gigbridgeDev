"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addDateNote,
  addGuestEntry,
  addTourCrewMember,
  addTourReminder,
  adoptCurrentDocumentVersion,
  createTour,
  dismissTourReminder,
  type TourMemberRoleInput,
  moveSetlistSong,
  moveTourVehicle,
  type ActionResult,
} from "@gigbridge/data";
import { getLocale } from "next-intl/server";
import { tourMessages, type Locale } from "@gigbridge/config";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { tourDataSource } from "@/lib/tourRepository";

/**
 * Wrappers 'use server' sobre las escrituras de @gigbridge/data/tour/
 * mutations.ts. Aquí solo queda lo Next-específico: el cliente con cookies
 * y revalidar el layout de la fecha para que la página vuelva a leer de
 * Supabase. Solo tienen sentido con TOUR_DATA_SOURCE=supabase; con la gira
 * mock TourUIContext edita en memoria y nunca las llama.
 *
 * No son Route Handlers porque no necesitan un secreto de servidor y la app
 * nativa llamará directo a las mismas funciones de @gigbridge/data con su
 * cliente (ver CLAUDE.md, apps/web › api/v1).
 */

type Client = Awaited<ReturnType<typeof getSupabaseServerClient>>;

async function run<T>(dateId: string, fn: (client: Client, locale: Locale) => Promise<ActionResult<T>>) {
  const locale = (await getLocale()) as Locale;
  if (tourDataSource() !== "supabase") return { ok: false as const, message: tourMessages(locale).errors.demoNoSave };
  const result = await fn(await getSupabaseServerClient(), locale);
  if (result.ok) revalidatePath(`/tour/${dateId}`, "layout");
  return result;
}

export async function addGuestAction(dateId: string, name: string) {
  return run(dateId, (client, locale) => addGuestEntry(client, { tourDateId: dateId, name }, locale));
}

export async function moveSetlistAction(dateId: string, fromIndex: number, toIndex: number) {
  return run(dateId, (client, locale) => moveSetlistSong(client, { tourDateId: dateId, fromIndex, toIndex }, locale));
}

export async function addDateNoteAction(dateId: string, target: "tour_date" | "venue", body: string) {
  return run(dateId, (client, locale) => addDateNote(client, { tourDateId: dateId, target, body }, locale));
}

export async function moveVehicleAction(dateId: string, fromIndex: number, toIndex: number) {
  return run(dateId, (client, locale) => moveTourVehicle(client, { tourDateId: dateId, fromIndex, toIndex }, locale));
}

export async function adoptDocumentAction(dateId: string, documentId: string) {
  return run(dateId, (client, locale) => adoptCurrentDocumentVersion(client, { tourDateId: dateId, documentId }, locale));
}

export async function addReminderAction(dateId: string, at: string, message: string) {
  return run(dateId, (client, locale) => addTourReminder(client, { tourDateId: dateId, at, message }, locale));
}

export async function dismissReminderAction(dateId: string, reminderId: string) {
  return run(dateId, (client, locale) => dismissTourReminder(client, { reminderId }, locale));
}

/** Formulario "Nueva gira" del inicio: crea la gira y abre su primera fecha. */
export async function createTourAction(_prev: { message: string } | null, formData: FormData) {
  const locale = (await getLocale()) as Locale;
  if (tourDataSource() !== "supabase") return { message: tourMessages(locale).errors.demoNoSave };
  const result = await createTour(
    await getSupabaseServerClient(),
    { name: String(formData.get("name") ?? ""), startDate: String(formData.get("startDate") ?? "") },
    locale
  );
  if (!result.ok) return { message: result.message };
  redirect(`/tour/${result.result.dateId}/dia`);
}

export async function addCrewMemberAction(
  dateId: string,
  input: { name: string; email: string; phone: string; roleId: string; memberRole: TourMemberRoleInput; party: string }
) {
  return run(dateId, (client, locale) => addTourCrewMember(client, { tourDateId: dateId, ...input }, locale));
}
