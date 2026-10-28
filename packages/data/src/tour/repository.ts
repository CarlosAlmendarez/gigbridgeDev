import type { ExternalContact, Provider, RosterPerson, TourDate, Vacancy } from "@gigbridge/types";
import { DATES, EXTERNAL_CONTACTS, PROVIDERS, ROSTER, VACANCIES } from "./mockData";

/**
 * Capa de lectura del módulo de gira. Hoy resuelve contra el set de datos
 * mock (abajo, con `await` + `Promise.resolve` a propósito, para que las
 * llamadas ya se comporten como I/O asíncrono) porque las tablas reales
 * (`tours`, `tour_dates`, `crew_members`, `tour_crew`, `providers`, ...)
 * todavía no existen en Supabase. Cuando se apliquen las migraciones, cada
 * función de aquí se reescribe para hacer `supabase.from(...).select(...)`
 * — la firma (parámetros, forma de retorno) no debería cambiar, así que
 * apps/web y la futura app nativa no necesitan tocar nada.
 */

export async function listTourDates(): Promise<TourDate[]> {
  return DATES;
}

export async function getTourDate(dateId: string): Promise<TourDate> {
  return DATES.find((d) => d.id === dateId) ?? DATES[1];
}

export async function listRoster(): Promise<RosterPerson[]> {
  return ROSTER;
}

export async function listVacancies(): Promise<Vacancy[]> {
  return VACANCIES;
}

export async function listProviders(): Promise<Provider[]> {
  return PROVIDERS;
}

export async function listExternalContacts(): Promise<ExternalContact[]> {
  return EXTERNAL_CONTACTS;
}
