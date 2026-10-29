/**
 * "View models": las formas agregadas/planas que consume la UI (web y, más
 * adelante, la app nativa). @gigbridge/data se encarga de mapear las filas
 * normalizadas de Supabase (ver db.ts) a estas formas (tour/mappers.ts), o
 * las sirve tal cual desde el set mock (tour/mockData.ts). Ambas fuentes
 * deben producir exactamente esta forma.
 */

export type DateKind = "Viaje" | "Show" | "Hold";
export type PartyKey = "A" | "B" | "C";
export type FileKind = "pdf" | "plano" | "xls" | "web";
export type FileStatus = "vigente" | "revisar" | "falta" | "nuevo";
export type ProviderBucket = "recinto" | "local" | "general" | "vetado";
export type RoomScope = "self" | "department" | "tour_all" | "custom";
export type GuestStatus = "confirmed" | "pending" | "denied";
export type EquipoTabId = "crew" | "areas" | "ubicaciones" | "contactos" | "invitados";
export type GroupModeId = "party" | "equipo" | "depto" | "jerarquia";

export interface ClockItem {
  time: string;
  label: string;
  accent?: boolean;
}

export interface ItineraryItem {
  icon: string;
  title: string;
  meta: string;
  note: string;
}

export interface VenueSpec {
  k: string;
  v: string;
}

export interface VenueContact {
  name: string;
  role: string;
  email: string;
  tel: string;
}

export interface DocFile {
  /** Con datos reales: id de `documents` y URL de su versión vigente. */
  documentId?: string;
  url?: string;
  name: string;
  kind: FileKind;
  meta: string;
  status: FileStatus;
}

export interface NoteEntry {
  body: string;
  meta: string;
  origen?: string;
}

export interface VenueInfo {
  kicker: string;
  name: string;
  address: string;
  type: string;
  capacity: string;
  visibility: string;
  management: string;
  mapUrl: string;
  site: string;
  specs: VenueSpec[];
  contacts: VenueContact[];
  files: DocFile[];
  notes: NoteEntry[];
  providerRule: string;
}

export interface ShowHeadlineStat {
  value: string;
  label: string;
}

export interface MontajeItem {
  time: string;
  task: string;
  area: string;
}

export interface ShowInfo {
  kicker: string;
  headline: ShowHeadlineStat[];
  montaje: MontajeItem[];
  docs: DocFile[];
  notes: NoteEntry[];
}

export interface TourDate {
  id: string;
  dow: string;
  day: string;
  kind: DateKind;
  dateline: string;
  counter: string;
  kicker: string;
  title: string;
  subtitle: string;
  mapUrl: string;
  tel: string;
  telLabel: string;
  contactLine: string;
  completion: number;
  missing: string[];
  clock: ClockItem[];
  clockNote: string;
  hotel: string;
  hotelMeta: string;
  hotelMap: string;
  venueRider: string;
  venueRiderNote: string;
  advanceLine: string;
  itinerary: ItineraryItem[];
  venue: VenueInfo;
  show: ShowInfo;
  guestKicker: string;
}

export interface Provider {
  name: string;
  service: string;
  contact: string;
  city: string;
  email: string;
  tel: string;
  bucket: ProviderBucket;
  note: string;
}

// Catálogos de config: solo ids/íconos; sus textos están en @gigbridge/config i18n/tour.ts.
export interface Bucket {
  id: ProviderBucket;
}

export interface RosterPerson {
  name: string;
  role: string;
  party: PartyKey;
  team: string;
  depth: number;
  account: boolean;
  reports: string;
  scope: string;
  tel: string;
  email: string;
  hotel: string;
  room: string;
  roomScope: RoomScope;
  /**
   * Con datos reales: true si la RLS no dejó ver el cuarto a quien consulta
   * (no hay forma de distinguirlo de "sin cuarto"). El mock no lo define y
   * la UI cae a ocultar por roomScope, como en el prototipo.
   */
  roomHidden?: boolean;
  onSite: boolean;
  note: string;
}

export interface Vacancy {
  role: string;
  party: PartyKey;
  team: string;
}

export interface PartyDef {
  icon: string;
}

export interface TeamDef {
  icon: string;
  dept: string;
}

export interface GroupModeDef {
  id: GroupModeId;
}

export interface EquipoTabDef {
  id: EquipoTabId;
}

export interface TabDef {
  id: "hoy" | "show" | "lugar" | "equipo" | "club";
  icon: string;
}

export interface ExternalContact {
  name: string;
  role: string;
  type: string;
  email: string;
  phone: string;
  tel: string;
  note: string;
}

export interface Guest {
  /** Id de guest_list_entries con datos reales; el mock no lo tiene. */
  id?: string;
  name: string;
  by: string;
  status: GuestStatus;
}

export interface Hito {
  id: string;
  label: string;
  time: string;
  done: boolean;
}

export interface SetlistSong {
  title: string;
  len: string;
  cue: string;
}

/** Encabezado de la gira para la navegación ("Norte 2026" / "Las Bestias del Valle · 4 fechas"). */
export interface TourSummary {
  /** Id real de la gira; el mock no lo tiene. */
  id?: string;
  name: string;
  bandLine: string;
  /**
   * Rol de quien consulta en esta gira (0015): la UI esconde lo que la RLS
   * le rechazaría en vez de dejarlo intentar. El mock no lo define y se
   * comporta como admin (todo editable, nada se guarda).
   */
  viewerRole?: "admin" | "dept_head" | "member" | "guest";
}

export interface VehicleLoad {
  /** Id de tour_vehicles con datos reales; el mock no lo tiene. */
  id?: string;
  label: string;
  meta: string;
}

export interface Reminder {
  /** Id de `reminders` con datos reales; el mock no lo tiene. */
  id?: string;
  /** Hora local de la fecha, "HH:MM". */
  at: string;
  message: string;
}
