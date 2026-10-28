import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { uuidSchema } from "@gigbridge/data";
import { createSupabaseServiceRoleClient } from "@gigbridge/data/server";
import { requireProfileResponse } from "@/lib/apiAuth";
import { parseJson } from "@/lib/apiValidation";

const createBlockSchema = z.object({
  venueId: uuidSchema,
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  block_type: z.enum(["available", "blocked"]),
  notes: z.string().optional(),
});

/** GET /api/venues/availability?venueId=xxx — público, mismo patrón que v1. */
export async function GET(req: NextRequest) {
  const venueId = req.nextUrl.searchParams.get("venueId");
  if (!venueId) return NextResponse.json({ error: "Falta venueId." }, { status: 400 });

  const service = createSupabaseServiceRoleClient();
  const { data, error } = await service
    .from("venue_availability_blocks")
    .select("*")
    .eq("venue_id", venueId)
    .order("day_of_week", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blocks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireProfileResponse();
  if (!auth.ok) return auth.response;

  const parsed = await parseJson(req, createBlockSchema);
  if (!parsed.ok) return parsed.response;
  const { venueId, ...fields } = parsed.data;

  const service = createSupabaseServiceRoleClient();

  const { data: venue } = await service
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("owner_id", auth.profile.id)
    .maybeSingle();
  if (!venue) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { data: block, error } = await service
    .from("venue_availability_blocks")
    .insert({ venue_id: venueId, ...fields })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ block });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireProfileResponse();
  if (!auth.ok) return auth.response;

  const blockId = req.nextUrl.searchParams.get("blockId");
  if (!blockId) return NextResponse.json({ error: "Falta blockId." }, { status: 400 });

  const service = createSupabaseServiceRoleClient();

  const { data: block } = await service
    .from("venue_availability_blocks")
    .select("venue_id")
    .eq("id", blockId)
    .maybeSingle();
  if (!block) return NextResponse.json({ error: "No encontrado." }, { status: 404 });

  const { data: venue } = await service
    .from("venues")
    .select("id")
    .eq("id", block.venue_id)
    .eq("owner_id", auth.profile.id)
    .maybeSingle();
  if (!venue) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { error } = await service.from("venue_availability_blocks").delete().eq("id", blockId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
