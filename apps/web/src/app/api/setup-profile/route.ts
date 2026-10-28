import { NextResponse, type NextRequest } from "next/server";
import { clientIp, createProfileAndBand, rateLimit, setupProfileSchema } from "@gigbridge/data";
import { createSupabaseServiceRoleClient } from "@gigbridge/data/server";
import { requireUserResponse } from "@/lib/apiAuth";
import { parseJson } from "@/lib/apiValidation";

/**
 * Port de GigBridge/gigbridge/api/setup-profile/route.ts. Es un Route
 * Handler (no una Server Action) porque necesita `rateLimit`/`clientIp`,
 * que requieren el `Request` — una Server Action no lo expone.
 */
export async function POST(request: NextRequest) {
  const rl = rateLimit(`setup-profile:${clientIp(request)}`, 10, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const auth = await requireUserResponse();
  if (!auth.ok) return auth.response;

  const parsed = await parseJson(request, setupProfileSchema);
  if (!parsed.ok) return parsed.response;

  const serviceClient = createSupabaseServiceRoleClient();
  const created = await createProfileAndBand(serviceClient, {
    userId: auth.user.id,
    slug: parsed.data.slug,
    displayName: parsed.data.display_name,
    role: parsed.data.role,
  });

  if (!created.ok) {
    return NextResponse.json({ error: created.message }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
