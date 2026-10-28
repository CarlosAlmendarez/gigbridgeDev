import { z } from "zod";

/**
 * Port del schema de BookingRequestForm.tsx en v1 (ahí vivía junto al
 * formulario, con mensajes vía next-intl). Aquí queda sin depender de
 * i18n — el Route Handler/formulario decide cómo mostrar cada mensaje.
 */
export const createBookingRequestSchema = z.object({
  profile_id: z.string().uuid(),
  requester_id: z.string().uuid().nullable().optional(),
  requester_name: z.string().max(200).optional(),
  requester_email: z.string().email().optional(),
  event_date: z.string().min(1, { message: "La fecha es requerida" }),
  event_type: z.string().min(1, { message: "El tipo de evento es requerido" }),
  venue_name: z.string().min(2, { message: "Nombre del venue demasiado corto" }),
  venue_city: z.string().min(2, { message: "Ciudad demasiado corta" }),
  venue_capacity: z.number().int().positive().optional(),
  venue_address: z.string().optional(),
  budget_min: z.number().int().nonnegative().optional(),
  budget_max: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  set_duration_minutes: z.number().int().positive().optional(),
  load_in_time: z.string().optional(),
  soundcheck_time: z.string().optional(),
  show_time: z.string().min(1, { message: "La hora de show es requerida" }),
  has_pa: z.boolean().optional(),
  pa_details: z.string().optional(),
  has_monitors: z.boolean().optional(),
  has_backline: z.boolean().optional(),
  backline_details: z.string().optional(),
  has_lighting: z.boolean().optional(),
  message: z.string().max(500).optional(),
});
export type CreateBookingRequestInput = z.infer<typeof createBookingRequestSchema>;
