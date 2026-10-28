export * from "./locale";
export * from "./equipmentCatalog";

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

// "Hoja del día" (no "Día de show"): también hay días de viaje y holds, y
// "Show" ya es la pestaña de la ficha técnica del show.
export const TABS: TabDef[] = [
  { id: "hoy", label: "Hoja del día", icon: "calendar-dot" },
  { id: "show", label: "Show", icon: "microphone-stage" },
  { id: "lugar", label: "Lugar", icon: "map-trifold" },
  { id: "equipo", label: "Equipo", icon: "users-three" },
  { id: "club", label: "Proveedores", icon: "address-book" },
];

export const EQUIPO_TABS: EquipoTabDef[] = [
  { id: "crew", label: "Crew", title: "Crew", help: "Quién está en la gira, agrupado como lo necesites ver." },
  { id: "areas", label: "Áreas", title: "Áreas", help: "Cuánta gente hay en cada bloque y quién lo lidera." },
  { id: "ubicaciones", label: "Ubicaciones", title: "Ubicaciones", help: "Dónde duerme cada persona de la gira, por bloque." },
  { id: "contactos", label: "Contactos", title: "Contactos", help: "Teléfonos y correos del equipo de la gira y de contactos externos: venue, promotor, hotel y proveedores." },
  { id: "invitados", label: "Invitados", title: "Invitados", help: "Lista de invitados de esta fecha y el resumen de toda la gira." },
];

export const PARTIES: Record<PartyKey, PartyDef> = {
  A: { label: "Party A", name: "Party A · equipo del artista", icon: "star", blurb: "Entorno directo del artista: management personal, vestuario, glam y seguridad privada." },
  B: { label: "Party B", name: "Party B · equipo de la banda", icon: "guitar", blurb: "Músicos y sus técnicos: backline, playback y monitores de la banda." },
  C: { label: "Party C", name: "Party C · crew de producción", icon: "users-three", blurb: "Producción, técnicos por área, transporte, seguridad de sitio y local crew." },
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

export const GROUP_MODES: GroupModeDef[] = [
  { id: "party", label: "Por party", help: "Tres bloques: equipo del artista, equipo de la banda y crew de producción.", lead: "Líder del party" },
  { id: "equipo", label: "Por equipo", help: "Cada área técnica como equipo propio: luces, sonido, RF, backline, vestuario, choferes, seguridad…", lead: "Líder del equipo" },
  { id: "depto", label: "Por departamento", help: "Los cuatro departamentos del catálogo: booking, producción técnica, logística y legal.", lead: "Líder del departamento" },
  { id: "jerarquia", label: "Por jerarquía", help: "Cadena de mando completa: quién reporta a quién, del Tour Manager hacia abajo.", lead: "Al frente de la cadena" },
];

export const BUCKETS: Bucket[] = [
  { id: "recinto", label: "Autorizados por el recinto", help: "Lista cerrada del venue. Si el show es ahí, no hay alternativa: se contrata de aquí." },
  { id: "local", label: "Locales", help: "Conocidos y cercanos al recinto. Sirven para emergencias del día del show." },
  { id: "general", label: "Generales", help: "Directorio completo de la gira: los que viajan contigo o cotizan cualquier fecha." },
  { id: "vetado", label: "No admitidos", help: "Vetados por el recinto o por la gira. Se muestran para que nadie los contrate por error." },
];

export const CONTACT_TYPES = ["Todos", "Gira", "Recinto", "Promotor", "Hotel", "Proveedor"];
