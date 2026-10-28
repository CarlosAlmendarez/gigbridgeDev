import { NextResponse, type NextRequest } from "next/server";
import {
  extensionForMimeType,
  getPublicUrl,
  uploadFile,
  venueGalleryPhotoPath,
  venueImagePath,
  type VenueImageKey,
} from "@gigbridge/data";
import { createSupabaseServiceRoleClient } from "@gigbridge/data/server";
import { requireProfileResponse } from "@/lib/apiAuth";

const ALLOWED_BUCKETS = ["covers", "avatars"] as const;
const ALLOWED_PATH_KEYS = ["cover", "logo", "gallery"] as const;

/** POST /api/venues/upload-image — usa el módulo de storage compartido en vez de paths hardcodeados por route (como en v1). */
export async function POST(req: NextRequest) {
  const auth = await requireProfileResponse();
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const venueId = formData.get("venueId") as string | null;
  const pathKey = formData.get("pathKey") as string | null;
  const bucket = formData.get("bucket") as string | null;

  if (!file || !venueId || !pathKey || !bucket) {
    return NextResponse.json({ error: "Faltan parámetros." }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.includes(bucket as (typeof ALLOWED_BUCKETS)[number])) {
    return NextResponse.json({ error: "Bucket no permitido." }, { status: 400 });
  }
  if (!ALLOWED_PATH_KEYS.includes(pathKey as (typeof ALLOWED_PATH_KEYS)[number])) {
    return NextResponse.json({ error: "Clave de archivo no permitida." }, { status: 400 });
  }

  const service = createSupabaseServiceRoleClient();

  const { data: venue } = await service
    .from("venues")
    .select("id, photos")
    .eq("id", venueId)
    .eq("owner_id", auth.profile.id)
    .maybeSingle();

  if (!venue) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const ext = extensionForMimeType(file.type, "jpg");
  const isGallery = pathKey === "gallery";
  const targetBucket = isGallery ? "covers" : (bucket as "covers" | "avatars");
  const path = isGallery
    ? venueGalleryPhotoPath(venueId, ext)
    : venueImagePath(venueId, pathKey as VenueImageKey, ext);

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await uploadFile(service, {
    bucket: targetBucket,
    path,
    body: arrayBuffer,
    contentType: file.type,
    upsert: !isGallery,
  });
  if (uploadError) {
    return NextResponse.json({ error: uploadError }, { status: 500 });
  }

  const publicUrl = getPublicUrl(service, targetBucket, path);

  if (isGallery) {
    const current = (venue.photos as string[] | null) ?? [];
    const { error: dbError } = await service
      .from("venues")
      .update({ photos: [...current, publicUrl] })
      .eq("id", venueId);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  } else {
    const column = pathKey === "cover" ? "cover_photo_url" : "logo_url";
    const { error: dbError } = await service.from("venues").update({ [column]: publicUrl }).eq("id", venueId);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl });
}
