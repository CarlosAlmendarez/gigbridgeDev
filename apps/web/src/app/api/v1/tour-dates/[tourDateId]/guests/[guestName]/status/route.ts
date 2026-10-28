import { NextResponse, type NextRequest } from "next/server";
import { guestStatusUpdateSchema } from "@gigbridge/data";
import { getCurrentUser } from "@gigbridge/data/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { tourDataSource } from "@/lib/tourRepository";

/**
 * PATCH /api/v1/tour-dates/:tourDateId/guests/:guestName/status
 *
 * Por qué es un Route Handler y no un acceso directo a Supabase ni un
 * Server Action:
 * - Necesita mandar un correo transaccional con Resend al cambiar el
 *   status de un invitado — eso requiere RESEND_API_KEY, un secreto de
 *   servidor que jamás debe llegar al cliente (ni web ni nativo).
 * - Server Actions son exclusivas de Next.js: la futura app en React
 *   Native/Expo no puede invocarlas. Un endpoint REST bajo /api/v1/ sí.
 *
 * Persistencia: con TOUR_DATA_SOURCE=supabase actualiza
 * `guest_list_entries` (0006) con la sesión del usuario, así que la RLS
 * decide — solo un admin de la gira puede cambiar el status
 * ("guest_list_admin_update"); para cualquier otro la actualización afecta
 * 0 filas y se responde 404, igual que si el invitado no existiera, para no
 * revelar qué ids existen. En ese modo `guestName` es el id (uuid) de la
 * entrada. Con la gira mock no hay dónde escribir: se devuelve el estado
 * calculado con `persisted: false`, mismo contrato de respuesta.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tourDateId: string; guestName: string }> }
) {
  const { tourDateId, guestName } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido: se esperaba JSON" }, { status: 400 });
  }

  const parsed = guestStatusUpdateSchema.safeParse({
    tourDateId,
    guestId: guestName,
    status: (body as { status?: unknown })?.status,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let user;
  let supabase;
  try {
    supabase = await getSupabaseServerClient();
    user = await getCurrentUser(supabase);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Supabase no está configurado (faltan variables de entorno en .env.local)" },
      { status: 503 }
    );
  }
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let updatedGuest = { name: decodeURIComponent(parsed.data.guestId), status: parsed.data.status };
  const persisted = tourDataSource() === "supabase";

  if (persisted) {
    const { data, error } = await supabase
      .from("guest_list_entries")
      .update({ status: parsed.data.status })
      .eq("tour_date_id", parsed.data.tourDateId)
      .eq("id", parsed.data.guestId)
      .select("guest_name, status")
      .maybeSingle();
    // 22P02: id con formato inválido (no es uuid).
    if (error?.code === "22P02") return NextResponse.json({ error: "Id de invitado o fecha inválido" }, { status: 400 });
    if (error) {
      console.error("No se pudo actualizar guest_list_entries", error);
      return NextResponse.json({ error: "No se pudo actualizar el invitado" }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
    updatedGuest = { name: data.guest_name, status: data.status };
  }

  if (process.env.RESEND_API_KEY && user.email) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.FROM_EMAIL ?? "GigBridge <noreply@gigbridge.mx>",
        to: user.email,
        subject: `Invitado actualizado: ${updatedGuest.name}`,
        text: `${updatedGuest.name} ahora está "${updatedGuest.status}" en la fecha ${parsed.data.tourDateId}.`,
      });
    } catch (err) {
      // No tumbar la respuesta por un fallo de correo — se registra y sigue.
      console.error("Resend falló al notificar el cambio de status del invitado", err);
    }
  }

  return NextResponse.json({ guest: updatedGuest, persisted });
}
