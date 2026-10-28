import { z } from "zod";
import { uuidSchema } from "./shared";

export const createVenueSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
  city: z.string().min(2),
  state_region: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  google_maps_url: z.string().nullable().optional(),
  venue_type: z.enum(["live_venue", "rehearsal_studio", "hybrid"]).optional(),
});
export type CreateVenueInput = z.infer<typeof createVenueSchema>;

export const venueIdSchema = z.object({ venueId: uuidSchema });
export type VenueIdInput = z.infer<typeof venueIdSchema>;

/**
 * El wizard de venue manda un subconjunto distinto de columnas por paso
 * (identidad, escenario, PA, monitores...) — como v1, no hay un schema
 * fijo por campo aquí; solo se valida `venueId` y el resto pasa tal cual
 * a la actualización (el dueño ya está verificado por requireProfileResponse
 * + el chequeo de owner_id en el route, y Postgres rechaza tipos inválidos).
 */
export const updateVenueSchema = z.object({ venueId: uuidSchema }).passthrough();
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;

export const venueVerificationDecisionSchema = z.object({
  venueId: uuidSchema,
  requestId: uuidSchema,
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(2000).optional(),
});
export type VenueVerificationDecisionInput = z.infer<typeof venueVerificationDecisionSchema>;

// Nuevo respecto a v1: solicitud de "claim" (venue creado por GigBridge que
// pasa a copropiedad) reusa la misma tabla que la verificación
// (venue_verification_requests.request_type), ver 0004_venues.sql.
export const venueClaimRequestSchema = z.object({
  venueId: uuidSchema,
});
export type VenueClaimRequestInput = z.infer<typeof venueClaimRequestSchema>;
