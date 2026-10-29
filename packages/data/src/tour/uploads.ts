import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_LOCALE, tourMessages, type Locale } from "@gigbridge/config";
import type { ActionResult } from "../auth/actions";

/**
 * Subida de un documento técnico a una fecha (Show › Documentos técnicos).
 *
 * Usa dos clientes a propósito, como pide 0010: el bucket `documents` y las
 * filas de documents/document_versions solo se escriben con service role.
 * Antes, con el cliente de sesión, se comprueba que quien sube puede verla
 * (RLS de tour_dates) y que es admin o jefe de departamento de la gira
 * (matriz de 0015). Ningún dato del service role vuelve al usuario sin
 * pasar por ese chequeo.
 *
 * Queda como documento de la fecha (owner_type 'tour_date', visible para la
 * gira) y referenciado en tour_date_document_refs con su v1 ya vista, así
 * que aparece "Vigente" en Show y en Documentos y versiones.
 */

export const UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
export const UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
};
/** Tipos de documento (document_types.key, 0007) que se ofrecen al subir desde una fecha. */
export const UPLOAD_DOCUMENT_TYPES = ["rider_tecnico", "stage_plot", "patch_list", "rigging_plot"] as const;

export async function uploadTourDateDocument(
  session: SupabaseClient,
  service: SupabaseClient,
  input: {
    tourDateId: string;
    title: string;
    typeKey: string;
    file: { type: string; size: number; bytes: ArrayBuffer };
  },
  locale: Locale = DEFAULT_LOCALE
): Promise<ActionResult<{ documentId: string }>> {
  const e = tourMessages(locale).errors;
  const title = input.title.trim();
  const ext = UPLOAD_TYPES[input.file.type];
  if (
    !title ||
    !ext ||
    input.file.size === 0 ||
    input.file.size > UPLOAD_MAX_BYTES ||
    !(UPLOAD_DOCUMENT_TYPES as readonly string[]).includes(input.typeKey)
  ) {
    return { ok: false, message: e.uploadInvalid };
  }

  // 1) Con la sesión: la fecha existe para este usuario y su rol permite subir.
  const { data: auth } = await session.auth.getUser();
  if (!auth.user) return { ok: false, message: e.uploadNotAllowed };
  const { data: date } = await session.from("tour_dates").select("tour_id").eq("id", input.tourDateId).maybeSingle();
  if (!date) return { ok: false, message: e.dateNotFound };
  const [{ data: isAdmin }, { data: mine }, { data: profile }] = await Promise.all([
    session.rpc("is_tour_admin", { p_tour_id: date.tour_id }),
    session
      .from("tour_crew")
      .select("member_role, crew_member:crew_members!inner(user_id)")
      .eq("tour_id", date.tour_id)
      .eq("crew_member.user_id", auth.user.id)
      .maybeSingle(),
    session.from("profiles").select("id").eq("user_id", auth.user.id).maybeSingle(),
  ]);
  if (isAdmin !== true && mine?.member_role !== "dept_head") return { ok: false, message: e.uploadNotAllowed };

  // 2) Con service role: fila, archivo, versión y referencia.
  const { data: type } = await service.from("document_types").select("id").eq("key", input.typeKey).single();
  if (!type) return { ok: false, message: e.uploadFailed };
  const { data: doc, error: docError } = await service
    .from("documents")
    .insert({
      owner_type: "tour_date",
      owner_id: input.tourDateId,
      document_type_id: type.id,
      title,
      visibility: "tour_members",
      created_by: profile?.id ?? null,
    })
    .select("id")
    .single();
  if (docError || !doc) return { ok: false, message: e.uploadFailed };

  const path = `tour_date/${input.tourDateId}/${doc.id}/v1.${ext}`;
  const rollback = async () => {
    await service.from("documents").delete().eq("id", doc.id);
  };
  const upload = await service.storage.from("documents").upload(path, input.file.bytes, { contentType: input.file.type });
  if (upload.error) {
    await rollback();
    return { ok: false, message: e.uploadFailed };
  }
  const fileUrl = service.storage.from("documents").getPublicUrl(path).data.publicUrl;

  const { data: version } = await service
    .from("document_versions")
    .insert({ document_id: doc.id, version_number: 1, file_url: fileUrl, uploaded_by: profile?.id ?? null })
    .select("id")
    .single();
  const linked =
    version &&
    !(await service.from("documents").update({ current_version_id: version.id }).eq("id", doc.id)).error &&
    !(
      await service
        .from("tour_date_document_refs")
        .insert({ tour_date_id: input.tourDateId, document_id: doc.id, seen_version_id: version.id })
    ).error;
  if (!linked) {
    await service.storage.from("documents").remove([path]);
    await rollback();
    return { ok: false, message: e.uploadFailed };
  }
  return { ok: true, result: { documentId: doc.id as string } };
}
