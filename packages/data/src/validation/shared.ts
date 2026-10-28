import { z } from "zod";

/**
 * Piezas reusables de validación, portadas de v1
 * (GigBridge/gigbridge/src/lib/apiValidation.ts). `parseJson` allá
 * devolvía un NextResponse en el caso de error — eso es Next-específico,
 * así que aquí solo queda el parseo puro (`safeParseBody`); el Route
 * Handler en apps/web es quien construye la respuesta HTTP a partir del
 * resultado.
 */

export const uuidSchema = z.string().uuid({ message: "Identificador inválido" });
export const slugSchema = z
  .string()
  .min(2, { message: "Slug demasiado corto" })
  .max(50, { message: "Slug demasiado largo" });

export type ParseResult<T> = { ok: true; data: T } | { ok: false; message: string };

export function safeParseBody<T>(raw: unknown, schema: z.ZodType<T>): ParseResult<T> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? "Datos inválidos" };
  }
  return { ok: true, data: result.data };
}
