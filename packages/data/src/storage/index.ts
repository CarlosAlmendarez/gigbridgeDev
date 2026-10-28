import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentOwnerType } from "@gigbridge/types";

/**
 * Módulo único de Storage. v1 no tenía esto: cada Route Handler repetía
 * `service.storage.from('covers')` con paths armados a mano (ver
 * GigBridge/gigbridge/api/venues/{upload-image,upload-document}) — la
 * auditoría lo marcó como hueco (#8, sin helper compartido). Los buckets
 * y sus políticas están en supabase/migrations/0010_storage.sql; aquí
 * solo vive la convención de paths y los límites por tipo de archivo,
 * para que no se vuelvan a hardcodear en cada call site.
 */

export type StorageBucket = "avatars" | "covers" | "documents";

export const AVATAR_MAX_SIZE_MB = 5;
export const COVER_MAX_SIZE_MB = 5;
export const DOCUMENT_MAX_SIZE_MB = 10;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf"] as const;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export function extensionForMimeType(mimeType: string, fallback = "bin"): string {
  return MIME_TO_EXT[mimeType] ?? fallback;
}

// ── Paths ────────────────────────────────────────────────────────────
// Mantener estas funciones como único lugar que arma paths: las policies
// de storage.objects en 0010_storage.sql asumen exactamente esta forma
// (primer segmento = profile/venue propio).

export function avatarPath(profileId: string, ext: string): string {
  return `${profileId}/avatar.${ext}`;
}

export function avatarOriginalPath(profileId: string, ext: string): string {
  return `${profileId}/avatar_original.${ext}`;
}

export function profileCoverPath(profileId: string, ext: string): string {
  return `${profileId}/cover.${ext}`;
}

export function epkPhotoPath(profileId: string, ext: string): string {
  return `${profileId}/epk-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

export type VenueImageKey = "cover" | "logo";

export function venueImagePath(venueId: string, key: VenueImageKey, ext: string): string {
  return `venues/${venueId}/${key}.${ext}`;
}

export function venueGalleryPhotoPath(venueId: string, ext: string): string {
  return `venues/${venueId}/gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

/** owner_type/owner_id namespacing generaliza lo que v1 hacía solo para venues. */
export function documentVersionPath(
  ownerType: DocumentOwnerType,
  ownerId: string,
  documentId: string,
  versionNumber: number,
  ext: string
): string {
  return `${ownerType}/${ownerId}/${documentId}/v${versionNumber}.${ext}`;
}

// ── Operaciones ──────────────────────────────────────────────────────

export interface UploadFileInput {
  bucket: StorageBucket;
  path: string;
  body: File | Blob | ArrayBuffer;
  contentType: string;
  upsert?: boolean;
}

export async function uploadFile(
  client: SupabaseClient,
  { bucket, path, body, contentType, upsert = true }: UploadFileInput
): Promise<{ error: string | null }> {
  const { error } = await client.storage.from(bucket).upload(path, body, { upsert, contentType });
  return { error: error?.message ?? null };
}

/** Cache-busting con `?t=` — mismo truco que usaba v1 tras cada upsert. */
export function getPublicUrl(client: SupabaseClient, bucket: StorageBucket, path: string): string {
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function removeFiles(
  client: SupabaseClient,
  bucket: StorageBucket,
  paths: string[]
): Promise<{ error: string | null }> {
  if (paths.length === 0) return { error: null };
  const { error } = await client.storage.from(bucket).remove(paths);
  return { error: error?.message ?? null };
}

/** Extrae el path dentro del bucket a partir de una public URL — para borrar el archivo viejo al reemplazarlo o al borrar el dueño (venue, perfil, ...). */
export function pathFromPublicUrl(publicUrl: string, bucket: StorageBucket): string | null {
  const match = publicUrl.match(new RegExp(`/${bucket}/(.+?)(?:\\?.*)?$`));
  return match ? decodeURIComponent(match[1]) : null;
}
