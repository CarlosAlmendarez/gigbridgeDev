import { NextResponse } from "next/server";
import type { z } from "zod";
import { safeParseBody } from "@gigbridge/data";

/**
 * Envuelve `safeParseBody` (puro, en @gigbridge/data) en NextResponse —
 * el resto de GigBridge/gigbridge/src/lib/apiValidation.ts era esto.
 *
 * Uso:
 *   const parsed = await parseJson(req, schema);
 *   if (!parsed.ok) return parsed.response;
 *   const { ... } = parsed.data;
 */

type ParseFail = { ok: false; response: NextResponse };
type ParseOk<T> = { ok: true; data: T };

export async function parseJson<T>(req: Request, schema: z.ZodType<T>): Promise<ParseOk<T> | ParseFail> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: NextResponse.json({ error: "JSON inválido" }, { status: 400 }) };
  }

  const result = safeParseBody(raw, schema);
  if (!result.ok) {
    return { ok: false, response: NextResponse.json({ error: result.message }, { status: 400 }) };
  }
  return { ok: true, data: result.data };
}

export { uuidSchema, slugSchema } from "@gigbridge/data";
