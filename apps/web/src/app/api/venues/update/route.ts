import { NextResponse, type NextRequest } from "next/server";
import { updateVenueSchema } from "@gigbridge/data";
import { createSupabaseServiceRoleClient } from "@gigbridge/data/server";
import { requireProfileResponse } from "@/lib/apiAuth";
import { parseJson } from "@/lib/apiValidation";

/**
 * PATCH /api/venues/update — cada paso del wizard manda un subconjunto
 * distinto de columnas; ver la nota en updateVenueSchema.
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireProfileResponse();
  if (!auth.ok) return auth.response;

  const parsed = await parseJson(req, updateVenueSchema);
  if (!parsed.ok) return parsed.response;
  const { venueId, ...fields } = parsed.data;

  const service = createSupabaseServiceRoleClient();

  const { data: venue } = await service
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("owner_id", auth.profile.id)
    .maybeSingle();

  if (!venue) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { error } = await service.from("venues").update(fields).eq("id", venueId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
