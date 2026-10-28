import { NextResponse, type NextRequest } from "next/server";
import { pathFromPublicUrl, removeFiles, venueIdSchema } from "@gigbridge/data";
import { createSupabaseServiceRoleClient } from "@gigbridge/data/server";
import { requireProfileResponse } from "@/lib/apiAuth";
import { parseJson } from "@/lib/apiValidation";

/** DELETE /api/venues/delete — solo el propietario puede eliminar su venue. */
export async function DELETE(req: NextRequest) {
  const auth = await requireProfileResponse();
  if (!auth.ok) return auth.response;

  const parsed = await parseJson(req, venueIdSchema);
  if (!parsed.ok) return parsed.response;
  const { venueId } = parsed.data;

  const service = createSupabaseServiceRoleClient();

  const { data: venue, error: venueError } = await service
    .from("venues")
    .select("id, owner_id, cover_photo_url, logo_url")
    .eq("id", venueId)
    .maybeSingle();

  if (venueError) return NextResponse.json({ error: venueError.message }, { status: 500 });
  if (!venue) return NextResponse.json({ error: "Venue no encontrado" }, { status: 404 });
  if (venue.owner_id !== auth.profile.id) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const coverPath = venue.cover_photo_url ? pathFromPublicUrl(venue.cover_photo_url, "covers") : null;
  const logoPath = venue.logo_url ? pathFromPublicUrl(venue.logo_url, "avatars") : null;
  if (coverPath) await removeFiles(service, "covers", [coverPath]);
  if (logoPath) await removeFiles(service, "avatars", [logoPath]);

  const { error } = await service.from("venues").delete().eq("id", venueId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
