import { z } from "zod";

/**
 * Validación de mutaciones del módulo de gira. Vive aquí (no en componentes
 * de React) para que tanto un Route Handler de apps/web como la futura app
 * nativa validen exactamente igual antes de escribir a Supabase.
 */

export const addGuestSchema = z.object({
  tourDateId: z.string().min(1),
  name: z.string().trim().min(1, "El nombre del invitado no puede estar vacío"),
});
export type AddGuestInput = z.infer<typeof addGuestSchema>;

export const guestStatusUpdateSchema = z.object({
  tourDateId: z.string().min(1),
  guestId: z.string().min(1),
  status: z.enum(["confirmed", "pending", "denied"]),
});
export type GuestStatusUpdateInput = z.infer<typeof guestStatusUpdateSchema>;

export const addTourNoteSchema = z.object({
  tourId: z.string().min(1),
  entityType: z.enum(["tour", "tour_date", "tour_crew", "contract", "provider", "venue"]),
  entityId: z.string().min(1),
  body: z.string().trim().min(1, "La nota no puede estar vacía"),
});
export type AddTourNoteInput = z.infer<typeof addTourNoteSchema>;

export const addReminderSchema = z.object({
  tourDateId: z.string().min(1).nullable(),
  remindAt: z.string().min(1),
  message: z.string().trim().min(1),
});
export type AddReminderInput = z.infer<typeof addReminderSchema>;

export const reorderListSchema = z.object({
  tourDateId: z.string().min(1),
  fromIndex: z.number().int().nonnegative(),
  toIndex: z.number().int().nonnegative(),
});
export type ReorderListInput = z.infer<typeof reorderListSchema>;

export const adoptRiderVersionSchema = z.object({
  tourDateId: z.string().min(1),
  riderVersionId: z.string().min(1),
});
export type AdoptRiderVersionInput = z.infer<typeof adoptRiderVersionSchema>;
