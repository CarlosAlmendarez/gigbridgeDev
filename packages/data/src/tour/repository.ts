import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExternalContact, Provider, RosterPerson, TourDate, Vacancy } from "@gigbridge/types";
import { DATES, EXTERNAL_CONTACTS, PROVIDERS, ROSTER, VACANCIES } from "./mockData";
import { createSupabaseTourRepository, findOpeningTourDateId } from "./supabaseRepository";

/**
 * Capa de lectura del módulo de gira, con dos fuentes intercambiables:
 *
 * - "mock": la gira de ejemplo "Norte 2026" de mockData.ts (el prototipo
 *   de Claude Design). Es el default mientras no haya giras reales cargadas.
 * - "supabase": las tablas de 0006/0007 vía supabaseRepository.ts, con el
 *   cliente que pase quien llama — en web el cliente de servidor con la
 *   sesión del usuario, así que la RLS decide qué ve cada quien. La app
 *   nativa pasa su propio cliente y obtiene exactamente lo mismo.
 *
 * Secciones de la UI que todavía NO tienen tabla y en "supabase" salen
 * vacías: proveedores (club), contactos externos y vacantes. Tablas que
 * existen pero aún no alimentan la UI: guest_list_entries, setlists,
 * reminders y tour_notes se siguen sembrando desde mockData en
 * apps/web/src/context/TourUIContext.tsx.
 */

export type TourDataSource = "mock" | "supabase";

/** Una gira se identifica por su id, o por el de cualquiera de sus fechas (las rutas web solo traen dateId). */
export type TourScope = { tourId: string } | { dateId: string };

export interface TourRepository {
  /** null si la fecha no existe o la RLS no deja verla. */
  getTourDate(dateId: string): Promise<TourDate | null>;
  listTourDates(): Promise<TourDate[]>;
  /** Roster de la gira; los cuartos de hotel son los de la fecha del scope (si es por dateId). */
  listRoster(): Promise<RosterPerson[]>;
  listVacancies(): Promise<Vacancy[]>;
  listProviders(): Promise<Provider[]>;
  listExternalContacts(): Promise<ExternalContact[]>;
}

export function createMockTourRepository(): TourRepository {
  return {
    getTourDate: async (dateId) => DATES.find((d) => d.id === dateId) ?? null,
    listTourDates: async () => DATES,
    listRoster: async () => ROSTER,
    listVacancies: async () => VACANCIES,
    listProviders: async () => PROVIDERS,
    listExternalContacts: async () => EXTERNAL_CONTACTS,
  };
}

export function createTourRepository(
  source: TourDataSource,
  options?: { client: SupabaseClient; scope: TourScope }
): TourRepository {
  if (source === "mock") return createMockTourRepository();
  if (!options) throw new Error('La fuente "supabase" necesita un cliente y un scope de gira');
  return createSupabaseTourRepository(options.client, options.scope);
}

export { createSupabaseTourRepository, findOpeningTourDateId };
