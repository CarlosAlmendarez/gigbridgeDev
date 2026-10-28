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

async function run<T>(dateId: string, fn: (client: Awaited<ReturnType<typeof getSupabaseServerClient>>) => Promise<ActionResult<T>>) {
  if (tourDataSource() !== "supabase") return { ok: false as const, message: "La gira de ejemplo no guarda cambios." };
  const result = await fn(await getSupabaseServerClient());
  if (result.ok) revalidatePath(`/tour/${dateId}`, "layout");
  return result;
}

export async function addGuestAction(dateId: string, name: string) {
  return run(dateId, (client) => addGuestEntry(client, { tourDateId: dateId, name }));
}

export async function moveSetlistAction(dateId: string, fromIndex: number, toIndex: number) {
  return run(dateId, (client) => moveSetlistSong(client, { tourDateId: dateId, fromIndex, toIndex }));
}

export async function addDateNoteAction(dateId: string, target: "tour_date" | "venue", body: string) {
  return run(dateId, (client) => addDateNote(client, { tourDateId: dateId, target, body }));
}

export async function moveVehicleAction(dateId: string, fromIndex: number, toIndex: number) {
  return run(dateId, (client) => moveTourVehicle(client, { tourDateId: dateId, fromIndex, toIndex }));
}

export async function adoptDocumentAction(dateId: string, documentId: string) {
  return run(dateId, (client) => adoptCurrentDocumentVersion(client, { tourDateId: dateId, documentId }));
}
