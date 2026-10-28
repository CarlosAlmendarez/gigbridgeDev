import { NextResponse } from "next/server";
import { GUESTS_SEED } from "@gigbridge/data";
import type { GuestStatus } from "@gigbridge/types";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getTourRepository, tourDataSource } from "@/lib/tourRepository";

/**
 * GET /api/v1/tours/:tourId/dashboard-summary
 *
 * Por qué es un Route Handler y no acceso directo a Supabase: agrega datos
 * de varias fechas (completion promedio, invitados pendientes de toda la
 * gira, próxima fecha) — es más barato calcularlo una vez en servidor que
 * mandarle a cada cliente (web o nativo) todas las fechas y que cada quien
 * recalcule lo mismo.
 *
 * Con TOUR_DATA_SOURCE=supabase lee con la sesión del usuario: si no es
 * miembro de la gira, la RLS deja todo vacío y responde 404. Con la gira
 * mock `tourId` se ignora (solo existe "Norte 2026").
 */
export async function GET(_request: Request, { params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  const repo = await getTourRepository({ tourId });
  const dates = await repo.listTourDates();

  let guestStatuses: GuestStatus[];
  if (tourDataSource() === "supabase") {
    if (dates.length === 0) return NextResponse.json({ error: "Gira no encontrada" }, { status: 404 });
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("guest_list_entries")
      .select("status")
      .in(
        "tour_date_id",
        dates.map((d) => d.id)
      );
    if (error) {
      console.error("No se pudo leer guest_list_entries", error);
      return NextResponse.json({ error: "No se pudo calcular el resumen" }, { status: 500 });
    }
    guestStatuses = (data ?? []).map((g) => g.status as GuestStatus);
  } else {
    guestStatuses = Object.values(GUESTS_SEED)
      .flat()
      .map((g) => g.status);
  }

  const showDates = dates.filter((d) => d.kind === "Show");
  const avgCompletion = dates.length ? Math.round(dates.reduce((sum, d) => sum + d.completion, 0) / dates.length) : 0;
  const nextShow = showDates.find((d) => d.completion < 100) ?? showDates[0] ?? null;

  return NextResponse.json({
    tourId,
    totalDates: dates.length,
    totalShows: showDates.length,
    averageCompletion: avgCompletion,
    guests: {
      pending: guestStatuses.filter((s) => s === "pending").length,
      confirmed: guestStatuses.filter((s) => s === "confirmed").length,
    },
    nextShow: nextShow && {
      id: nextShow.id,
      title: nextShow.title,
      dateline: nextShow.dateline,
      completion: nextShow.completion,
      missing: nextShow.missing,
    },
  });
}
