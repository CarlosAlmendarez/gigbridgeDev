import { z } from "zod";

export const setupProfileSchema = z.object({
  display_name: z.string().min(1, { message: "Nombre requerido" }).max(100, { message: "Nombre demasiado largo" }),
  role: z.enum(["artist", "venue", "booker", "manager", "fan"]),
  slug: z.string().min(1, { message: "Slug requerido" }),
});
export type SetupProfileInput = z.infer<typeof setupProfileSchema>;

export const updateProfileRoleSchema = z.object({
  role: z.enum(["artist", "venue", "booker", "manager", "fan"]),
});
export type UpdateProfileRoleInput = z.infer<typeof updateProfileRoleSchema>;

export const updateAvailabilityCitySchema = z.object({
  city: z.string().max(100, { message: "La ciudad no puede superar los 100 caracteres" }),
});
export type UpdateAvailabilityCityInput = z.infer<typeof updateAvailabilityCitySchema>;
