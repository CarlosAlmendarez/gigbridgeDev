// Punto de entrada seguro para Client Components (y, a futuro, React Native).
// Para lo que sólo debe correr en servidor (service role, cliente con
// cookies) importa desde "@gigbridge/data/server" en vez de aquí.

export { createSupabaseBrowserClient } from "./supabase/browserClient";
export { getCurrentProfile, getCurrentUser } from "./auth/session";
export * from "./auth/guards";
export * from "./auth/actions";
export * from "./lib/rateLimit";
export * from "./storage";

export * from "./tour/repository";
export * from "./tour/formatting";
export * from "./tour/permissions";
export {
  TOUR_NAME,
  BAND_LINE,
  DEFAULT_DATE_ID,
  GUESTS_SEED,
  DEFAULT_HITOS,
  DEFAULT_SETLIST,
  DEFAULT_VEHICLES,
  DEFAULT_REMINDERS,
  REMINDER_PRESETS,
  DEFAULT_NOTAS,
  type NotaEntry,
} from "./tour/mockData";

export * from "./validation/tour";
export * from "./validation/shared";
export * from "./validation/profiles";
export * from "./validation/bands";
export * from "./validation/venues";
export * from "./validation/booking";
export * from "./validation/push";
