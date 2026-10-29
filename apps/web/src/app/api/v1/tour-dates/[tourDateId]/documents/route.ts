import { NextResponse, type NextRequest } from "next/server";
import { getLocale } from "next-intl/server";
import { tourMessages, type Locale } from "@gigbridge/config";
import { uploadTourDateDocument } from "@gigbridge/data";
import { createSupabaseServiceRoleClient } from "@gigbridge/data/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { tourDataSource } from "@/lib/tourRepository";

/**
 * POST /api/v1/tour-dates/:tourDateId/documents  (multipart: file, title, type)
 *
 * Route Handler y no Server Action porque escribe el bucket `documents` con
 * el cliente service role (0010: ese bucket no tiene policy de escritura) —
 * la secret key no puede salir del servidor — y porque la app nativa
 * también sube archivos por aquí. El permiso lo decide
 * uploadTourDateDocument con la sesión del usuario antes de tocar nada con
 * service role.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ tourDateId: string }> }) {
  const { tourDateId } = await params;
  const locale = (await getLocale()) as Locale;
  const e = tourMessages(locale).errors;
  if (tourDataSource() !== "supabase") return NextResponse.json({ error: e.demoNoSave }, { status: 400 });

  const session = await getSupabaseServerClient();
  const { data: auth } = await session.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: e.uploadNotAllowed }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: e.uploadInvalid }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: e.uploadInvalid }, { status: 400 });

  const result = await uploadTourDateDocument(
    session,
    createSupabaseServiceRoleClient(),
    {
      tourDateId,
      title: String(form.get("title") ?? ""),
      typeKey: String(form.get("type") ?? ""),
      file: { type: file.type, size: file.size, bytes: await file.arrayBuffer() },
    },
    locale
  );
  if (!result.ok) {
    const status = result.message === e.uploadNotAllowed ? 403 : result.message === e.dateNotFound ? 404 : 400;
    return NextResponse.json({ error: result.message }, { status });
  }
  return NextResponse.json({ documentId: result.result.documentId }, { status: 201 });
}
