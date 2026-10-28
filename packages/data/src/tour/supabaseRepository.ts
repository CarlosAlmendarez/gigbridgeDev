import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DocFile,
  Guest,
  GuestStatus,
  SetlistRow,
  HotelRoomAssignmentRow,
  LaborCallRow,
  TourDate,
  TourDateRow,
  TourNoteRow,
  TourVehicleRow,
  VenueRow,
} from "@gigbridge/types";
import {
  docStatus,
  mapNote,
  mapRoster,
  mapTourDate,
  type DateExtras,
  type LaborCallWithDept,
  shortDateLabel,
  type NoteWithAuthor,
  type RosterRow,
} from "./mappers";
import type { TourRepository, TourScope } from "./repository";

/**
 * Implementación del TourRepository sobre las tablas reales (0006/0007).
 * No re-aplica permisos: lee con el cliente que recibe, así que con el
 * cliente de sesión la RLS ya filtró lo que el usuario puede ver (cuartos
 * de hotel incluidos, 0013). NO pasarle el cliente service role.
 *
 * Cada fecha del listado se arma con lo mínimo para el date strip y los
 * pendientes; getTourDate trae además labor, cuartos, documentos y notas.
 */

// documents.current_version_id → document_versions es una de dos relaciones
// entre esas tablas; el nombre del FK desambigua el embed.
const DOC_COLUMNS =
  "id, title, current_version_id, document_type:document_types(label), current_version:document_versions!documents_current_version_fkey(file_url, version_number)";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DateWithVenue = TourDateRow & { venue: VenueRow | null };

// PostgREST devuelve un embed 1:1 (setlists.tour_date_id es unique) como
// objeto, pero uno 1:N como arreglo; normaliza ambos.
function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function fail(what: string, error: { message: string }): never {
  throw new Error(`Supabase (${what}): ${error.message}`);
}

/**
 * Fecha con la que abre la app: la próxima (o de hoy) entre todas las giras
 * que la RLS deja ver al usuario; si ya pasaron todas, la más reciente.
 * `today` es YYYY-MM-DD.
 */
export async function findOpeningTourDateId(client: SupabaseClient, today: string): Promise<string | null> {
  const upcoming = await client.from("tour_dates").select("id").gte("show_date", today).order("show_date").limit(1);
  if (upcoming.error) fail("tour_dates", upcoming.error);
  if (upcoming.data?.[0]) return upcoming.data[0].id as string;
  const latest = await client.from("tour_dates").select("id").order("show_date", { ascending: false }).limit(1);
  if (latest.error) fail("tour_dates", latest.error);
  return (latest.data?.[0]?.id as string | undefined) ?? null;
}

export interface MyTour {
  id: string;
  name: string;
  bandName: string;
  status: string;
  firstDate: string | null;
  lastDate: string | null;
  datesCount: number;
  /** Fecha con la que abrir la gira: la próxima, o la última si ya pasaron todas. */
  openDateId: string | null;
}

/** Giras que la RLS deja ver al usuario (las suyas como miembro o creador), para el inicio. */
export async function listMyTours(client: SupabaseClient, today: string): Promise<MyTour[]> {
  const { data, error } = await client
    .from("tours")
    .select("id, name, status, band:bands(name), tour_dates(id, show_date)")
    .order("start_date", { ascending: true, nullsFirst: false });
  if (error) fail("tours", error);
  return ((data ?? []) as unknown as Array<{
    id: string;
    name: string;
    status: string;
    band: { name: string } | { name: string }[] | null;
    tour_dates: { id: string; show_date: string }[];
  }>).map((t) => {
    const dates = t.tour_dates.slice().sort((a, b) => a.show_date.localeCompare(b.show_date));
    const open = dates.find((d) => d.show_date >= today) ?? dates.at(-1) ?? null;
    return {
      id: t.id,
      name: t.name,
      bandName: first(t.band)?.name ?? "",
      status: t.status,
      firstDate: dates[0]?.show_date ?? null,
      lastDate: dates.at(-1)?.show_date ?? null,
      datesCount: dates.length,
      openDateId: open?.id ?? null,
    };
  });
}

export function createSupabaseTourRepository(client: SupabaseClient, scope: TourScope): TourRepository {
  let tourIdPromise: Promise<string | null> | null = null;

  function resolveTourId(): Promise<string | null> {
    if ("tourId" in scope) return Promise.resolve(UUID_RE.test(scope.tourId) ? scope.tourId : null);
    tourIdPromise ??= (async () => {
      if (!UUID_RE.test(scope.dateId)) return null;
      const { data, error } = await client.from("tour_dates").select("tour_id").eq("id", scope.dateId).maybeSingle();
      if (error) fail("tour_dates", error);
      return (data?.tour_id as string | undefined) ?? null;
    })();
    return tourIdPromise;
  }

  async function fetchDates(tourId: string) {
    const { data, error } = await client
      .from("tour_dates")
      .select("*, venue:venues(*), setlists(songs), labor_calls(id, call_time, headcount, position_title), tour_date_document_refs(id)")
      .eq("tour_id", tourId)
      .order("show_date")
      .order("sequence_order", { nullsFirst: false });
    if (error) fail("tour_dates", error);
    return (data ?? []) as Array<
      DateWithVenue & {
        setlists: { songs: unknown[] } | { songs: unknown[] }[] | null;
        labor_calls: LaborCallRow[];
        tour_date_document_refs: { id: string }[];
      }
    >;
  }

  // Número de show ("Show 07 / 14"): solo cuentan fechas con venue y no en hold.
  function positions(dates: DateWithVenue[]) {
    const shows = dates.filter((d) => d.venue_id && d.status !== "hold" && d.status !== "cancelled");
    return (d: DateWithVenue) => ({
      showNumber: shows.indexOf(d) >= 0 ? shows.indexOf(d) + 1 : null,
      totalShows: shows.length,
    });
  }

  async function fetchDocs(dateId: string, venueId: string | null): Promise<{ docs: DocFile[]; venueDocs: DocFile[] }> {
    const [refs, venueDocs] = await Promise.all([
      client
        .from("tour_date_document_refs")
        .select(`seen_version_id, document:documents(${DOC_COLUMNS})`)
        .eq("tour_date_id", dateId),
      venueId
        ? client
            .from("documents")
            .select(DOC_COLUMNS)
            .eq("owner_type", "venue")
            .eq("owner_id", venueId)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (refs.error) fail("tour_date_document_refs", refs.error);
    if (venueDocs.error) fail("documents", venueDocs.error);

    type One<T> = T | T[] | null;
    type Doc = {
      id: string;
      title: string;
      current_version_id: string | null;
      document_type: One<{ label: string }>;
      current_version: One<{ file_url: string; version_number: number }>;
    };
    const toFile = (doc: Doc, seen?: string | null): DocFile => {
      const version = first(doc.current_version);
      return {
        documentId: doc.id,
        url: version?.file_url,
        name: doc.title,
        kind: "pdf",
        meta: [first(doc.document_type)?.label, version ? `v${version.version_number}` : null].filter(Boolean).join(" · "),
        status: docStatus(doc.current_version_id, seen),
      };
    };

    return {
      docs: ((refs.data ?? []) as unknown as Array<{ seen_version_id: string | null; document: Doc | Doc[] | null }>)
        .map((r) => {
          const doc = first(r.document);
          return doc ? toFile(doc, r.seen_version_id) : null;
        })
        .filter((d): d is DocFile => d !== null),
      venueDocs: ((venueDocs.data ?? []) as unknown as Doc[]).map((d) => toFile(d)),
    };
  }

  return {
    async listTourDates() {
      const tourId = await resolveTourId();
      if (!tourId) return [];
      const dates = await fetchDates(tourId);
      const pos = positions(dates);
      return dates.map((d) =>
        mapTourDate(d, d.venue, pos(d), {
          laborCalls: d.labor_calls ?? [],
          setlistSongs: first(d.setlists)?.songs.length ?? null,
          hotelRooms: [],
          // Para el date strip basta saber cuántas referencias hay; el
          // status real de cada documento se calcula en getTourDate.
          docs: (d.tour_date_document_refs ?? []).map(() => ({ name: "", kind: "pdf", meta: "", status: "vigente" })),
          venueDocs: [],
          dateNotes: [],
          venueNotes: [],
        })
      );
    },

    async getTourDate(dateId): Promise<TourDate | null> {
      if (!UUID_RE.test(dateId)) return null;
      const tourId = await resolveTourId();
      if (!tourId) return null;

      const dates = await fetchDates(tourId);
      const date = dates.find((d) => d.id === dateId);
      if (!date) return null;

      const [labor, rooms, notes, docs] = await Promise.all([
        client.from("labor_calls").select("*, department:departments(name)").eq("tour_date_id", dateId),
        client.from("hotel_room_assignments").select("*").eq("tour_date_id", dateId),
        client
          .from("tour_notes")
          .select("entity_type, entity_id, body, created_at, author:profiles(display_name)")
          .eq("tour_id", tourId)
          .in("entity_type", ["tour_date", "venue"])
          .order("created_at", { ascending: false }),
        fetchDocs(dateId, date.venue_id),
      ]);
      if (labor.error) fail("labor_calls", labor.error);
      if (rooms.error) fail("hotel_room_assignments", rooms.error);
      if (notes.error) fail("tour_notes", notes.error);

      const noteRows = (notes.data ?? []) as unknown as Array<Pick<TourNoteRow, "entity_type" | "entity_id"> & NoteWithAuthor>;
      const extras: DateExtras = {
        laborCalls: (labor.data ?? []) as LaborCallWithDept[],
        setlistSongs: first(date.setlists)?.songs.length ?? null,
        hotelRooms: (rooms.data ?? []) as HotelRoomAssignmentRow[],
        ...docs,
        dateNotes: noteRows.filter((n) => n.entity_type === "tour_date" && n.entity_id === dateId).map((n) => mapNote(n)),
        venueNotes: noteRows
          .filter((n) => n.entity_type === "venue" && n.entity_id === date.venue_id)
          .map((n) => mapNote(n, date.venue?.name)),
      };
      return mapTourDate(date, date.venue, positions(dates)(date), extras);
    },

    async listRoster() {
      const tourId = await resolveTourId();
      if (!tourId) return [];
      const dateId = "dateId" in scope && UUID_RE.test(scope.dateId) ? scope.dateId : null;
      const [crew, rooms] = await Promise.all([
        client
          .from("tour_crew")
          .select(
            "id, crew_member_id, member_role, reports_to, party, status, crew_member:crew_members(full_name, phone, email, user_id), role:roles(name, department:departments(name))"
          )
          .eq("tour_id", tourId)
          .neq("status", "denied"),
        dateId
          ? client.from("hotel_room_assignments").select("*").eq("tour_date_id", dateId)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (crew.error) fail("tour_crew", crew.error);
      if (rooms.error) fail("hotel_room_assignments", rooms.error);
      return mapRoster((crew.data ?? []) as unknown as RosterRow[], (rooms.data ?? []) as HotelRoomAssignmentRow[]);
    },

    async listGuests() {
      const tourId = await resolveTourId();
      if (!tourId) return {};
      const { data, error } = await client
        .from("guest_list_entries")
        .select("id, tour_date_id, guest_name, status, created_at, tour_date:tour_dates!inner(tour_id), author:profiles(display_name)")
        .eq("tour_date.tour_id", tourId)
        .order("created_at");
      if (error) fail("guest_list_entries", error);

      const byDate: Record<string, Guest[]> = {};
      for (const g of (data ?? []) as unknown as Array<{
        id: string;
        tour_date_id: string;
        guest_name: string;
        status: GuestStatus;
        author: { display_name: string } | { display_name: string }[] | null;
      }>) {
        const author = first(g.author)?.display_name;
        (byDate[g.tour_date_id] ??= []).push({
          id: g.id,
          name: g.guest_name,
          by: author ? `Agregado por ${author}` : "Agregado por el equipo",
          status: g.status,
        });
      }
      return byDate;
    },

    async getSetlist(dateId) {
      if (!UUID_RE.test(dateId)) return [];
      const { data, error } = await client.from("setlists").select("songs").eq("tour_date_id", dateId).maybeSingle();
      if (error) fail("setlists", error);
      return ((data?.songs ?? []) as SetlistRow["songs"])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => ({ title: s.title, len: s.len ?? "", cue: s.cue ?? "" }));
    },

    async listTourNotes() {
      const tourId = await resolveTourId();
      if (!tourId) return [];
      const [notes, dates] = await Promise.all([
        client
          .from("tour_notes")
          .select("entity_type, entity_id, body, created_at, author:profiles(display_name)")
          .eq("tour_id", tourId)
          .in("entity_type", ["tour_date", "venue"])
          .order("created_at", { ascending: false }),
        client.from("tour_dates").select("id, show_date, venue_id, venue:venues(name)").eq("tour_id", tourId),
      ]);
      if (notes.error) fail("tour_notes", notes.error);
      if (dates.error) fail("tour_dates", dates.error);

      const dateLabel = new Map((dates.data ?? []).map((d) => [d.id as string, shortDateLabel(d.show_date as string)]));
      const venueName = new Map(
        (dates.data ?? []).filter((d) => d.venue_id).map((d) => [d.venue_id as string, first(d.venue as unknown as { name: string } | { name: string }[] | null)?.name ?? ""])
      );
      return ((notes.data ?? []) as unknown as Array<Pick<TourNoteRow, "entity_type" | "entity_id"> & NoteWithAuthor>).map((n) => {
        const origen =
          n.entity_type === "venue" ? `Lugar · ${venueName.get(n.entity_id) ?? "venue"}` : `Fecha · ${dateLabel.get(n.entity_id) ?? ""}`;
        return { ...mapNote(n), origen };
      });
    },

    async getTourSummary() {
      const tourId = await resolveTourId();
      if (!tourId) return null;
      const [tour, count] = await Promise.all([
        client.from("tours").select("id, name, band:bands(name)").eq("id", tourId).maybeSingle(),
        client.from("tour_dates").select("id", { count: "exact", head: true }).eq("tour_id", tourId),
      ]);
      if (tour.error) fail("tours", tour.error);
      if (!tour.data) return null;
      const band = first(tour.data.band as unknown as { name: string } | { name: string }[] | null)?.name;
      const n = count.count ?? 0;
      return {
        id: tour.data.id as string,
        name: tour.data.name as string,
        bandLine: [band, `${n} ${n === 1 ? "fecha" : "fechas"}`].filter(Boolean).join(" · "),
      };
    },

    async listVehicles() {
      const tourId = await resolveTourId();
      if (!tourId) return [];
      const { data, error } = await client
        .from("tour_vehicles")
        .select("id, label, vehicle_type, load_order")
        .eq("tour_id", tourId)
        .order("load_order", { nullsFirst: false });
      if (error) fail("tour_vehicles", error);
      const TYPE: Record<string, string> = { truck: "Tráiler", bus: "Autobús", van: "Van" };
      return ((data ?? []) as Array<Pick<TourVehicleRow, "id" | "label" | "vehicle_type">>).map((v) => ({
        id: v.id,
        label: v.label,
        meta: v.vehicle_type ? TYPE[v.vehicle_type] : "",
      }));
    },

    // Sin tabla todavía (ver header de repository.ts).
    listVacancies: async () => [],
    listProviders: async () => [],
    listExternalContacts: async () => [],
  };
}
