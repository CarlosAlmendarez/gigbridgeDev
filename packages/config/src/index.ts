export * from "./locale";
export * from "./equipmentCatalog";
export * from "./i18n/tour";

import type {
  Bucket,
  EquipoTabDef,
  GroupModeDef,
  GuestStatus,
  PartyDef,
  PartyKey,
  ProviderBucket,
  TabDef,
  TeamDef,
} from "@gigbridge/types";

// Catálogos compartidos por web y (a futuro) la app nativa: enums de status,
// roles/equipos y las definiciones de pestañas/filtros de la UI de gira.
// No depende del DOM ni de React — es solo dato y constantes.

export const TOUR_DATE_STATUSES = ["hold", "confirmed", "cancelled", "completed"] as const;
export const VISIBILITY_SCOPES = ["self", "department", "tour_all", "custom"] as const;
export const GUEST_STATES: GuestStatus[] = ["confirmed", "pending", "denied"];
export const PROVIDER_BUCKETS: ProviderBucket[] = ["recinto", "local", "general", "vetado"];

// Solo ids e íconos: los textos (etiquetas, ayudas) viven en i18n/tour.ts
// para que salgan en el idioma del usuario.
// "Hoja del día" (no "Día de show"): también hay días de viaje y holds, y
// "Show" ya es la pestaña de la ficha técnica del show.
export const TABS: TabDef[] = [
  { id: "hoy", icon: "calendar-dot" },
  { id: "show", icon: "microphone-stage" },
  { id: "lugar", icon: "map-trifold" },
  { id: "equipo", icon: "users-three" },
  { id: "club", icon: "address-book" },
];

export const EQUIPO_TABS: EquipoTabDef[] = [{ id: "crew" }, { id: "areas" }, { id: "ubicaciones" }, { id: "contactos" }, { id: "invitados" }];

export const PARTIES: Record<PartyKey, PartyDef> = {
  A: { icon: "star" },
  B: { icon: "guitar" },
  C: { icon: "users-three" },
};

export const TEAMS: Record<string, TeamDef> = {
  Management: { icon: "briefcase", dept: "Logística" },
  Artista: { icon: "star", dept: "Logística" },
  Vestuario: { icon: "t-shirt", dept: "Producción técnica" },
  Seguridad: { icon: "shield-check", dept: "Logística" },
  Sonido: { icon: "speaker-high", dept: "Producción técnica" },
  Monitores: { icon: "headphones", dept: "Producción técnica" },
  Radiofrecuencia: { icon: "wifi-high", dept: "Producción técnica" },
  Luces: { icon: "lightbulb", dept: "Producción técnica" },
  Video: { icon: "video-camera", dept: "Producción técnica" },
  Backline: { icon: "guitar", dept: "Producción técnica" },
  Playback: { icon: "waveform", dept: "Producción técnica" },
  Stage: { icon: "stack", dept: "Producción técnica" },
  Carpintería: { icon: "hammer", dept: "Producción técnica" },
  Rigging: { icon: "anchor", dept: "Producción técnica" },
  Choferes: { icon: "steering-wheel", dept: "Logística" },
  Catering: { icon: "fork-knife", dept: "Logística" },
  Booking: { icon: "handshake", dept: "Booking comercial" },
  Legal: { icon: "scales", dept: "Legal" },
};

export const TEAM_ORDER = [
  "Management", "Artista", "Vestuario", "Seguridad", "Stage", "Sonido", "Monitores",
  "Radiofrecuencia", "Luces", "Video", "Backline", "Playback", "Carpintería", "Rigging",
  "Choferes", "Catering", "Booking", "Legal",
];

export const DEPT_ORDER = ["Booking comercial", "Producción técnica", "Logística", "Legal"];

export const GROUP_MODES: GroupModeDef[] = [{ id: "party" }, { id: "equipo" }, { id: "depto" }, { id: "jerarquia" }];

export const BUCKETS: Bucket[] = [{ id: "recinto" }, { id: "local" }, { id: "general" }, { id: "vetado" }];

// Valores de ExternalContact.type; la etiqueta visible está en i18n/tour.ts (contactTypes).
export const CONTACT_TYPES = ["Todos", "Gira", "Recinto", "Promotor", "Hotel", "Proveedor"] as const;
