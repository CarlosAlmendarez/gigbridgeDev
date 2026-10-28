import { NextResponse, type NextRequest } from "next/server";
import { createVenueSchema } from "@gigbridge/data";
import { createSupabaseServiceRoleClient } from "@gigbridge/data/server";
import { requireProfileResponse } from "@/lib/apiAuth";
import { parseJson } from "@/lib/apiValidation";

/** POST /api/venues/create — port de v1, validado contra createVenueSchema. */
export async function POST(req: NextRequest) {
  const auth = await requireProfileResponse();
  if (!auth.ok) return auth.response;

  const parsed = await parseJson(req, createVenueSchema);
  if (!parsed.ok) return parsed.response;

  const service = createSupabaseServiceRoleClient();

  const { data: existing } = await service
    .from("venues")
    .select("id")
    .eq("owner_id", auth.profile.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Ya tienes un venue registrado.", venueId: existing.id },
      { status: 409 }
    );
  }

  const { data: venue, error } = await service
    .from("venues")
    .insert({ owner_id: auth.profile.id, ...parsed.data })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ese slug ya está en uso, elige otro." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: venue.id });
}
