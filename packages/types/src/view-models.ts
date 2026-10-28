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

export interface Bucket {
  id: ProviderBucket;
  label: string;
  help: string;
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
  label: string;
  name: string;
  icon: string;
  blurb: string;
}

export interface TeamDef {
  icon: string;
  dept: string;
}

export interface GroupModeDef {
  id: GroupModeId;
  label: string;
  help: string;
  lead: string;
}

export interface EquipoTabDef {
  id: EquipoTabId;
  label: string;
  title: string;
  help: string;
}

export interface TabDef {
  id: "hoy" | "show" | "lugar" | "equipo" | "club";
  label: string;
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

export interface VehicleLoad {
  label: string;
  meta: string;
}

export interface Reminder {
  at: string;
  message: string;
}
