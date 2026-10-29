import { NextResponse, type NextRequest } from "next/server";
import { getLocale } from "next-intl/server";
import { fillText, tourMessages, type Locale } from "@gigbridge/config";
import { createTourInvite } from "@gigbridge/data";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { tourDataSource } from "@/lib/tourRepository";

/**
 * POST /api/v1/tour-crew/:tourCrewId/invite   body: { send?: boolean }
 *
 * Devuelve el enlace de invitación vigente de una persona del roster (lo
 * crea si no hay) y, con `send: true`, se lo manda por correo.
 *
 * Route Handler y no Server Action por lo mismo que el status de
 * invitados: el correo sale con RESEND_API_KEY, que no puede llegar al
 * cliente, y la app nativa también invita por aquí. El permiso lo decide la
 * RLS de tour_invites (solo admins de la gira) con la sesión del usuario.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ tourCrewId: string }> }) {
  const { tourCrewId } = await params;
  const locale = (await getLocale()) as Locale;
  const tx = tourMessages(locale);
  if (tourDataSource() !== "supabase") return NextResponse.json({ error: tx.errors.demoNoSave }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { send?: unknown };
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: tx.errors.crewAdminOnly }, { status: 401 });

  const invite = await createTourInvite(supabase, { tourCrewId }, locale);
  if (!invite.ok) return NextResponse.json({ error: invite.message }, { status: 403 });
  const url = `${request.nextUrl.origin}/invite/${invite.result.token}`;

  let emailed = false;
  if (body.send === true) {
    const { data: row } = await supabase
      .from("tour_crew")
      .select("crew_member:crew_members(full_name, email), tour:tours(name)")
      .eq("id", tourCrewId)
      .maybeSingle();
    const one = <T,>(v: T | T[] | null | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
    const person = one(row?.crew_member as unknown as { full_name: string; email: string | null } | null);
    const tour = one(row?.tour as unknown as { name: string } | null);
    const { data: me } = await supabase.from("profiles").select("display_name").eq("user_id", auth.user.id).maybeSingle();
    if (!process.env.RESEND_API_KEY || !person?.email) {
      return NextResponse.json({ url, emailed, warning: tx.errors.inviteEmailFailed });
    }
    const vars = { by: me?.display_name ?? "GigBridge", tour: tour?.name ?? "", person: person.full_name, url };
    try {
      const { Resend } = await import("resend");
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.FROM_EMAIL ?? "GigBridge <noreply@gigbridge.mx>",
        to: person.email,
        subject: fillText(tx.invite.emailSubject, vars),
        text: fillText(tx.invite.emailBody, vars),
      });
      emailed = !error;
      if (error) console.error("Resend rechazó la invitación", error);
    } catch (err) {
      console.error("Resend falló al mandar la invitación", err);
    }
    if (!emailed) return NextResponse.json({ url, emailed, warning: tx.errors.inviteEmailFailed });
  }
  return NextResponse.json({ url, emailed });
}
