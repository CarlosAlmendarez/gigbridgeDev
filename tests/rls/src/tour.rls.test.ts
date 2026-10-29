import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFixture, type ActorName, type Fixture } from "./fixture";

/**
 * Matriz de permisos del módulo de gira (migraciones 0006, 0008, 0012,
 * 0013, 0014) probada con la sesión real de cada actor. Cada `it` es una celda:
 * si una policy cambia, aquí debe cambiar la expectativa en el mismo
 * commit — el doc de estrategia pide "pruebas de RLS por rol antes de
 * construir UI".
 */

let f: Fixture;

beforeAll(async () => {
  f = await createFixture();
});

afterAll(async () => {
  await f?.cleanup();
});

const MEMBERS: ActorName[] = ["owner", "coAdmin", "soundA", "soundB", "lights", "guest"];

function client(name: ActorName | "anon"): SupabaseClient {
  return name === "anon" ? f.anon : f.actors[name].client;
}

async function visibleIds(name: ActorName | "anon", table: string, column: string, value: string) {
  const { data, error } = await client(name).from(table).select("id").eq(column, value);
  // anon sin grant de tabla devuelve error en vez de 0 filas: igual de cerrado.
  if (error) return [];
  return (data ?? []).map((r: { id: string }) => r.id);
}

describe("tours / tour_dates / tour_crew: lectura solo para miembros", () => {
  it.each(MEMBERS)("%s ve la gira, sus fechas y su crew", async (name) => {
    expect(await visibleIds(name, "tours", "id", f.tourId)).toHaveLength(1);
    expect(await visibleIds(name, "tour_dates", "tour_id", f.tourId)).toHaveLength(2);
    expect(await visibleIds(name, "tour_crew", "tour_id", f.tourId)).toHaveLength(6);
  });

  it.each(["outsider", "anon"] as const)("%s no ve nada de la gira", async (name) => {
    expect(await visibleIds(name, "tours", "id", f.tourId)).toHaveLength(0);
    expect(await visibleIds(name, "tour_dates", "tour_id", f.tourId)).toHaveLength(0);
    expect(await visibleIds(name, "tour_crew", "tour_id", f.tourId)).toHaveLength(0);
  });
});

describe("tour_dates: escritura solo para admins", () => {
  it.each(["owner", "coAdmin"] as const)("%s puede editar una fecha", async (name) => {
    const { data, error } = await client(name)
      .from("tour_dates")
      .update({ notes: `editado por ${name}` })
      .eq("id", f.tourDateId)
      .select("id");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it.each(["soundA", "guest", "outsider"] as const)("%s no puede editar una fecha", async (name) => {
    const { data } = await client(name).from("tour_dates").update({ notes: "intruso" }).eq("id", f.tourDateId).select("id");
    expect(data ?? []).toHaveLength(0);
  });

  it("un miembro no puede agregar fechas", async () => {
    const { error } = await client("soundA").from("tour_dates").insert({ tour_id: f.tourId, show_date: "2026-12-01" });
    expect(error).not.toBeNull();
  });
});

describe("venues: un venue no público es legible para el crew de una gira que toca ahí (0014)", () => {
  it.each(["soundA", "guest"] as const)("%s lee el venue de su fecha", async (name) => {
    expect(await visibleIds(name, "venues", "id", f.venueId)).toHaveLength(1);
  });

  it.each(["outsider", "anon"] as const)("%s no lo ve", async (name) => {
    expect(await visibleIds(name, "venues", "id", f.venueId)).toHaveLength(0);
  });
});

describe("crew_members: PII del crew", () => {
  it("un miembro ve a sus compañeros de gira", async () => {
    const { data } = await client("soundA").from("crew_members").select("id").eq("id", f.actors.lights.crewMemberId!);
    expect(data).toHaveLength(1);
  });

  it.each(["outsider", "anon"] as const)("%s no ve al crew", async (name) => {
    expect(await visibleIds(name, "crew_members", "id", f.actors.lights.crewMemberId!)).toHaveLength(0);
  });
});

describe("hotel_room_assignments: visibilidad por scope (0013)", () => {
  async function seesRoom(name: ActorName, roomId: string) {
    return (await visibleIds(name, "hotel_room_assignments", "id", roomId)).length === 1;
  }

  it("los admins ven todos los cuartos", async () => {
    for (const admin of ["owner", "coAdmin"] as const) {
      for (const roomId of Object.values(f.rooms)) expect(await seesRoom(admin, roomId)).toBe(true);
    }
  });

  it("'self': solo la persona hospedada (y admins)", async () => {
    expect(await seesRoom("soundA", f.rooms.selfSoundA)).toBe(true);
    expect(await seesRoom("soundB", f.rooms.selfSoundA)).toBe(false);
    expect(await seesRoom("lights", f.rooms.selfSoundA)).toBe(false);
    expect(await seesRoom("guest", f.rooms.selfSoundA)).toBe(false);
  });

  it("'department': solo el mismo departamento, no toda la gira", async () => {
    expect(await seesRoom("soundA", f.rooms.deptSoundB)).toBe(true);
    expect(await seesRoom("lights", f.rooms.deptSoundB)).toBe(false);
    expect(await seesRoom("guest", f.rooms.deptSoundB)).toBe(false);
  });

  it("'tour_all': cualquier miembro, nadie de fuera", async () => {
    for (const name of MEMBERS) expect(await seesRoom(name, f.rooms.tourLights)).toBe(true);
    expect(await seesRoom("outsider", f.rooms.tourLights)).toBe(false);
  });

  it("'custom': solo el sujeto de la concesión", async () => {
    expect(await seesRoom("soundA", f.rooms.customLights)).toBe(true);
    expect(await seesRoom("soundB", f.rooms.customLights)).toBe(false);
    expect(await seesRoom("guest", f.rooms.customLights)).toBe(false);
  });

  it("regresión 0013: una concesión ajena no abre el cuarto a un usuario fuera de la gira", async () => {
    expect(await seesRoom("outsider", f.rooms.customLights)).toBe(false);
  });
});

describe("guest_list_entries", () => {
  it("un miembro agrega invitados pero no cambia su status; un admin sí", async () => {
    const { data: entry, error } = await client("soundA")
      .from("guest_list_entries")
      .insert({ tour_date_id: f.tourDateId, guest_name: "Invitado RLS" })
      .select("id")
      .single();
    expect(error).toBeNull();

    const { data: byMember } = await client("soundA")
      .from("guest_list_entries")
      .update({ status: "confirmed" })
      .eq("id", entry!.id)
      .select("id");
    expect(byMember ?? []).toHaveLength(0);

    const { data: byAdmin } = await client("coAdmin")
      .from("guest_list_entries")
      .update({ status: "confirmed" })
      .eq("id", entry!.id)
      .select("status");
    expect(byAdmin).toEqual([{ status: "confirmed" }]);
  });

  it("alguien de fuera no puede agregar invitados", async () => {
    const { error } = await client("outsider")
      .from("guest_list_entries")
      .insert({ tour_date_id: f.tourDateId, guest_name: "Colado" });
    expect(error).not.toBeNull();
  });
});

describe("setlists / labor_calls: miembros leen, admins escriben", () => {
  it.each(["setlists", "labor_calls"])("%s", async (table) => {
    expect(await visibleIds("guest", table, "tour_date_id", f.tourDateId)).toHaveLength(1);
    expect(await visibleIds("outsider", table, "tour_date_id", f.tourDateId)).toHaveLength(0);
    const { data } = await client("soundA").from(table).delete().eq("tour_date_id", f.tourDateId).select("id");
    expect(data ?? []).toHaveLength(0);
  });
});

describe("reminders: privados de su dueño", () => {
  it("nadie más ve el recordatorio de otro, ni un admin de la gira", async () => {
    const { data: mine, error } = await client("soundA")
      .from("reminders")
      .insert({
        user_id: f.actors.soundA.profileId,
        tour_date_id: f.tourDateId,
        remind_at: "2026-11-20T18:00:00Z",
        message: "Cables",
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(await visibleIds("soundA", "reminders", "id", mine!.id)).toHaveLength(1);
    expect(await visibleIds("owner", "reminders", "id", mine!.id)).toHaveLength(0);
  });

  it("no se puede crear un recordatorio a nombre de otro", async () => {
    const { error } = await client("soundA").from("reminders").insert({
      user_id: f.actors.lights.profileId,
      remind_at: "2026-11-20T18:00:00Z",
      message: "suplantación",
    });
    expect(error).not.toBeNull();
  });
});

describe("zona horaria (0012)", () => {
  it("la fecha con venue hereda la zona del venue; la de viaje usa la suya", async () => {
    const { data: show } = await client("soundA").rpc("tour_date_timezone", { p_tour_date_id: f.tourDateId });
    const { data: travel } = await client("soundA").rpc("tour_date_timezone", { p_tour_date_id: f.travelDateId });
    expect(show).toBe("America/Phoenix");
    expect(travel).toBe("America/Denver");
  });

  it("rechaza una zona que no es IANA", async () => {
    const { error } = await f.admin.from("venues").update({ timezone: "Hora del Centro" }).eq("id", f.venueId);
    expect(error?.message).toMatch(/venues_timezone_valid/);
  });
});
