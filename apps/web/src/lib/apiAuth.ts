import { NextResponse } from "next/server";
import type { AuthProfile, GuardFail } from "@gigbridge/data";
import { requireAdmin, requireProfile, requireSuperAdmin, requireUser } from "@gigbridge/data";
import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Envuelve los guards puros de @gigbridge/data (requireUser/requireProfile/
 * requireAdmin/requireSuperAdmin) en NextResponse — lo único que
 * necesitaba ser Next-específico en GigBridge/gigbridge/src/lib/apiAuth.ts.
 *
 * Uso en un Route Handler:
 *   const auth = await requireProfileResponse();
 *   if (!auth.ok) return auth.response;
 *   const { user, profile } = auth;
 */

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

type ResponseFail = { ok: false; response: NextResponse };

function toResponseFail(fail: GuardFail): ResponseFail {
  return { ok: false, response: jsonError(fail.message, fail.status) };
}

export async function requireUserResponse(): Promise<{ ok: true; user: User } | ResponseFail> {
  const supabase = await getSupabaseServerClient();
  const result = await requireUser(supabase);
  return result.ok ? result : toResponseFail(result);
}

export async function requireProfileResponse(): Promise<
  { ok: true; user: User; profile: AuthProfile } | ResponseFail
> {
  const supabase = await getSupabaseServerClient();
  const result = await requireProfile(supabase);
  return result.ok ? result : toResponseFail(result);
}

export async function requireAdminResponse(): Promise<
  { ok: true; user: User; profile: AuthProfile } | ResponseFail
> {
  const supabase = await getSupabaseServerClient();
  const result = await requireAdmin(supabase);
  return result.ok ? result : toResponseFail(result);
}

export async function requireSuperAdminResponse(): Promise<
  { ok: true; user: User; profile: AuthProfile } | ResponseFail
> {
  const supabase = await getSupabaseServerClient();
  const result = await requireSuperAdmin(supabase);
  return result.ok ? result : toResponseFail(result);
}
