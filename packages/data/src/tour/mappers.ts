import { TEAMS } from "@gigbridge/config";
import type {
  CrewMemberRow,
  DateKind,
  DocFile,
  FileStatus,
  HotelRoomAssignmentRow,
  LaborCallRow,
  NoteEntry,
  PartyKey,
  RoomScope,
  RosterPerson,
  TourCrewRow,
  TourDate,
  TourDateRow,
  TourMemberRole,
  TourNoteRow,
  TourVehicleRow,
  VenueRow,
} from "@gigbridge/types";

/**
 * Mapeo puro de filas de Supabase (db.ts) a los view models que consume la
 * UI (view-models.ts). Sin I/O: supabaseRepository.ts hace las consultas y
 * le pasa aquí las filas ya traídas, así que esto se puede probar y reusar
 * en la app nativa sin cliente.
 *
 * Campos del view model que todavía no tienen tabla (hitos del reloj fuera
 * de doors/show/labor, itinerario de vuelos, notas de proveedores) salen
 * vacíos en vez de inventarse.
 */

const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// `show_date` es una fecha de calendario sin hora: se interpreta a mediodía
// UTC para que ninguna zona la mueva de día.
function parseDay(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return { dow: DOW[d.getUTCDay()], day: String(d.getUTCDate()), mon: MON[d.getUTCMonth()], year: d.getUTCFullYear() };
}

export function hhmm(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : "";
}

function mapsUrl(venue: Pick<VenueRow, "google_maps_url" | "address" | "city"> | null, fallback: string): string {
  if (venue?.google_maps_url) return venue.google_maps_url;
  const q = venue ? [venue.address, venue.city].filter(Boolean).join(", ") : fallback;
  return `https://maps.google.com/?q=${encodeURIComponent(q)}`;
}

const VENUE_TYPE_LABEL: Record<VenueRow["venue_type"], string> = {
  live_venue: "Foro en vivo",
  rehearsal_studio: "Sala de ensayo",
  hybrid: "Foro y sala de ensayo",
};

const MANAGEMENT_LABEL: Record<VenueRow["management_type"], string> = {
  independent: "Independiente",
  managed: "Operado por promotora",
  hybrid: "Mixto",
};

const CONTACT_VISIBILITY_LABEL: Record<VenueRow["contact_visibility"], string> = {
  public: "Contactos públicos",
  verified_pros: "Contactos solo para profesionales verificados",
  tour_members: "Contactos solo para el equipo de la gira",
};

export interface DateExtras {
  laborCalls: LaborCallRow[];
  setlistSongs: number | null;
  hotelRooms: HotelRoomAssignmentRow[];
  docs: DocFile[];
  venueDocs: DocFile[];
  dateNotes: NoteEntry[];
  venueNotes: NoteEntry[];
  vehicles: TourVehicleRow[];
}

export const EMPTY_EXTRAS: DateExtras = {
  laborCalls: [],
  setlistSongs: null,
  hotelRooms: [],
  docs: [],
  venueDocs: [],
  dateNotes: [],
  venueNotes: [],
  vehicles: [],
};

/**
 * Indicadores de pendientes del día (doc de estrategia, "Área 1": "rider
 * vencido, setlist sin confirmar, documento faltante, labor sin asignar").
 * Solo aplica a fechas con show; un día de viaje no tiene pendientes de show.
 */
export function computeMissing(kind: DateKind, extras: Pick<DateExtras, "laborCalls" | "setlistSongs" | "docs">) {
  if (kind === "Viaje") return { completion: 100, missing: [] as string[] };
  const checks: Array<[boolean, string]> = [
    [(extras.setlistSongs ?? 0) > 0, "Setlist sin confirmar"],
    [extras.laborCalls.length > 0, "Labor call sin capturar"],
    [extras.docs.length > 0, "Sin documentos del venue referenciados"],
    [!extras.docs.some((d) => d.status === "revisar"), "Documento desactualizado"],
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  return { completion: Math.round(((checks.length - missing.length) / checks.length) * 100), missing };
}

export function mapTourDate(
  row: TourDateRow,
  venue: VenueRow | null,
  position: { showNumber: number | null; totalShows: number },
  extras: DateExtras = EMPTY_EXTRAS
): TourDate {
  const { dow, day, mon, year } = parseDay(row.show_date);
  const kind: DateKind = !row.venue_id ? "Viaje" : row.status === "hold" ? "Hold" : "Show";
  const dateline = `${dow} ${day} ${mon} ${year}`;
  const { completion, missing } = computeMissing(kind, extras);

  const sortedLabor = extras.laborCalls.slice().sort((a, b) => a.call_time.localeCompare(b.call_time));
  const clock = [
    ...sortedLabor.map((l) => ({ time: hhmm(l.call_time), label: `${l.position_title} · ${l.headcount}` })),
    ...(row.doors_time ? [{ time: hhmm(row.doors_time), label: "Doors" }] : []),
    ...(row.show_time ? [{ time: hhmm(row.show_time), label: "Show", accent: true }] : []),
  ];

  const hotel = extras.hotelRooms[0];
  const place = venue ? [venue.city, venue.state_region].filter(Boolean).join(", ") : "";
  const capacity = venue?.capacity ? `${venue.capacity.toLocaleString("es-MX")} pax` : "";
  const venueType = venue ? VENUE_TYPE_LABEL[venue.venue_type] : "Sin venue";
  const crewLocal = sortedLabor.reduce((sum, l) => sum + l.headcount, 0);

  return {
    id: row.id,
    dow,
    day,
    kind,
    dateline,
    counter:
      kind === "Viaje"
        ? "Día de viaje"
        : position.showNumber
          ? `Show ${String(position.showNumber).padStart(2, "0")} / ${position.totalShows}`
          : "Hold",
    kicker: venue ? place : "Día de viaje",
    title: venue ? venue.name : "Día de traslado",
    subtitle: venue ? [[venueType, capacity].filter(Boolean).join(" · "), venue.address ?? ""].filter(Boolean).join("\n") : row.notes ?? "",
    mapUrl: mapsUrl(venue, "Ruta del día"),
    // Los contactos del venue todavía no tienen tabla: sin teléfono directo.
    tel: "",
    telLabel: "",
    contactLine: "",
    completion,
    missing,
    clock,
    clockNote: venue ? row.notes ?? "" : "",
    hotel: hotel?.hotel_name ?? "",
    hotelMeta: hotel?.check_in ? `check-in ${hotel.check_in}` : "",
    hotelMap: hotel ? `https://maps.google.com/?q=${encodeURIComponent(hotel.hotel_name)}` : "",
    venueRider: venue ? `${venue.name} — expediente técnico` : "Sin venue en esta fecha",
    venueRiderNote: venue?.stage_notes ?? "",
    advanceLine: row.advance_date ? `Avance del ${row.advance_date}` : "Avance pendiente",
    itinerary: extras.vehicles
      .slice()
      .sort((a, b) => (a.load_order ?? 0) - (b.load_order ?? 0))
      .map((v) => ({
        icon: v.vehicle_type === "truck" ? "truck" : v.vehicle_type === "bus" ? "bus" : "van",
        title: v.label,
        meta: v.load_order != null ? `Orden de carga ${v.load_order}` : "",
        note: "",
      })),
    venue: {
      kicker: venue ? place : "Día de viaje",
      name: venue?.name ?? "Sin recinto",
      address: venue?.address ?? "",
      type: venueType,
      capacity: venue?.capacity ? String(venue.capacity) : "—",
      visibility: venue ? CONTACT_VISIBILITY_LABEL[venue.contact_visibility] : "No aplica",
      management: venue ? MANAGEMENT_LABEL[venue.management_type] : "",
      mapUrl: mapsUrl(venue, "Ruta del día"),
      site: venue?.website_url ?? "",
      specs: venue ? venueSpecs(venue) : [],
      contacts: [],
      files: extras.venueDocs,
      notes: extras.venueNotes,
      providerRule: "",
    },
    show: {
      kicker: `${dateline} · ${kind === "Viaje" ? "día de viaje" : venue?.name ?? ""}`,
      headline: [
        { value: hhmm(sortedLabor[0]?.call_time) || "—", label: "Load-in" },
        { value: hhmm(row.doors_time) || "—", label: "Doors" },
        { value: hhmm(row.show_time) || "—", label: "Show" },
        { value: crewLocal ? String(crewLocal) : "—", label: "Crew local" },
      ],
      montaje: sortedLabor.map((l) => ({ time: hhmm(l.call_time), task: l.position_title, area: l.notes ?? "" })),
      docs: extras.docs,
      notes: extras.dateNotes,
    },
    guestKicker: `${kind === "Viaje" ? "Día de viaje" : kind} · ${day} ${mon}`,
  };
}

function venueSpecs(v: VenueRow): { k: string; v: string }[] {
  const specs: Array<[string, string | null]> = [
    ["Escenario", v.stage_width_m && v.stage_depth_m ? `${v.stage_width_m} × ${v.stage_depth_m} m` : null],
    ["Consola FOH", v.has_foh_console ? [v.foh_console_brand, v.foh_console_model].filter(Boolean).join(" ") || "Sí" : null],
    ["PA", v.has_pa ? [v.pa_brand, v.pa_model].filter(Boolean).join(" ") || "Sí" : null],
    ["Monitores de piso", v.floor_monitors_count ? String(v.floor_monitors_count) : null],
    ["Corriente", `${v.power_voltage} V · ${v.power_outlets_stage} contactos en escenario`],
    ["Andén de carga", v.has_loading_dock ? "Sí" : "No"],
    ["Curfew", v.curfew_time ? hhmm(v.curfew_time) : null],
  ];
  return specs.filter((s): s is [string, string] => Boolean(s[1])).map(([k, val]) => ({ k, v: val }));
}

export function mapNote(row: Pick<TourNoteRow, "body" | "created_at">, origen?: string): NoteEntry {
  return { body: row.body, meta: row.created_at.slice(0, 10), ...(origen ? { origen } : {}) };
}

/** Referencia en vivo (0007): visto ≠ vigente → "revisar"; sin versión subida → "nuevo". */
export function docStatus(currentVersionId: string | null, seenVersionId: string | null | undefined): FileStatus {
  if (!currentVersionId) return "nuevo";
  if (seenVersionId === undefined || seenVersionId === currentVersionId) return "vigente";
  return "revisar";
}

const MEMBER_ROLE_SCOPE: Record<TourMemberRole, string> = {
  admin: "Admin de la gira: ve y edita todo.",
  dept_head: "Jefe de departamento.",
  member: "Miembro de la gira.",
  guest: "Invitado: acceso limitado a la gira.",
};

export interface RosterRow extends Pick<TourCrewRow, "id" | "crew_member_id" | "member_role" | "reports_to" | "party" | "status"> {
  crew_member: Pick<CrewMemberRow, "full_name" | "phone" | "email" | "user_id"> | null;
  role: { name: string; department: { name: string } | null } | null;
}

function toParty(party: string | null): PartyKey {
  const p = party?.trim().toUpperCase();
  return p === "A" || p === "B" ? p : "C";
}

/**
 * Roster en orden de cadena de mando (DFS desde las raíces de reports_to),
 * que es el orden que la vista "Por jerarquía" muestra tal cual.
 * `rooms` son solo los cuartos que la RLS (0013) le deja ver a quien
 * consulta: si no hay fila no se sabe si existe, y se muestra como oculto.
 */
export function mapRoster(rows: RosterRow[], rooms: HotelRoomAssignmentRow[]): RosterPerson[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const children = new Map<string | null, RosterRow[]>();
  for (const r of rows) {
    const parent = r.reports_to && byId.has(r.reports_to) ? r.reports_to : null;
    children.set(parent, [...(children.get(parent) ?? []), r]);
  }

  const ordered: Array<{ row: RosterRow; depth: number }> = [];
  const visit = (parent: string | null, depth: number) => {
    for (const row of children.get(parent) ?? []) {
      ordered.push({ row, depth });
      visit(row.id, depth + 1);
    }
  };
  visit(null, 0);

  return ordered.map(({ row, depth }) => {
    const name = row.crew_member?.full_name ?? "Sin nombre";
    const boss = row.reports_to ? byId.get(row.reports_to)?.crew_member?.full_name : null;
    const room = rooms.find((h) => h.crew_member_id === row.crew_member_id);
    const dept = row.role?.department?.name ?? "";
    return {
      name,
      role: row.role?.name ?? "",
      party: toParty(row.party),
      // `team` alimenta los agrupadores de formatting.ts, que esperan una
      // llave del catálogo TEAMS; un departamento fuera del catálogo se
      // agrupa como "Management" hasta que el catálogo venga de la base.
      team: dept in TEAMS ? dept : "Management",
      depth,
      account: Boolean(row.crew_member?.user_id),
      reports: boss ? `Reporta a ${boss}` : "Raíz de la gira",
      scope: MEMBER_ROLE_SCOPE[row.member_role],
      tel: row.crew_member?.phone ?? "",
      email: row.crew_member?.email ?? "",
      hotel: room?.hotel_name ?? "",
      room: room?.room_number ?? "",
      roomScope: (room?.default_scope ?? "self") as RoomScope,
      onSite: row.status === "confirmed",
      note: "",
    };
  });
}
