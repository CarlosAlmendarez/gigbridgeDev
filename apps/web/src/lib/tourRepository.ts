import "server-only";
import { cache } from "react";
import { createTourRepository, type TourDataSource, type TourRepository, type TourScope } from "@gigbridge/data";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Fuente de datos del módulo de gira para esta instancia de la app:
 * `TOUR_DATA_SOURCE=supabase` lee las tablas reales con la sesión del
 * usuario (RLS); cualquier otro valor, o sin definir, usa la gira mock
 * "Norte 2026". Se lee en servidor — también en proxy.ts, que exige sesión
 * en /tour cuando la fuente es supabase.
 */
export function tourDataSource(): TourDataSource {
  return process.env.TOUR_DATA_SOURCE === "supabase" ? "supabase" : "mock";
}

// `cache` deduplica por request: layout y página piden el mismo scope y
// comparten repositorio (y la resolución dateId → tourId).
const repositoryFor = cache(async (kind: "tour" | "date", id: string): Promise<TourRepository> => {
  const source = tourDataSource();
  if (source === "mock") return createTourRepository("mock");
  const scope: TourScope = kind === "tour" ? { tourId: id } : { dateId: id };
  return createTourRepository("supabase", { client: await getSupabaseServerClient(), scope });
});

export function getTourRepository(scope: TourScope): Promise<TourRepository> {
  return "tourId" in scope ? repositoryFor("tour", scope.tourId) : repositoryFor("date", scope.dateId);
}
