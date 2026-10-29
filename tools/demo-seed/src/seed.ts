import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TourMemberRole, VisibilityScope } from "@gigbridge/types";

/**
 * Carga en el proyecto de Supabase de dev la gira de ejemplo "Norte 2026"
 * (la misma del mock de packages/data/src/tour/mockData.ts, movida a
 * noviembre de 2026 para que caiga en el futuro), con tres cuentas para
 * probar la UI con TOUR_DATA_SOURCE=supabase desde roles distintos.
 *
 * Idempotente: borra la gira demo anterior (cuentas, crew, venues demo y
 * sus documentos) y la vuelve a crear. El catálogo de departamentos/roles
 * se reutiliza, no se borra.
 *
 *   pnpm seed:demo                         contraseña aleatoria (se imprime)
 *   DEMO_PASSWORD=... pnpm seed:demo        contraseña fija
 */

const PRODUCTION_PROJECT_REFS = ["jrchaxyybvcpgjsnhelp"];
const envFile = fileURLToPath(new URL("../../../apps/web/.env.local", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY (apps/web/.env.local)");
const projectRef = new URL(url).hostname.split(".")[0];
if (PRODUCTION_PROJECT_REFS.includes(projectRef)) throw new Error(`El seed demo no corre contra producción (${projectRef})`);

const db: SupabaseClient = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const PASSWORD = process.env.DEMO_PASSWORD ?? `Demo-${randomBytes(6).toString("base64url")}`;

// ── Datos ─────────────────────────────────────────────────────────────

/** Personas con cuenta para entrar a la app. El resto del crew es freelance sin cuenta. */
const LOGINS = {
  "Phil Gutiérrez": "phil.demo@example.test",
  "Dani Berrones": "dani.demo@example.test",
  "Ruth Camarena": "ruth.demo@example.test",
} as const;

const DEPARTMENTS = [
  "Management", "Artista", "Vestuario", "Seguridad", "Stage", "Sonido", "Monitores", "Radiofrecuencia", "Luces",
  "Video", "Backline", "Playback", "Carpintería", "Rigging", "Choferes", "Catering", "Booking", "Legal",
];

type Person = {
  name: string;
  role: string;
  dept: string;
  party: "A" | "B" | "C";
  reportsTo: string | null;
  memberRole: TourMemberRole;
  tel: string;
  email: string;
  hotel: "Ancira" | "Fastos" | null;
  room: string | null;
  scope: VisibilityScope;
  onSite: boolean;
};

// [nombre, rol, depto, party, reporta a, rol en la gira, tel, email, hotel, cuarto, scope, en sitio]
const ROSTER: Person[] = (
  [
    ["Phil Gutiérrez", "Tour Manager", "Management", "C", null, "admin", "+528118420100", "phil@bestiasdelvalle.mx", "Ancira", "512", "tour_all", true],
    ["Juan C. Cisneros", "Production Manager", "Management", "C", "Phil Gutiérrez", "admin", "+528118420101", "jc@bestiasdelvalle.mx", "Ancira", "510", "tour_all", true],
    ["Lucía Bernal", "Road Manager", "Management", "C", "Phil Gutiérrez", "member", "+528118420105", "lucia@bestiasdelvalle.mx", "Ancira", "508", "tour_all", true],
    ["Dani Berrones", "Stage Manager", "Stage", "C", "Juan C. Cisneros", "dept_head", "+528118420102", "dani@bestiasdelvalle.mx", "Ancira", "405", "department", true],
    ["Memo Villarreal", "FOH · ingeniero de sonido", "Sonido", "C", "Dani Berrones", "member", "+528118420118", "memo@sonidosierra.mx", "Ancira", "402", "self", true],
    ["Chava Domínguez", "Patch Master", "Sonido", "C", "Memo Villarreal", "member", "+528118420103", "chava.patch@correo.mx", "Ancira", "401", "self", true],
    ["Tania Ruelas", "Monitores · in-ear", "Monitores", "B", "Memo Villarreal", "member", "+528118420108", "tania.mon@correo.mx", "Ancira", "403", "self", true],
    ["Ivette Lara", "RF Coordinator", "Radiofrecuencia", "C", "Dani Berrones", "dept_head", "+528118420104", "ivette@rfcentral.mx", "Ancira", "404", "department", true],
    ["Karla Esquivel", "Crew Chief · diseño de luces", "Luces", "C", "Dani Berrones", "member", "+528118420119", "karla@lumennorte.mx", "Ancira", "308", "self", true],
    ["Pepe Rangel", "Operador de luces", "Luces", "C", "Karla Esquivel", "member", "+528118420109", "pepe.luces@correo.mx", "Ancira", "307", "self", true],
    ["Su Ortega", "Directora de cámaras", "Video", "C", "Dani Berrones", "member", "+528118420123", "su@pantallafria.mx", "Ancira", "306", "self", true],
    ["Nacho Peña", "Crew Chief · backline", "Backline", "B", "Dani Berrones", "member", "+523318420120", "nacho@cuerdaviva.mx", "Ancira", "305", "self", true],
    ["Lalo Cruz", "Line Tech · guitarras", "Backline", "B", "Nacho Peña", "member", "+523318420110", "lalo.tech@correo.mx", "Ancira", "304", "self", true],
    ["Pau Ledezma", "Line Tech · batería", "Backline", "B", "Nacho Peña", "member", "+523318420111", "pau.tech@correo.mx", "Ancira", "303", "self", true],
    ["Bruno Alanís", "Playback / MD", "Playback", "B", "Dani Berrones", "dept_head", "+528118420112", "bruno@bestiasdelvalle.mx", "Ancira", "302", "department", true],
    ["Chuy Reyes", "Crew Chief · carpintería", "Carpintería", "C", "Dani Berrones", "member", "+528118420121", "tallerreyes@correo.mx", "Fastos", "118", "self", true],
    ["Ivo Cárdenas", "Crew Chief · rigging", "Rigging", "C", "Dani Berrones", "member", "+525518420122", "ops@alturas.mx", null, null, "self", false],
    ["Sonia del Valle", "Personal Manager", "Artista", "A", "Phil Gutiérrez", "member", "+528118420107", "sonia@bestiasdelvalle.mx", "Ancira", "606", "custom", true],
    ["Ruth Camarena", "Jefa de vestuario", "Vestuario", "A", "Sonia del Valle", "member", "+528118420113", "ruth@bestiasdelvalle.mx", "Ancira", "604", "self", true],
    ["Ximena Pardo", "Glam · maquillaje y pelo", "Vestuario", "A", "Ruth Camarena", "member", "+528118420114", "xime.glam@correo.mx", "Ancira", "603", "self", true],
    ["Aldo Sáenz", "Seguridad del artista", "Seguridad", "A", "Sonia del Valle", "member", "+528118420115", "aldo.seg@correo.mx", "Ancira", "605", "custom", true],
    ["Nadia Quiroz", "Jefa de seguridad de sitio", "Seguridad", "C", "Juan C. Cisneros", "dept_head", "+528118420116", "nadia@muralla.mx", "Ancira", "406", "department", true],
    ["Beto Salinas", "Dockmaster", "Choferes", "C", "Lucía Bernal", "member", "+528118420124", "logistica@fletesdelcerro.mx", "Fastos", "112", "self", true],
    ["Rafa Ponce", "Head Driver", "Choferes", "C", "Beto Salinas", "member", "+528118420106", "rafa@fletesdelcerro.mx", "Fastos", "110", "self", true],
    ["Fer Aguilar", "Catering de gira", "Catering", "C", "Lucía Bernal", "member", "+528118420125", "fer@cocinanomada.mx", "Fastos", "108", "self", true],
    ["Marisol Treviño", "Booking Agent", "Booking", "C", "Phil Gutiérrez", "guest", "+528118420126", "marisol@bookingnorte.mx", null, null, "tour_all", false],
    ["Despacho Nava & Ruiz", "Contratos y cláusulas", "Legal", "C", "Phil Gutiérrez", "guest", "+528118420127", "contratos@navaruiz.mx", null, null, "tour_all", false],
  ] as const
).map(([name, role, dept, party, reportsTo, memberRole, tel, email, hotel, room, scope, onSite]) => ({
  name, role, dept, party, reportsTo, memberRole, tel, email, hotel, room, scope, onSite,
}));

const HOTELS = { Ancira: "Hotel Ancira Centro", Fastos: "Hotel Fastos" } as const;

const VENUES = {
  cantera: {
    slug: "demo-foro-cantera",
    name: "Foro Cantera",
    address: "Av. Constitución 1450, Centro, Monterrey, N.L. 64000",
    city: "Monterrey",
    state_region: "N.L.",
    timezone: "America/Monterrey",
    capacity: 1400,
    website_url: "https://example.com/foro-cantera",
    stage_width_m: 12, stage_depth_m: 9, stage_height_m: 7.5,
    stage_notes: "Consola FOH Avid S6L, 48 canales. Límite de ruido 98 dB a las 23:00.",
    has_pa: true, pa_brand: "L-Acoustics", pa_model: "K2",
    has_foh_console: true, foh_console_brand: "Avid", foh_console_model: "S6L-24D", foh_console_type: "digital", foh_console_channels: 48,
    floor_monitors_count: 12, has_in_ear_system: true,
    power_outlets_stage: 12, power_notes: "3 × 200 A trifásica + planta de respaldo", has_backup_generator: true,
    has_loading_dock: true, curfew_time: "00:30", has_green_room: true, wifi_speed_mbps: 100,
    management_type: "managed", contact_visibility: "tour_members",
  },
  barranca: {
    slug: "demo-salon-barranca",
    name: "Salón Barranca",
    address: "Av. Vallarta 2050, Ladrón de Guevara, Guadalajara, Jal.",
    city: "Guadalajara",
    state_region: "Jal.",
    timezone: "America/Mexico_City",
    capacity: 3200,
    stage_width_m: 16, stage_depth_m: 12, stage_height_m: 10,
    stage_notes: "Falta el plano de rigging firmado; el venue solo trabaja con Alturas MX.",
    has_pa: true, has_foh_console: true, foh_console_brand: "DiGiCo", foh_console_model: "SD12", foh_console_type: "digital",
    floor_monitors_count: 16, has_loading_dock: true, curfew_time: "01:00",
    management_type: "independent", contact_visibility: "verified_pros",
  },
  volcan: {
    slug: "demo-foro-volcan",
    name: "Foro Volcán",
    address: "Calle Volcán 120, Roma Norte, Ciudad de México",
    city: "Ciudad de México",
    state_region: "CDMX",
    timezone: "America/Mexico_City",
    capacity: 900,
    stage_notes: "El perfil del Foro Volcán en GigBridge aún no está reclamado por el venue.",
    management_type: "independent", contact_visibility: "public",
  },
} as const;

const SETLIST_D12 = [
  { title: "Neblina en ruta", len: "4:10", cue: "Intro con secuencia · blackout" },
  { title: "Cerro de la Silla", len: "3:38", cue: "Cue de luces 12" },
  { title: "Carretera 40D", len: "5:02", cue: "Se corta si el show arranca tarde" },
  { title: "La última función", len: "4:44", cue: "Cambio de guitarra acústica" },
  { title: "Patio trasero", len: "3:20", cue: "Versión acústica en esta fecha" },
  { title: "Bestias (encore)", len: "6:15", cue: "Encore · confeti y video" },
];

// ── Helpers ───────────────────────────────────────────────────────────

async function must<T>(label: string, p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<NonNullable<T>> {
  const { data, error } = await p;
  if (error || data == null) throw new Error(`${label}: ${error?.message ?? "sin datos"}`);
  return data as NonNullable<T>;
}

async function findUserIdsByEmail(emails: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    ids.push(...data.users.filter((u) => u.email && emails.includes(u.email)).map((u) => u.id));
    if (data.users.length < 200) return ids;
  }
}

// ── Limpieza de la corrida anterior ───────────────────────────────────

async function cleanup() {
  const userIds = await findUserIdsByEmail(Object.values(LOGINS));
  const { data: profiles } = await db.from("profiles").select("id").in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  const profileIds = (profiles ?? []).map((p) => p.id);
  const { data: tours } = profileIds.length ? await db.from("tours").select("id").in("created_by", profileIds) : { data: [] };
  const tourIds = (tours ?? []).map((t) => t.id);
  const { data: crew } = tourIds.length ? await db.from("tour_crew").select("crew_member_id").in("tour_id", tourIds) : { data: [] };
  const crewIds = (crew ?? []).map((c) => c.crew_member_id);

  // Documentos subidos a fechas desde la app (owner_type 'tour_date'): no
  // cuelgan por FK de la gira, así que se borran a mano con sus archivos.
  const { data: tourDates } = tourIds.length ? await db.from("tour_dates").select("id").in("tour_id", tourIds) : { data: [] };
  const dateIds = (tourDates ?? []).map((d) => d.id as string);
  if (dateIds.length) {
    for (const id of dateIds) {
      const { data: folders } = await db.storage.from("documents").list(`tour_date/${id}`);
      for (const folder of folders ?? []) {
        const { data: files } = await db.storage.from("documents").list(`tour_date/${id}/${folder.name}`);
        const paths = (files ?? []).map((f) => `tour_date/${id}/${folder.name}/${f.name}`);
        if (paths.length) await db.storage.from("documents").remove(paths);
      }
    }
    await db.from("documents").delete().eq("owner_type", "tour_date").in("owner_id", dateIds);
  }

  // Usuario → profile → band → tour → todo lo de la gira (cascade).
  for (const id of userIds) await db.auth.admin.deleteUser(id);
  if (crewIds.length) await db.from("crew_members").delete().in("id", crewIds);

  const slugs = Object.values(VENUES).map((v) => v.slug);
  const { data: venues } = await db.from("venues").select("id").in("slug", slugs);
  const venueIds = (venues ?? []).map((v) => v.id);
  if (venueIds.length) {
    await db.from("documents").delete().eq("owner_type", "venue").in("owner_id", venueIds);
    await db.from("venues").delete().in("id", venueIds);
  }
  return { users: userIds.length, tours: tourIds.length, venues: venueIds.length };
}

// ── Seed ──────────────────────────────────────────────────────────────

async function seed() {
  // Cuentas
  const profileByName = new Map<string, string>();
  const userByName = new Map<string, string>();
  for (const [name, email] of Object.entries(LOGINS)) {
    const user = await must(
      `cuenta ${email}`,
      db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true }).then((r) => ({ data: r.data.user, error: r.error }))
    );
    const slug = `demo-${email.split(".")[0]}`;
    const profile = await must(
      `profile ${name}`,
      db.from("profiles").insert({ user_id: user.id, slug, display_name: name, role: "manager" }).select("id").single()
    );
    userByName.set(name, user.id);
    profileByName.set(name, profile.id);
  }
  const phil = profileByName.get("Phil Gutiérrez")!;

  // Catálogo de departamentos y roles (compartido; se reutiliza si ya existe)
  await must(
    "departments",
    db.from("departments").upsert(DEPARTMENTS.map((name, i) => ({ name, sort_order: i })), { onConflict: "name" }).select("id")
  );
  const depts = await must("departments", db.from("departments").select("id, name").in("name", DEPARTMENTS));
  const deptId = new Map(depts.map((d) => [d.name as string, d.id as string]));

  const existingRoles = await must("roles", db.from("roles").select("id, name, department_id"));
  const roleId = new Map<string, string>();
  for (const p of ROSTER) {
    const key = `${p.dept}/${p.role}`;
    if (roleId.has(key)) continue;
    const found = existingRoles.find((r) => r.name === p.role && r.department_id === deptId.get(p.dept));
    const id =
      found?.id ??
      (await must(
        `rol ${p.role}`,
        db
          .from("roles")
          .insert({ name: p.role, department_id: deptId.get(p.dept), is_department_head: p.memberRole === "dept_head" })
          .select("id")
          .single()
      )).id;
    roleId.set(key, id);
  }

  // Banda, venues, gira, fechas
  const band = await must(
    "band",
    db.from("bands").insert({ profile_id: phil, name: "Las Bestias del Valle", genre: "Rock" }).select("id").single()
  );
  const venueId: Record<keyof typeof VENUES, string> = {} as never;
  for (const [key, v] of Object.entries(VENUES) as [keyof typeof VENUES, (typeof VENUES)[keyof typeof VENUES]][]) {
    venueId[key] = (await must(`venue ${v.name}`, db.from("venues").insert({ ...v, owner_id: null, claim_status: "unclaimed" }).select("id").single())).id;
  }
  const tour = await must(
    "tour",
    db
      .from("tours")
      .insert({ band_id: band.id, name: "Norte 2026", status: "active", region: "Norte", start_date: "2026-11-13", end_date: "2026-11-17", created_by: phil })
      .select("id")
      .single()
  );

  // Insert múltiple: PostgREST manda null en columnas ausentes de alguna
  // fila, así que todas las filas llevan las mismas llaves.
  const base = { tour_id: tour.id, doors_time: null, show_time: null, advance_date: null, timezone: null, deal_type: null, guarantee_amount: null };
  const dates = await must(
    "tour_dates",
    db
      .from("tour_dates")
      .insert([
        { ...base, show_date: "2026-11-13", venue_id: null, status: "confirmed", sequence_order: 1, timezone: "America/Monterrey",
          notes: "Saltillo → Monterrey. Salida 09:00 del Hotel Urdiñola, 270 km por la 40D. Los trailers salieron anoche." },
        { ...base, show_date: "2026-11-14", venue_id: venueId.cantera, status: "confirmed", sequence_order: 2, doors_time: "20:00", show_time: "21:30",
          advance_date: "2026-11-04", deal_type: "guarantee", guarantee_amount: 180000, notes: "Salida del hotel 17:15 — lobby, van del road manager." },
        { ...base, show_date: "2026-11-15", venue_id: venueId.barranca, status: "confirmed", sequence_order: 3, doors_time: "19:30", show_time: "21:00",
          advance_date: "2026-11-12", deal_type: "split", notes: "Día doble: el crew de luces llega en el vuelo de las 07:40." },
        { ...base, show_date: "2026-11-17", venue_id: venueId.volcan, status: "hold", sequence_order: 4,
          notes: "Cláusula de radio: 80 km / 30 días alrededor de esta fecha." },
      ])
      .select("id, show_date")
  );
  const dateId = Object.fromEntries(dates.map((d) => [d.show_date as string, d.id as string]));
  const d12 = dateId["2026-11-14"];
  const d13 = dateId["2026-11-15"];

  // Crew y membresías
  const crewIdByName = new Map<string, string>();
  for (const p of ROSTER) {
    const crew = await must(
      `crew ${p.name}`,
      db.from("crew_members").insert({ full_name: p.name, phone: p.tel, email: p.email, user_id: userByName.get(p.name) ?? null }).select("id").single()
    );
    crewIdByName.set(p.name, crew.id);
  }
  const tourCrewIdByName = new Map<string, string>();
  // En orden de ROSTER: cada jefe se inserta antes que quien le reporta.
  for (const p of ROSTER) {
    const tc = await must(
      `tour_crew ${p.name}`,
      db
        .from("tour_crew")
        .insert({
          tour_id: tour.id,
          crew_member_id: crewIdByName.get(p.name),
          role_id: roleId.get(`${p.dept}/${p.role}`),
          member_role: p.memberRole,
          reports_to: p.reportsTo ? tourCrewIdByName.get(p.reportsTo) : null,
          party: p.party,
          status: p.onSite ? "confirmed" : "pending",
        })
        .select("id")
        .single()
    );
    tourCrewIdByName.set(p.name, tc.id);
  }

  // Cuartos del 14 nov (Foro Cantera) y concesión: el party A ve los cuartos 'custom' del artista
  const rooms = await must(
    "hotel_room_assignments",
    db
      .from("hotel_room_assignments")
      .insert(
        ROSTER.filter((p) => p.hotel && p.room).map((p) => ({
          tour_date_id: d12,
          crew_member_id: crewIdByName.get(p.name),
          hotel_name: HOTELS[p.hotel!],
          room_number: p.room,
          check_in: "2026-11-13",
          check_out: "2026-11-15",
          default_scope: p.scope,
        }))
      )
      .select("id, default_scope")
  );
  await must(
    "visibility_grants",
    db
      .from("visibility_grants")
      .insert(
        rooms
          .filter((r) => r.default_scope === "custom")
          .map((r) => ({ tour_id: tour.id, subject_type: "group", subject_id: "A", resource_type: "hotel_room", resource_id: r.id, scope: "custom", granted_by: phil }))
      )
      .select("id")
  );

  // Labor call / montaje
  const labor = (date: string, rows: Array<[string, string, string, number]>) =>
    rows.map(([call_time, position_title, dept, headcount]) => ({
      tour_date_id: date, call_time, position_title, department_id: deptId.get(dept), headcount, end_time: null, notes: null,
    }));
  await must(
    "labor_calls",
    db
      .from("labor_calls")
      .insert([
        ...labor(d12, [
          ["13:30", "Llegada de Dockmaster y apertura de patio", "Choferes", 1],
          ["14:00", "Load-in Truck 2 · audio y backline", "Sonido", 6],
          ["14:30", "Rigging y puntos de vuelo", "Rigging", 4],
          ["15:30", "Piso de luces y patch de dimmer", "Luces", 6],
          ["16:30", "Line check y patch de canales", "Sonido", 2],
          ["17:00", "Prueba de RF e in-ear", "Radiofrecuencia", 1],
          ["18:00", "Soundcheck con banda", "Backline", 3],
          ["19:45", "Barrido de escenario y briefing de seguridad", "Stage", 8],
        ]),
        ...labor(d13, [
          ["08:00", "Load-in Truck 1 · luces y rigging", "Luces", 8],
          ["11:00", "Load-in Truck 2 · audio y backline", "Sonido", 6],
        ]),
      ])
      .select("id")
  );

  await must("setlist", db.from("setlists").insert({ tour_date_id: d12, songs: SETLIST_D12.map((s, i) => ({ order: i + 1, ...s })) }).select("id"));

  await must(
    "guest_list_entries",
    db
      .from("guest_list_entries")
      .insert(
        (
          [
            [d12, "Ana Lucía Robles", "confirmed"],
            [d12, "Prensa — Radio Sierra (2)", "confirmed"],
            [d12, "Toño Márquez", "pending"],
            [d12, "Sofía Cantú +1", "pending"],
            [d12, "Iker Fuentes", "denied"],
            [d13, "Gaby Zepeda", "confirmed"],
            [d13, "Sello Tierra Alta (3)", "pending"],
          ] as const
        ).map(([tour_date_id, guest_name, status]) => ({ tour_date_id, guest_name, status, added_by: phil }))
      )
      .select("id")
  );

  await must(
    "tour_vehicles",
    db
      .from("tour_vehicles")
      .insert([
        { tour_id: tour.id, label: "Truck 2 · audio y backline", vehicle_type: "truck", load_order: 1 },
        { tour_id: tour.id, label: "Truck 1 · luces y rigging", vehicle_type: "truck", load_order: 2 },
        { tour_id: tour.id, label: "Truck 3 · carpintería", vehicle_type: "truck", load_order: 3 },
        { tour_id: tour.id, label: "Bus A · crew", vehicle_type: "bus", load_order: 4 },
      ])
      .select("id")
  );

  await must(
    "tour_notes",
    db
      .from("tour_notes")
      .insert([
        { tour_id: tour.id, entity_type: "venue", entity_id: venueId.cantera, created_by: phil,
          body: "El elevador de carga mide 1.90 m: los racks altos suben por rampa, no por elevador." },
        { tour_id: tour.id, entity_type: "venue", entity_id: venueId.cantera, created_by: phil,
          body: "Pedir por escrito la extensión de curfew a 01:00 para el load-out." },
        { tour_id: tour.id, entity_type: "tour_date", entity_id: d12, created_by: phil,
          body: 'La banda pidió mover "Bestias" al encore y meter versión acústica de "Patio trasero".' },
        { tour_id: tour.id, entity_type: "tour_date", entity_id: d12, created_by: phil,
          body: "El escenario es bajo: el riser de batería se queda en 40 cm, no 60." },
      ])
      .select("id")
  );

  await must(
    "reminders",
    db
      .from("reminders")
      .insert([
        { user_id: phil, tour_date_id: d12, remind_at: "2026-11-14T14:00:00Z", message: "Alarma: llamar al promotor de CDMX" },
        { user_id: phil, tour_date_id: d12, remind_at: "2026-11-14T23:00:00Z", message: "15 min antes de la salida del hotel" },
      ])
      .select("id")
  );

  // Directorio, contactos del venue, vacantes e itinerario (0016). Mismas
  // llaves en cada fila por lo de los inserts múltiples de PostgREST.
  await must(
    "venue_contacts",
    db
      .from("venue_contacts")
      .insert([
        { venue_id: venueId.cantera, name: "Rocío Tamez", role: "Producción del foro", email: "rocio@forocantera.mx", phone: "+52 81 1842 0117", sort_order: 1 },
        { venue_id: venueId.cantera, name: "Héctor Lozano", role: "Jefe de seguridad", email: "seguridad@forocantera.mx", phone: "+52 81 1842 0131", sort_order: 2 },
        { venue_id: venueId.barranca, name: "Mariana Ochoa", role: "Gerente de producción", email: "produccion@salonbarranca.mx", phone: "+52 33 3615 0042", sort_order: 1 },
      ])
      .select("id")
  );
  await must(
    "tour_contacts",
    db
      .from("tour_contacts")
      .insert([
        { tour_id: tour.id, contact_type: "promoter", name: "Gabriel Treviño", role: "Promotor regional · Norte", email: "gabriel@ocesa-norte.mx", phone: "+52 81 1842 0150", note: "Firma los settlements de MTY y GDL." },
        { tour_id: tour.id, contact_type: "hotel", name: "Recepción Ancira", role: "Hotel Ancira Centro", email: "grupos@hotelancira.mx", phone: "+52 81 8150 7000", note: "Bloque de 22 cuartos a nombre de Phil G." },
        { tour_id: tour.id, contact_type: "vendor", name: "Fletes del Cerro", role: "Transporte de crew", email: "rafa@fletesdelcerro.mx", phone: "+52 81 1842 0106", note: null },
      ])
      .select("id")
  );
  await must(
    "tour_providers",
    db
      .from("tour_providers")
      .insert([
        { tour_id: tour.id, venue_id: venueId.cantera, bucket: "recinto", name: "Sonido Sierra", service: "Audio", contact_name: "Iván Sierra", city: "Monterrey", email: "ivan@sonidosierra.mx", phone: "+52 81 1842 0160", note: "Único proveedor de PA autorizado por el foro." },
        { tour_id: tour.id, venue_id: venueId.cantera, bucket: "local", name: "Lumen Norte", service: "Iluminación", contact_name: "Karla Esquivel", city: "Monterrey", email: "karla@lumennorte.mx", phone: "+52 81 1842 0119", note: "Renta de emergencia: 2 h de respuesta." },
        { tour_id: tour.id, venue_id: venueId.cantera, bucket: "vetado", name: "Grúas Express", service: "Rigging", contact_name: null, city: "Monterrey", email: null, phone: null, note: "Vetado por el foro tras un incidente en 2025." },
        { tour_id: tour.id, venue_id: null, bucket: "general", name: "Backline Norte", service: "Backline", contact_name: "Nacho Peña", city: "Monterrey", email: "renta@backlinenorte.mx", phone: "+52 81 1842 0170", note: "Cotiza cualquier fecha de la gira." },
      ])
      .select("id")
  );
  await must(
    "tour_vacancies",
    db
      .from("tour_vacancies")
      .insert([
        { tour_id: tour.id, role_title: "Técnico de monitores", department_id: deptId.get("Monitores") ?? null, party: "B" },
        { tour_id: tour.id, role_title: "Asistente de vestuario", department_id: deptId.get("Vestuario") ?? null, party: "A" },
      ])
      .select("id")
  );
  await must(
    "tour_travel_legs",
    db
      .from("tour_travel_legs")
      .insert([
        { tour_date_id: dateId["2026-11-13"], kind: "ground", title: "Van de crew Saltillo → Monterrey", departs_at: "09:00", details: "8 pax · chofer Rafa Ponce", note: "Parada de comida en Ramos Arizpe, 30 min.", sort_order: 1 },
        { tour_date_id: d12, kind: "ground", title: "Van al aeropuerto", departs_at: "05:15", details: "Lobby del Ancira · chofer Beto Salinas", note: "Sale el día 15.", sort_order: 1 },
        { tour_date_id: d12, kind: "flight", title: "MTY → GDL · VivaAerobús 2218", departs_at: "07:40", details: "6 pax · conf. QK4RT2", note: "Backline viaja por tierra con el Dockmaster.", sort_order: 2 },
      ])
      .select("id")
  );

  // Documentos versionados del venue + referencias de la fecha (0007).
  // El rider del Cantera tiene v2, pero la fecha del 14 vio la v1 → "revisar".
  const types = await must("document_types", db.from("document_types").select("id, key"));
  const typeId = new Map(types.map((t) => [t.key as string, t.id as string]));
  async function venueDoc(venue: string, type: string, title: string, versions: number) {
    const doc = await must(
      `documento ${title}`,
      db.from("documents").insert({ owner_type: "venue", owner_id: venue, document_type_id: typeId.get(type), title, visibility: "tour_members", created_by: phil }).select("id").single()
    );
    const vers = await must(
      `versiones ${title}`,
      db
        .from("document_versions")
        .insert(
          Array.from({ length: versions }, (_, i) => ({
            document_id: doc.id,
            version_number: i + 1,
            file_url: `https://example.com/demo/${encodeURIComponent(title)}/v${i + 1}.pdf`,
            valid_from: i === versions - 1 ? "2026-11-02" : "2026-06-01",
            change_notes: i === 0 ? "Versión inicial" : "Actualización del venue",
            uploaded_by: phil,
          }))
        )
        .select("id, version_number")
        .order("version_number")
    );
    await must("current_version", db.from("documents").update({ current_version_id: vers.at(-1)!.id }).eq("id", doc.id).select("id"));
    return { id: doc.id as string, versions: vers.map((v) => v.id as string) };
  }
  const rider = await venueDoc(venueId.cantera, "rider_tecnico", "Rider técnico del foro", 2);
  const rigging = await venueDoc(venueId.cantera, "rigging_plot", "Plano de escenario y rigging", 1);
  const patch = await venueDoc(venueId.cantera, "patch_list", "Patch list del foro", 1);
  await venueDoc(venueId.cantera, "reglamento_interno", "Reglamento de accesos y curfew", 1);
  const riderBarranca = await venueDoc(venueId.barranca, "rider_tecnico", "Rider técnico Salón Barranca", 1);
  await must(
    "tour_date_document_refs",
    db
      .from("tour_date_document_refs")
      .insert([
        { tour_date_id: d12, document_id: rider.id, seen_version_id: rider.versions[0] },
        { tour_date_id: d12, document_id: rigging.id, seen_version_id: rigging.versions[0] },
        { tour_date_id: d12, document_id: patch.id, seen_version_id: patch.versions[0] },
        { tour_date_id: d13, document_id: riderBarranca.id, seen_version_id: riderBarranca.versions[0] },
      ])
      .select("id")
  );

  return { tourId: tour.id as string, dateIds: dateId };
}

const removed = await cleanup();
console.log(`Limpieza: ${removed.users} cuentas, ${removed.tours} giras, ${removed.venues} venues de la corrida anterior.`);
const { tourId, dateIds } = await seed();
console.log(`\nGira demo "Norte 2026" cargada en ${projectRef} (tour ${tourId}).`);
console.log(`Fechas: ${Object.entries(dateIds).map(([d, id]) => `${d} → ${id}`).join("\n        ")}`);
console.log(`\nCuentas (contraseña: ${PASSWORD}):`);
console.log(`  ${LOGINS["Phil Gutiérrez"]}  Tour Manager · admin, ve todo`);
console.log(`  ${LOGINS["Dani Berrones"]}  Stage Manager · jefe de depto (Stage)`);
console.log(`  ${LOGINS["Ruth Camarena"]}  Vestuario · party A, ve los cuartos del artista por concesión`);
