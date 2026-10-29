import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@gigbridge/config";
import type {
  ExternalContact,
  Guest,
  Provider,
  RosterPerson,
  SetlistSong,
  TourDate,
  TourSummary,
  Vacancy,
  VehicleLoad,
} from "@gigbridge/types";
import {
  BAND_LINE,
  DATES,
  DEFAULT_NOTAS,
  DEFAULT_SETLIST,
  DEFAULT_VEHICLES,
  EXTERNAL_CONTACTS,
  GUESTS_SEED,
  PROVIDERS,
  ROSTER,
  TOUR_NAME,
  VACANCIES,
  type NotaEntry,
} from "./mockData";
import { createSupabaseTourRepository, findOpeningTourDateId, listMyTours, type MyTour } from "./supabaseRepository";

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
 * existen pero aún no alimentan la UI: reminders (en modo supabase la
 * sección se oculta). Las escrituras viven en mutations.ts.
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
  /** Invitados de todas las fechas de la gira, por id de fecha. */
  listGuests(): Promise<Record<string, Guest[]>>;
  getSetlist(dateId: string): Promise<SetlistSong[]>;
  /** Notas de toda la gira (fechas y venues), la más reciente primero. */
  listTourNotes(): Promise<NotaEntry[]>;
  /** null si la gira no existe o la RLS no deja verla. */
  getTourSummary(): Promise<TourSummary | null>;
  /** Vehículos de la gira en orden de carga. */
  listVehicles(): Promise<VehicleLoad[]>;
}

export function createMockTourRepository(): TourRepository {
  return {
    getTourDate: async (dateId) => DATES.find((d) => d.id === dateId) ?? null,
    listTourDates: async () => DATES,
    listRoster: async () => ROSTER,
    listVacancies: async () => VACANCIES,
    listProviders: async () => PROVIDERS,
    listExternalContacts: async () => EXTERNAL_CONTACTS,
    listGuests: async () => GUESTS_SEED,
    // El prototipo tiene un solo setlist para todas las fechas.
    getSetlist: async () => DEFAULT_SETLIST,
    listTourNotes: async () => DEFAULT_NOTAS,
    getTourSummary: async () => ({ name: TOUR_NAME, bandLine: BAND_LINE }),
    listVehicles: async () => DEFAULT_VEHICLES,
  };
}

export function createTourRepository(
  source: TourDataSource,
  options?: { client: SupabaseClient; scope: TourScope; locale?: Locale }
): TourRepository {
  // La gira mock es contenido de demo escrito en español: no se traduce.
  if (source === "mock") return createMockTourRepository();
  if (!options) throw new Error('La fuente "supabase" necesita un cliente y un scope de gira');
  return createSupabaseTourRepository(options.client, options.scope, options.locale);
}

export { createSupabaseTourRepository, findOpeningTourDateId, listMyTours, type MyTour };
