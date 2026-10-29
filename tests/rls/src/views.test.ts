import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adoptCurrentDocumentVersion,
  createSupabaseTourRepository,
  listMyTours,
  moveTourVehicle,
} from "@gigbridge/data";
import { createFixture, type Fixture } from "./fixture";

/**
 * Lo que alimenta la navegación y la hoja del día: encabezado de la gira,
 * "Mis giras", orden de carga y documentos con referencia en vivo.
 */

let f: Fixture;
let riderId: string;
let riderV1: string;

beforeAll(async () => {
  f = await createFixture();
  await f.admin.from("tour_vehicles").insert([
    { tour_id: f.tourId, label: "Truck A", vehicle_type: "truck", load_order: 1 },
    { tour_id: f.tourId, label: "Truck B", vehicle_type: "truck", load_order: 2 },
    { tour_id: f.tourId, label: "Bus", vehicle_type: "bus", load_order: 3 },
  ]);

  const { data: type } = await f.admin.from("document_types").select("id").eq("key", "rider_tecnico").single();
  const { data: doc } = await f.admin
    .from("documents")
    .insert({ owner_type: "venue", owner_id: f.venueId, document_type_id: type!.id, title: "Rider RLS", visibility: "tour_members" })
    .select("id")
    .single();
  riderId = doc!.id;
  const { data: versions } = await f.admin
    .from("document_versions")
    .insert([
      { document_id: riderId, version_number: 1, file_url: "https://example.com/v1.pdf" },
      { document_id: riderId, version_number: 2, file_url: "https://example.com/v2.pdf" },
    ])
    .select("id, version_number")
    .order("version_number");
  riderV1 = versions![0].id;
  await f.admin.from("documents").update({ current_version_id: versions![1].id }).eq("id", riderId);
  await f.admin.from("tour_date_document_refs").insert({ tour_date_id: f.tourDateId, document_id: riderId, seen_version_id: riderV1 });
});

afterAll(async () => {
  if (riderId) await f.admin.from("documents").delete().eq("id", riderId);
  await f?.cleanup();
});

describe("encabezado y Mis giras", () => {
  it("getTourSummary trae el nombre real y el número de fechas", async () => {
    const summary = await createSupabaseTourRepository(f.actors.guest.client, { dateId: f.tourDateId }).getTourSummary();
    expect(summary?.name).toMatch(/^RLS .* Gira$/);
    expect(summary?.bandLine).toMatch(/RLS .* Banda · 2 fechas/);
  });

  it("un miembro ve su gira en Mis giras, abierta en la próxima fecha; alguien de fuera no", async () => {
    const mine = await listMyTours(f.actors.soundA.client, "2026-11-01");
    const tour = mine.find((t) => t.id === f.tourId);
    expect(tour).toMatchObject({ datesCount: 2, openDateId: f.tourDateId });
    expect((await listMyTours(f.actors.outsider.client, "2026-11-01")).some((t) => t.id === f.tourId)).toBe(false);
  });

  it("si ya pasaron todas las fechas abre la última", async () => {
    const [tour] = (await listMyTours(f.actors.soundA.client, "2027-01-01")).filter((t) => t.id === f.tourId);
    expect(tour.openDateId).toBe(f.travelDateId);
  });
});

describe("idioma", () => {
  it("con locale en, la capa de datos arma los textos en inglés", async () => {
    const repo = createSupabaseTourRepository(f.actors.guest.client, { dateId: f.tourDateId }, "en");
    expect((await repo.getTourSummary())?.bandLine).toMatch(/· 2 dates$/);
    const date = await repo.getTourDate(f.tourDateId);
    expect(date?.dateline).toBe("Fri Nov 20, 2026");
    expect(date?.show.headline.map((h) => h.label)).toEqual(["Load-in", "Doors", "Show", "Local crew"]);
  });

  it("los rechazos de las mutaciones salen en el idioma pedido", async () => {
    const denied = await moveTourVehicle(f.actors.soundA.client, { tourDateId: f.tourDateId, fromIndex: 0, toIndex: 1 }, "en");
    expect(denied).toEqual({ ok: false, message: "Only a tour admin can change the load order." });
  });
});

describe("orden de carga", () => {
  it("un miembro no puede reordenar; un admin sí y persiste", async () => {
    const denied = await moveTourVehicle(f.actors.soundA.client, { tourDateId: f.tourDateId, fromIndex: 0, toIndex: 2 });
    expect(denied).toEqual({ ok: false, message: "Solo un admin de la gira puede cambiar el orden de carga." });

    const ok = await moveTourVehicle(f.actors.coAdmin.client, { tourDateId: f.tourDateId, fromIndex: 2, toIndex: 0 });
    expect(ok.ok).toBe(true);
    const vehicles = await createSupabaseTourRepository(f.actors.guest.client, { dateId: f.tourDateId }).listVehicles();
    expect(vehicles.map((v) => `${v.label}/${v.meta}`)).toEqual(["Bus/Autobús", "Truck A/Tráiler", "Truck B/Tráiler"]);
  });
});

describe("documentos de la fecha (referencia en vivo)", () => {
  it("una versión más nueva aparece como 'revisar' con la URL de la vigente; un admin la adopta", async () => {
    const repo = createSupabaseTourRepository(f.actors.soundA.client, { dateId: f.tourDateId });
    const before = (await repo.getTourDate(f.tourDateId))!.show.docs.find((d) => d.documentId === riderId);
    expect(before).toMatchObject({ status: "revisar", url: "https://example.com/v2.pdf", meta: "Rider técnico · v2" });

    const denied = await adoptCurrentDocumentVersion(f.actors.soundA.client, { tourDateId: f.tourDateId, documentId: riderId });
    expect(denied.ok).toBe(false);

    expect((await adoptCurrentDocumentVersion(f.actors.owner.client, { tourDateId: f.tourDateId, documentId: riderId })).ok).toBe(true);
    const after = (await repo.getTourDate(f.tourDateId))!.show.docs.find((d) => d.documentId === riderId);
    expect(after?.status).toBe("vigente");
  });
});
