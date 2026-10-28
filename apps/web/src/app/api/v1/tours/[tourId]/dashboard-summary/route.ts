import { NextResponse } from "next/server";
import { GUESTS_SEED, listTourDates } from "@gigbridge/data";

/**
 * GET /api/v1/tours/:tourId/dashboard-summary
 *
 * Por qué es un Route Handler y no acceso directo a Supabase: agrega datos
 * de varias fechas (completion promedio, invitados pendientes de toda la
 * gira, próxima fecha) — es más barato calcularlo una vez en servidor que
 * mandarle a cada cliente (web o nativo) todas las fechas y que cada quien
 * recalcule lo mismo. Hoy corre sobre el repositorio mock; cuando existan
 * las tablas reales, la única línea que cambia es la query de agregación
 * (`select avg(...), count(...) ...`), no el shape de la respuesta.
 *
 * `tourId` se recibe pero todavía no se usa para filtrar: el set de datos
 * mock modela una sola gira ("Norte 2026"). Se deja en la ruta porque el
 * endpoint real sí necesita filtrar por gira.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  const dates = await listTourDates();

  const showDates = dates.filter((d) => d.kind === "Show");
  const avgCompletion = Math.round(dates.reduce((sum, d) => sum + d.completion, 0) / dates.length);
  const totalPendingGuests = Object.values(GUESTS_SEED)
    .flat()
    .filter((g) => g.status === "pending").length;
  const totalConfirmedGuests = Object.values(GUESTS_SEED)
    .flat()
    .filter((g) => g.status === "confirmed").length;
  const nextShow = showDates.find((d) => d.completion < 100) ?? showDates[0] ?? null;

  return NextResponse.json({
    tourId,
    totalDates: dates.length,
    totalShows: showDates.length,
    averageCompletion: avgCompletion,
    guests: { pending: totalPendingGuests, confirmed: totalConfirmedGuests },
    nextShow: nextShow && {
      id: nextShow.id,
      title: nextShow.title,
      dateline: nextShow.dateline,
      completion: nextShow.completion,
      missing: nextShow.missing,
    },
  });
}
