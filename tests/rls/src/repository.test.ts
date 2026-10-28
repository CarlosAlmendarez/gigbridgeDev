import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createSupabaseTourRepository } from "@gigbridge/data";
import { createFixture, type Fixture } from "./fixture";

/**
 * El repositorio de gira sobre Supabase, leído con la sesión de cada actor:
 * comprueba que el mapeo a view models funciona con filas reales y que lo
 * que llega a la UI ya viene filtrado por la RLS (no hay re-chequeo en la
 * capa de aplicación que pueda tapar un hueco de policy).
 */

let f: Fixture;

beforeAll(async () => {
  f = await createFixture();
});

afterAll(async () => {
  await f?.cleanup();
});

describe("createSupabaseTourRepository", () => {
  it("arma el day sheet de una fecha con venue", async () => {
    const repo = createSupabaseTourRepository(f.actors.soundA.client, { dateId: f.tourDateId });
    const date = await repo.getTourDate(f.tourDateId);
    expect(date).not.toBeNull();
    expect(date!.kind).toBe("Show");
    expect(date!.dateline).toBe("Vie 20 nov 2026");
    expect(date!.venue.name).toMatch(/RLS .* Venue/);
    expect(date!.clock.map((c) => c.time)).toEqual(["14:00", "20:00", "21:30"]);
    expect(date!.missing).toContain("Setlist sin confirmar");
  });

  it("lista las fechas de la gira resolviendo la gira desde la fecha", async () => {
    const repo = createSupabaseTourRepository(f.actors.guest.client, { dateId: f.travelDateId });
    const dates = await repo.listTourDates();
    expect(dates.map((d) => d.kind)).toEqual(["Show", "Viaje"]);
    expect(dates[0].counter).toBe("Show 01 / 1");
  });

  it("el roster sale en orden de mando y con los cuartos que la RLS deja ver", async () => {
    const repo = createSupabaseTourRepository(f.actors.soundB.client, { dateId: f.tourDateId });
    const roster = await repo.listRoster();
    expect(roster).toHaveLength(5);

    const byName = Object.fromEntries(roster.map((p) => [p.name, p]));
    expect(byName["RLS soundB"].room).toBe("102"); // el suyo
    expect(byName["RLS soundA"].room).toBe(""); // scope 'self' de otro: oculto
    expect(byName["RLS soundA"].roomScope).toBe("self");
    expect(byName["RLS lights"].room).toBe("103"); // tour_all
  });

  it("alguien fuera de la gira no obtiene nada", async () => {
    const repo = createSupabaseTourRepository(f.actors.outsider.client, { dateId: f.tourDateId });
    expect(await repo.getTourDate(f.tourDateId)).toBeNull();
    expect(await repo.listTourDates()).toEqual([]);
    expect(await repo.listRoster()).toEqual([]);
  });

  it("un dateId que no es uuid no consulta y devuelve null", async () => {
    const repo = createSupabaseTourRepository(f.actors.soundA.client, { dateId: "d12" });
    expect(await repo.getTourDate("d12")).toBeNull();
  });
});
