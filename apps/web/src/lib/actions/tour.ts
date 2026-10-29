"use server";

import { revalidatePath } from "next/cache";
import {
  addDateNote,
  addGuestEntry,
  adoptCurrentDocumentVersion,
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
