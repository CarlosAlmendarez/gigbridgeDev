import { DEFAULT_LOCALE, TEAMS, TOUR_CALENDAR, fillText, tourMessages, type Locale } from "@gigbridge/config";
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
  TourNoteRow,
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
 *
 * Todo texto que se arma aquí sale del diccionario de @gigbridge/config
 * (i18n/tour.ts) en el idioma que pida quien llama; default español.
 */

// `show_date` es una fecha de calendario sin hora: se interpreta a mediodía
// UTC para que ninguna zona la mueva de día.
function parseDay(isoDate: string, locale: Locale) {
  const cal = TOUR_CALENDAR[locale];
  const d = new Date(`${isoDate}T12:00:00Z`);
  return { dow: cal.dow[d.getUTCDay()], day: String(d.getUTCDate()), mon: cal.mon[d.getUTCMonth()], year: d.getUTCFullYear() };
}

/** "Sáb 14 nov" / "Sat Nov 14": la fecha corta que usan los orígenes de nota y los kickers. */
export function shortDateLabel(isoDate: string, locale: Locale = DEFAULT_LOCALE): string {
  return fillText(TOUR_CALENDAR[locale].short, parseDay(isoDate, locale));
}

export function hhmm(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : "";
}

function mapsUrl(venue: Pick<VenueRow, "google_maps_url" | "address" | "city"> | null, fallback: string): string {
  if (venue?.google_maps_url) return venue.google_maps_url;
  const q = venue ? [venue.address, venue.city].filter(Boolean).join(", ") : fallback;
  return `https://maps.google.com/?q=${encodeURIComponent(q)}`;
}

/** El departamento llega embebido cuando la consulta lo pide (getTourDate); en el listado no. */
export type LaborCallWithDept = LaborCallRow & { department?: { name: string } | null };

export interface DateExtras {
  laborCalls: LaborCallWithDept[];
  setlistSongs: number | null;
  hotelRooms: HotelRoomAssignmentRow[];
  docs: DocFile[];
  venueDocs: DocFile[];
  dateNotes: NoteEntry[];
  venueNotes: NoteEntry[];
}

export const EMPTY_EXTRAS: DateExtras = {
  laborCalls: [],
  setlistSongs: null,
  hotelRooms: [],
  docs: [],
  venueDocs: [],
  dateNotes: [],
  venueNotes: [],
};

/**
 * Indicadores de pendientes del día (doc de estrategia, "Área 1": "rider
 * vencido, setlist sin confirmar, documento faltante, labor sin asignar").
 * Solo aplica a fechas con show; un día de viaje no tiene pendientes de show.
 */
export function computeMissing(
  kind: DateKind,
  extras: Pick<DateExtras, "laborCalls" | "setlistSongs" | "docs">,
  locale: Locale = DEFAULT_LOCALE
) {
  if (kind === "Viaje") return { completion: 100, missing: [] as string[] };
  const tx = tourMessages(locale).data;
  const checks: Array<[boolean, string]> = [
    [(extras.setlistSongs ?? 0) > 0, tx.missingSetlist],
    [extras.laborCalls.length > 0, tx.missingLabor],
    [extras.docs.length > 0, tx.missingDocs],
    [!extras.docs.some((d) => d.status === "revisar"), tx.missingOutdated],
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  return { completion: Math.round(((checks.length - missing.length) / checks.length) * 100), missing };
}

export function mapTourDate(
  row: TourDateRow,
  venue: VenueRow | null,
  position: { showNumber: number | null; totalShows: number },
  extras: DateExtras = EMPTY_EXTRAS,
  locale: Locale = DEFAULT_LOCALE
): TourDate {
  const tx = tourMessages(locale).data;
  const parts = parseDay(row.show_date, locale);
  const { dow, day } = parts;
  const kind: DateKind = !row.venue_id ? "Viaje" : row.status === "hold" ? "Hold" : "Show";
  const dateline = fillText(TOUR_CALENDAR[locale].long, parts);
  const shortDate = (iso: string) => shortDateLabel(iso, locale);
  const { completion, missing } = computeMissing(kind, extras, locale);

  const sortedLabor = extras.laborCalls.slice().sort((a, b) => a.call_time.localeCompare(b.call_time));
  const clock = [
    ...sortedLabor.map((l) => ({ time: hhmm(l.call_time), label: `${l.position_title} · ${l.headcount}` })),
    ...(row.doors_time ? [{ time: hhmm(row.doors_time), label: tx.doors }] : []),
    ...(row.show_time ? [{ time: hhmm(row.show_time), label: tx.show, accent: true }] : []),
  ];

  const hotel = extras.hotelRooms[0];
  const place = venue ? [venue.city, venue.state_region].filter(Boolean).join(", ") : "";
  const capacity = venue?.capacity ? fillText(tx.capacity, { n: venue.capacity.toLocaleString(TOUR_CALENDAR[locale].number) }) : "";
  const venueType = venue ? tx[`venueType_${venue.venue_type}`] : tx.noVenue;
  const crewLocal = sortedLabor.reduce((sum, l) => sum + l.headcount, 0);

  return {
    id: row.id,
    dow,
    day,
    kind,
    dateline,
    counter:
      kind === "Viaje"
        ? tx.travelDay
        : position.showNumber
          ? fillText(tx.showCounter, { n: String(position.showNumber).padStart(2, "0"), total: position.totalShows })
          : tx.hold,
    kicker: venue ? place : tx.travelDay,
    title: venue ? venue.name : tx.transferDay,
    subtitle: venue ? [[venueType, capacity].filter(Boolean).join(" · "), venue.address ?? ""].filter(Boolean).join("\n") : row.notes ?? "",
    mapUrl: mapsUrl(venue, tx.routeOfDay),
    // Los contactos del venue todavía no tienen tabla: sin teléfono directo.
    tel: "",
    telLabel: "",
    contactLine: "",
    completion,
    missing,
    clock,
    clockNote: venue ? row.notes ?? "" : "",
    hotel: hotel?.hotel_name ?? "",
    hotelMeta: hotel?.check_in ? fillText(tx.checkIn, { date: shortDate(hotel.check_in) }) : "",
    hotelMap: hotel ? `https://maps.google.com/?q=${encodeURIComponent(hotel.hotel_name)}` : "",
    venueRider: venue ? fillText(tx.venueRider, { venue: venue.name }) : tx.noVenueOnDate,
    venueRiderNote: venue?.stage_notes ?? "",
    advanceLine: row.advance_date ? fillText(tx.advanceClosed, { date: shortDate(row.advance_date) }) : tx.advancePending,
    // Vuelos y traslados todavía no tienen tabla. Los vehículos de la gira
    // NO van aquí: son el "Orden de carga" (listVehicles), no un itinerario.
    itinerary: [],
    venue: {
      kicker: venue ? place : tx.travelDay,
      name: venue?.name ?? tx.noPlace,
      address: venue?.address ?? "",
      type: venueType,
      capacity: venue?.capacity ? venue.capacity.toLocaleString(TOUR_CALENDAR[locale].number) : "—",
      visibility: venue ? tx[`visibility_${venue.contact_visibility}`] : tx.notApplicable,
      management: venue ? tx[`management_${venue.management_type}`] : "",
      mapUrl: mapsUrl(venue, tx.routeOfDay),
      site: venue?.website_url ?? "",
      specs: venue ? venueSpecs(venue, locale) : [],
      contacts: [],
      files: extras.venueDocs,
      notes: extras.venueNotes,
      providerRule: "",
    },
    show: {
      kicker: `${dateline} · ${kind === "Viaje" ? tx.travelDayLower : venue?.name ?? ""}`,
      headline: [
        { value: hhmm(sortedLabor[0]?.call_time) || "—", label: tx.loadIn },
        { value: hhmm(row.doors_time) || "—", label: tx.doors },
        { value: hhmm(row.show_time) || "—", label: tx.show },
        { value: crewLocal ? String(crewLocal) : "—", label: tx.crewLocal },
      ],
      montaje: sortedLabor.map((l) => ({
        time: hhmm(l.call_time),
        task: l.position_title,
        area: l.department?.name ?? l.notes ?? "",
      })),
      docs: extras.docs,
      notes: extras.dateNotes,
    },
    guestKicker: `${kind === "Viaje" ? tx.travelDay : kind === "Hold" ? tx.hold : tx.show} · ${shortDate(row.show_date)}`,
  };
}

function venueSpecs(v: VenueRow, locale: Locale): { k: string; v: string }[] {
  const tx = tourMessages(locale).data;
  const specs: Array<[string, string | null]> = [
    [tx.specStage, v.stage_width_m && v.stage_depth_m ? `${v.stage_width_m} × ${v.stage_depth_m} m` : null],
    [tx.specFoh, v.has_foh_console ? [v.foh_console_brand, v.foh_console_model].filter(Boolean).join(" ") || tx.yes : null],
    [tx.specPa, v.has_pa ? [v.pa_brand, v.pa_model].filter(Boolean).join(" ") || tx.yes : null],
    [tx.specMonitors, v.floor_monitors_count ? String(v.floor_monitors_count) : null],
    [tx.specPower, fillText(tx.specPowerValue, { volts: v.power_voltage, outlets: v.power_outlets_stage })],
    [tx.specDock, v.has_loading_dock ? tx.yes : tx.no],
    [tx.specCurfew, v.curfew_time ? hhmm(v.curfew_time) : null],
  ];
  return specs.filter((s): s is [string, string] => Boolean(s[1])).map(([k, val]) => ({ k, v: val }));
}

export type NoteWithAuthor = Pick<TourNoteRow, "body" | "created_at"> & {
  author?: { display_name: string } | { display_name: string }[] | null;
};

/** meta = "Autor · mié 28 oct", como el "Phil G. · hace 2 h" del prototipo pero sin tiempo relativo. */
export function mapNote(row: NoteWithAuthor, origen?: string, locale: Locale = DEFAULT_LOCALE): NoteEntry {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  const meta = [author?.display_name, shortDateLabel(row.created_at.slice(0, 10), locale)].filter(Boolean).join(" · ");
  return { body: row.body, meta, ...(origen ? { origen } : {}) };
}

/** Referencia en vivo (0007): visto ≠ vigente → "revisar"; sin versión subida → "nuevo". */
export function docStatus(currentVersionId: string | null, seenVersionId: string | null | undefined): FileStatus {
  if (!currentVersionId) return "nuevo";
  if (seenVersionId === undefined || seenVersionId === currentVersionId) return "vigente";
  return "revisar";
}

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
export function mapRoster(rows: RosterRow[], rooms: HotelRoomAssignmentRow[], locale: Locale = DEFAULT_LOCALE): RosterPerson[] {
  const tx = tourMessages(locale).data;
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
    const name = row.crew_member?.full_name ?? tx.noName;
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
      reports: boss ? fillText(tx.reportsTo, { name: boss }) : tx.tourRoot,
      scope: tx[`role_${row.member_role}`],
      tel: row.crew_member?.phone ?? "",
      email: row.crew_member?.email ?? "",
      hotel: room?.hotel_name ?? "",
      room: room?.room_number ?? "",
      roomScope: (room?.default_scope ?? "self") as RoomScope,
      roomHidden: !room,
      onSite: row.status === "confirmed",
      note: "",
    };
  });
}
