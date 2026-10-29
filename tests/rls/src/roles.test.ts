import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addDateNote,
  addGuestEntry,
  addTourReminder,
  createSupabaseTourRepository,
  createTour,
  dismissTourReminder,
  uploadTourDateDocument,
} from "@gigbridge/data";
import { createFixture, type Fixture } from "./fixture";

/**
 * Matriz de permisos por rol en la gira (0015) y las tablas del
 * directorio, itinerario y recordatorios (0016), leídas y escritas con la
 * sesión de cada actor — el mismo camino que la app.
 */

let f: Fixture;
const createdTours: string[] = [];
const createdDocs: string[] = [];

beforeAll(async () => {
  f = await createFixture();
  await Promise.all([
    f.admin.from("venue_contacts").insert([
      { venue_id: f.venueId, name: "Rocío Producción", role: "Producción", phone: "+52 81 1842 0117", sort_order: 1 },
      { venue_id: f.venueId, name: "Seguridad", role: "Jefe de seguridad", email: "seg@example.test", sort_order: 2 },
    ]),
    f.admin.from("tour_contacts").insert({ tour_id: f.tourId, contact_type: "promoter", name: "Promotor RLS", phone: "+52 55 0000 0000" }),
    f.admin.from("tour_providers").insert([
      { tour_id: f.tourId, bucket: "general", name: "Backline General", service: "Backline" },
      { tour_id: f.tourId, venue_id: f.venueId, bucket: "recinto", name: "Audio del Recinto", service: "Audio", email: "audio@example.test" },
    ]),
    f.admin.from("tour_travel_legs").insert({
      tour_date_id: f.travelDateId,
      kind: "flight",
      title: "PHX → DEN",
      departs_at: "07:40",
      details: "6 pax",
      sort_order: 1,
    }),
  ]);
});

afterAll(async () => {
  if (createdDocs.length) {
    await f.admin.storage.from("documents").remove(createdDocs.map((id) => `tour_date/${f.tourDateId}/${id}/v1.pdf`));
    await f.admin.from("documents").delete().in("id", createdDocs);
  }
  if (createdTours.length) await f.admin.from("tours").delete().in("id", createdTours);
  await f?.cleanup();
});

describe("invitado de la gira (guest): solo lectura", () => {
  it("no ve ni llena la lista de invitados; un miembro sí", async () => {
    await addGuestEntry(f.actors.soundA.client, { tourDateId: f.tourDateId, name: "Visible para el crew" });
    const { data: asGuest } = await f.actors.guest.client.from("guest_list_entries").select("id").eq("tour_date_id", f.tourDateId);
    expect(asGuest ?? []).toHaveLength(0);
    expect((await addGuestEntry(f.actors.guest.client, { tourDateId: f.tourDateId, name: "x" })).ok).toBe(false);
  });

  it("lee las notas pero no publica", async () => {
    expect((await addDateNote(f.actors.soundA.client, { tourDateId: f.tourDateId, target: "tour_date", body: "Para todos" })).ok).toBe(true);
    expect((await addDateNote(f.actors.guest.client, { tourDateId: f.tourDateId, target: "tour_date", body: "x" })).ok).toBe(false);
    const date = await createSupabaseTourRepository(f.actors.guest.client, { dateId: f.tourDateId }).getTourDate(f.tourDateId);
    expect(date?.show.notes.map((n) => n.body)).toContain("Para todos");
  });

  it("no ve el directorio externo ni los proveedores", async () => {
    const repo = createSupabaseTourRepository(f.actors.guest.client, { dateId: f.tourDateId });
    expect(await repo.listProviders()).toEqual([]);
    expect((await repo.listExternalContacts()).filter((c) => c.type !== "Recinto")).toEqual([]);
  });
});

describe("jefe de departamento (dept_head)", () => {
  it("captura labor calls de su departamento, no de otro; un miembro no captura", async () => {
    const row = (department_id: string) => ({ tour_date_id: f.tourDateId, department_id, position_title: "Audio local", call_time: "13:00" });
    expect((await f.actors.soundHead.client.from("labor_calls").insert(row(f.departments.sonido))).error).toBeNull();
    expect((await f.actors.soundHead.client.from("labor_calls").insert(row(f.departments.luces))).error).not.toBeNull();
    expect((await f.actors.soundA.client.from("labor_calls").insert(row(f.departments.sonido))).error).not.toBeNull();
  });

  it("da de alta vacantes de su departamento, no de otro", async () => {
    const vac = (department_id: string) => ({ tour_id: f.tourId, role_title: "Monitorista", department_id, party: "B" });
    expect((await f.actors.soundHead.client.from("tour_vacancies").insert(vac(f.departments.sonido))).error).toBeNull();
    expect((await f.actors.soundHead.client.from("tour_vacancies").insert(vac(f.departments.luces))).error).not.toBeNull();
    const vacancies = await createSupabaseTourRepository(f.actors.guest.client, { dateId: f.tourDateId }).listVacancies();
    expect(vacancies).toEqual([{ role: "Monitorista", party: "B", team: "Management" }]);
  });

  it("el encabezado trae el rol de cada quien", async () => {
    const role = async (name: keyof Fixture["actors"]) =>
      (await createSupabaseTourRepository(f.actors[name].client, { dateId: f.tourDateId }).getTourSummary())?.viewerRole;
    expect(await role("owner")).toBe("admin");
    expect(await role("coAdmin")).toBe("admin");
    expect(await role("soundHead")).toBe("dept_head");
    expect(await role("soundA")).toBe("member");
    expect(await role("guest")).toBe("guest");
  });
});

describe("directorio, contactos del venue e itinerario (0016)", () => {
  it("el crew ve los contactos de un venue no público; el primero con teléfono es el 'Llamar a'", async () => {
    const date = await createSupabaseTourRepository(f.actors.soundA.client, { dateId: f.tourDateId }).getTourDate(f.tourDateId);
    expect(date?.venue.contacts.map((c) => c.name)).toEqual(["Rocío Producción", "Seguridad"]);
    expect(date?.tel).toBe("tel:+528118420117");
    expect(date?.telLabel).toBe("Producción");
    const { data } = await f.actors.outsider.client.from("venue_contacts").select("id").eq("venue_id", f.venueId);
    expect(data ?? []).toHaveLength(0);
  });

  it("proveedores: los generales y los del venue de la fecha; el día sin venue solo los generales", async () => {
    const show = await createSupabaseTourRepository(f.actors.soundA.client, { dateId: f.tourDateId }).listProviders();
    expect(show.map((p) => `${p.name}/${p.bucket}/${p.email}`)).toEqual([
      "Audio del Recinto/recinto/audio@example.test",
      "Backline General/general/—",
    ]);
    const travel = await createSupabaseTourRepository(f.actors.soundA.client, { dateId: f.travelDateId }).listProviders();
    expect(travel.map((p) => p.name)).toEqual(["Backline General"]);
  });

  it("contactos externos: venue + directorio, con las llaves de tipo que traduce la UI", async () => {
    const contacts = await createSupabaseTourRepository(f.actors.soundA.client, { dateId: f.tourDateId }).listExternalContacts();
    expect(contacts.map((c) => `${c.type}/${c.name}`)).toEqual(["Recinto/Rocío Producción", "Recinto/Seguridad", "Promotor/Promotor RLS"]);
  });

  it("un miembro no edita el directorio; un admin sí", async () => {
    const row = { tour_id: f.tourId, name: "Hotel RLS", contact_type: "hotel" };
    expect((await f.actors.soundA.client.from("tour_contacts").insert(row)).error).not.toBeNull();
    expect((await f.actors.coAdmin.client.from("tour_contacts").insert(row)).error).toBeNull();
  });

  it("itinerario: vuelos de la fecha en el day sheet", async () => {
    const date = await createSupabaseTourRepository(f.actors.guest.client, { dateId: f.travelDateId }).getTourDate(f.travelDateId);
    expect(date?.itinerary).toEqual([{ icon: "airplane-takeoff", title: "PHX → DEN · 07:40", meta: "6 pax", note: "" }]);
  });
});

describe("recordatorios (0016)", () => {
  it("se guardan en la hora local de la fecha; la madrugada cuenta como el día siguiente", async () => {
    const a = await addTourReminder(f.actors.soundA.client, { tourDateId: f.tourDateId, at: "21:00", message: "Salida" });
    const b = await addTourReminder(f.actors.soundA.client, { tourDateId: f.tourDateId, at: "00:15", message: "Load-out" });
    if (!a.ok || !b.ok) throw new Error("no se guardaron");
    const { data } = await f.admin.from("reminders").select("id, remind_at").in("id", [a.result.id, b.result.id]).order("remind_at");
    // El venue del fixture está en America/Phoenix (UTC-7, sin horario de verano).
    expect(data?.map((r) => new Date(r.remind_at).toISOString())).toEqual(["2026-11-21T04:00:00.000Z", "2026-11-21T07:15:00.000Z"]);

    const mine = await createSupabaseTourRepository(f.actors.soundA.client, { dateId: f.tourDateId }).listMyReminders(f.tourDateId);
    expect(mine.map((r) => `${r.at} ${r.message}`)).toEqual(["21:00 Salida", "00:15 Load-out"]);
    expect(await createSupabaseTourRepository(f.actors.soundB.client, { dateId: f.tourDateId }).listMyReminders(f.tourDateId)).toEqual([]);

    expect((await dismissTourReminder(f.actors.soundB.client, { reminderId: a.result.id })).ok).toBe(false);
    expect((await dismissTourReminder(f.actors.soundA.client, { reminderId: a.result.id })).ok).toBe(true);
    const after = await createSupabaseTourRepository(f.actors.soundA.client, { dateId: f.tourDateId }).listMyReminders(f.tourDateId);
    expect(after.map((r) => r.message)).toEqual(["Load-out"]);
  });

  it("valida la hora antes de escribir", async () => {
    const res = await addTourReminder(f.actors.soundA.client, { tourDateId: f.tourDateId, at: "25:00", message: "x" });
    expect(res).toEqual({ ok: false, message: "Elige una hora válida y escribe el recordatorio." });
  });
});

describe("alta de giras", () => {
  it("nadie crea una gira a nombre de una banda ajena", async () => {
    const { data: band } = await f.admin.from("tours").select("band_id").eq("id", f.tourId).single();
    const { error } = await f.actors.soundA.client
      .from("tours")
      .insert({ band_id: band!.band_id, name: "Ajena", created_by: f.actors.soundA.profileId });
    expect(error).not.toBeNull();
  });

  it("un manager crea su gira con su primera fecha y queda como admin", async () => {
    await f.admin.from("bands").insert({ profile_id: f.actors.outsider.profileId, name: "Banda del manager" });
    const res = await createTour(f.actors.outsider.client, { name: "Gira nueva", startDate: "2027-02-01" });
    if (!res.ok) throw new Error(res.message);
    createdTours.push(res.result.tourId);
    const repo = createSupabaseTourRepository(f.actors.outsider.client, { dateId: res.result.dateId });
    expect(await repo.getTourSummary()).toMatchObject({ name: "Gira nueva", viewerRole: "admin" });
    expect((await repo.listTourDates()).map((d) => d.id)).toEqual([res.result.dateId]);
  });
});

describe("subida de documentos a la fecha", () => {
  const pdf = new TextEncoder().encode("%PDF-1.4\n%RLS\n").buffer as ArrayBuffer;
  const file = { type: "application/pdf", size: pdf.byteLength, bytes: pdf };

  it("un miembro no puede subir", async () => {
    const res = await uploadTourDateDocument(f.actors.soundA.client, f.admin, {
      tourDateId: f.tourDateId,
      title: "Patch",
      typeKey: "patch_list",
      file,
    });
    expect(res).toEqual({ ok: false, message: "Solo los admins y jefes de departamento de la gira pueden subir documentos." });
  });

  it("un jefe de departamento sube y queda vigente en la fecha, con su URL", async () => {
    const res = await uploadTourDateDocument(f.actors.soundHead.client, f.admin, {
      tourDateId: f.tourDateId,
      title: "Patch list RLS",
      typeKey: "patch_list",
      file,
    });
    if (!res.ok) throw new Error(res.message);
    createdDocs.push(res.result.documentId);
    const date = await createSupabaseTourRepository(f.actors.guest.client, { dateId: f.tourDateId }).getTourDate(f.tourDateId);
    const doc = date?.show.docs.find((d) => d.documentId === res.result.documentId);
    expect(doc).toMatchObject({ name: "Patch list RLS", status: "vigente", meta: "Patch list · v1" });
    expect(doc?.url).toMatch(/\/storage\/v1\/object\/public\/documents\/tour_date\/.+\/v1\.pdf$/);
    expect((await fetch(doc!.url!)).status).toBe(200);
  });

  it("rechaza tipos de archivo no permitidos", async () => {
    const res = await uploadTourDateDocument(f.actors.soundHead.client, f.admin, {
      tourDateId: f.tourDateId,
      title: "x",
      typeKey: "patch_list",
      file: { ...file, type: "text/html" },
    });
    expect(res.ok).toBe(false);
  });
});
