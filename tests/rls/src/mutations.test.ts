import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addDateNote,
  addGuestEntry,
  createSupabaseTourRepository,
  moveSetlistSong,
  setGuestEntryStatus,
} from "@gigbridge/data";
import { createFixture, type Fixture } from "./fixture";

/**
 * Escrituras de @gigbridge/data/tour/mutations.ts con la sesión de cada
 * actor, y su efecto leído de vuelta por el repositorio — el mismo camino
 * que siguen las Server Actions de apps/web.
 */

let f: Fixture;

beforeAll(async () => {
  f = await createFixture();
  await f.admin
    .from("setlists")
    .update({
      songs: [
        { order: 1, title: "Uno", len: "3:00" },
        { order: 2, title: "Dos", len: "4:00" },
        { order: 3, title: "Tres", len: "5:00" },
      ],
    })
    .eq("tour_date_id", f.tourDateId);
});

afterAll(async () => {
  await f?.cleanup();
});

describe("invitados", () => {
  it("un miembro agrega; queda con su autor y status pending", async () => {
    const added = await addGuestEntry(f.actors.soundA.client, { tourDateId: f.tourDateId, name: "  Invitada Demo  " });
    expect(added.ok).toBe(true);

    const guests = await createSupabaseTourRepository(f.actors.soundB.client, { dateId: f.tourDateId }).listGuests();
    const mine = guests[f.tourDateId]?.find((g) => g.name === "Invitada Demo");
    expect(mine).toMatchObject({ status: "pending", by: "Agregado por RLS soundA" });
    expect(mine?.id).toBeTruthy();
  });

  it("solo un admin cambia el status; a los demás se les responde 404", async () => {
    const added = await addGuestEntry(f.actors.coAdmin.client, { tourDateId: f.tourDateId, name: "Prensa" });
    if (!added.ok) throw new Error(added.message);
    const guestId = added.result.id;

    const byMember = await setGuestEntryStatus(f.actors.soundA.client, { tourDateId: f.tourDateId, guestId, status: "confirmed" });
    expect(byMember).toMatchObject({ ok: false, status: 404 });

    const byAdmin = await setGuestEntryStatus(f.actors.coAdmin.client, { tourDateId: f.tourDateId, guestId, status: "confirmed" });
    expect(byAdmin).toEqual({ ok: true, result: { name: "Prensa", status: "confirmed" } });
  });

  it("alguien fuera de la gira no puede agregar", async () => {
    const res = await addGuestEntry(f.actors.outsider.client, { tourDateId: f.tourDateId, name: "Colado" });
    expect(res.ok).toBe(false);
  });

  it("valida antes de escribir", async () => {
    const res = await addGuestEntry(f.actors.soundA.client, { tourDateId: f.tourDateId, name: "   " });
    expect(res).toEqual({ ok: false, message: "El nombre del invitado no puede estar vacío" });
  });
});

describe("setlist", () => {
  it("un miembro no puede reordenar", async () => {
    const res = await moveSetlistSong(f.actors.soundA.client, { tourDateId: f.tourDateId, fromIndex: 0, toIndex: 1 });
    expect(res).toEqual({ ok: false, message: "Solo un admin de la gira puede cambiar el setlist." });
  });

  it("un admin reordena y el orden persiste", async () => {
    const res = await moveSetlistSong(f.actors.owner.client, { tourDateId: f.tourDateId, fromIndex: 2, toIndex: 0 });
    expect(res.ok).toBe(true);
    const setlist = await createSupabaseTourRepository(f.actors.guest.client, { dateId: f.tourDateId }).getSetlist(f.tourDateId);
    expect(setlist.map((s) => s.title)).toEqual(["Tres", "Uno", "Dos"]);
  });
});

describe("notas", () => {
  it("un miembro anota la fecha y el venue; aparecen en el day sheet y en el feed", async () => {
    expect((await addDateNote(f.actors.lights.client, { tourDateId: f.tourDateId, target: "tour_date", body: "Nota de fecha" })).ok).toBe(true);
    expect((await addDateNote(f.actors.lights.client, { tourDateId: f.tourDateId, target: "venue", body: "Nota de venue" })).ok).toBe(true);

    const repo = createSupabaseTourRepository(f.actors.soundA.client, { dateId: f.tourDateId });
    const date = await repo.getTourDate(f.tourDateId);
    expect(date?.show.notes.map((n) => n.body)).toContain("Nota de fecha");
    expect(date?.venue.notes.map((n) => n.body)).toContain("Nota de venue");
    expect(date?.show.notes[0].meta).toMatch(/^RLS lights · \d{4}-\d{2}-\d{2}$/);

    const feed = await repo.listTourNotes();
    expect(feed.find((n) => n.body === "Nota de fecha")?.origen).toBe("Fecha · Vie 20 nov");
    expect(feed.find((n) => n.body === "Nota de venue")?.origen).toMatch(/^Lugar · RLS .* Venue$/);
  });

  it("no se puede anotar el venue de un día sin venue", async () => {
    const res = await addDateNote(f.actors.soundA.client, { tourDateId: f.travelDateId, target: "venue", body: "x" });
    expect(res).toEqual({ ok: false, message: "Esta fecha no tiene venue." });
  });

  it("alguien fuera de la gira no ve la fecha y no puede anotar", async () => {
    const res = await addDateNote(f.actors.outsider.client, { tourDateId: f.tourDateId, target: "tour_date", body: "x" });
    expect(res.ok).toBe(false);
  });
});
