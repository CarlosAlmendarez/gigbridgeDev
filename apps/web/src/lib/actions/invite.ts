"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Locale } from "@gigbridge/config";
import { acceptTourInvite } from "@gigbridge/data";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { INVITE_COOKIE } from "@/lib/inviteCookie";
import { safeNext } from "@/lib/safeNext";

/**
 * Invitaciones a una gira (/invite/<token>, migración 0017).
 *
 * El registro pasa por confirmación de correo y setup, y en ese camino el
 * `?next=` se pierde; por eso, antes de mandar a login/registro, el token se
 * guarda en una cookie y el inicio (/dashboard) muestra la invitación
 * pendiente al volver.
 */

const TOKEN_RE = /^[0-9a-f]{64}$/;

export async function rememberInviteAction(token: string, destination: string) {
  if (TOKEN_RE.test(token)) {
    (await cookies()).set(INVITE_COOKIE, token, { path: "/", maxAge: 60 * 60 * 24 * 14, sameSite: "lax", httpOnly: true });
  }
  redirect(safeNext(destination, "/dashboard"));
}

export async function acceptInviteAction(token: string): Promise<{ message: string } | null> {
  const result = await acceptTourInvite(await getSupabaseServerClient(), { token }, (await getLocale()) as Locale);
  if (!result.ok) return { message: result.message };
  (await cookies()).delete(INVITE_COOKIE);
  redirect(result.result.dateId ? `/tour/${result.result.dateId}/dia` : "/dashboard");
}
