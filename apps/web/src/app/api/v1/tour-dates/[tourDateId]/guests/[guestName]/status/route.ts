import { NextResponse, type NextRequest } from "next/server";
import { guestStatusUpdateSchema } from "@gigbridge/data";
import { getCurrentUser } from "@gigbridge/data/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

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
 * PENDIENTE DE SCHEMA: `guest_lists` todavía no existe en Supabase (ver
 * nota en @gigbridge/types/db.ts). Este handler ya valida y autentica de
 * verdad; la escritura está marcada abajo con el query real que se debe
 * activar en cuanto exista la tabla. Por ahora devuelve el estado
 * calculado sin persistirlo, para dejar fijo el contrato (request/response)
 * que también usará la app nativa.
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
  try {
    const supabase = await getSupabaseServerClient();
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

  // TODO(schema): reemplazar por la escritura real en cuanto exista `guest_lists`:
  //   const { data, error } = await supabase
  //     .from("guest_lists")
  //     .update({ status: parsed.data.status })
  //     .eq("tour_date_id", parsed.data.tourDateId)
  //     .eq("id", parsed.data.guestId)
  //     .select()
  //     .single();
  const updatedGuest = { name: decodeURIComponent(parsed.data.guestId), status: parsed.data.status };

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

  return NextResponse.json({ guest: updatedGuest, persisted: false });
}
