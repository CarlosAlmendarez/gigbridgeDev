import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TourMemberRole, VisibilityScope } from "@gigbridge/types";
import { PUBLISHABLE_KEY, SECRET_KEY, SUPABASE_URL } from "./env";

/**
 * Una gira mínima con un actor por cada caso de la matriz de permisos.
 * Todo se crea con el cliente service role (salta RLS) y cada actor se
 * prueba después con su propia sesión y la publishable key — exactamente
 * lo que hace la app desde el navegador.
 *
 *   owner     creó la gira (tours.created_by)            → admin implícito
 *   coAdmin   tour_crew.member_role = 'admin'
 *   soundA    member, rol en depto Sonido, party A
 *   soundB    member, rol en depto Sonido, party A
 *   lights    member, rol en depto Luces,  party B
 *   guest     member_role = 'guest', sin rol operativo
 *   outsider  autenticado, sin relación con la gira
 *
 * Cuartos de hotel (uno por scope):
 *   roomSelfSoundA    de soundA, scope 'self'
 *   roomDeptSoundB    de soundB, scope 'department'
 *   roomTourLights    de lights, scope 'tour_all'
 *   roomCustomLights  de lights, scope 'custom' + grant a persona soundA
 */

export type ActorName = "owner" | "coAdmin" | "soundA" | "soundB" | "lights" | "guest" | "outsider";
type CrewActor = Exclude<ActorName, "owner" | "outsider">;

export interface Actor {
  userId: string;
  profileId: string;
  crewMemberId: string | null;
  tourCrewId: string | null;
  client: SupabaseClient;
}

export interface Fixture {
  admin: SupabaseClient;
  anon: SupabaseClient;
  actors: Record<ActorName, Actor>;
  tourId: string;
  venueId: string;
  tourDateId: string;
  travelDateId: string;
  rooms: { selfSoundA: string; deptSoundB: string; tourLights: string; customLights: string };
  cleanup: () => Promise<void>;
}

const PASSWORD = `rls-${randomUUID()}`;

function newClient(key: string): SupabaseClient {
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function must<T>(label: string, p: PromiseLike<{ data: T; error: unknown }>): Promise<NonNullable<T>> {
  const { data, error } = await p;
  if (error || data == null) throw new Error(`Fixture: ${label} falló: ${JSON.stringify(error)}`);
  return data as NonNullable<T>;
}

export async function createFixture(): Promise<Fixture> {
  const admin = newClient(SECRET_KEY);
  const run = randomUUID().slice(0, 8);
  const createdUserIds: string[] = [];
  const createdCrewIds: string[] = [];
  const createdDeptIds: string[] = [];
  const createdRoleIds: string[] = [];

  const cleanup = async () => {
    // Borrar al usuario cascadea profiles → bands → tours → todo lo de la
    // gira. crew_members (user_id on delete set null) y el catálogo de
    // departamentos/roles (roles.department_id on delete set null) se
    // borran a mano.
    for (const id of createdUserIds) await admin.auth.admin.deleteUser(id);
    if (createdCrewIds.length) await admin.from("crew_members").delete().in("id", createdCrewIds);
    if (createdRoleIds.length) await admin.from("roles").delete().in("id", createdRoleIds);
    if (createdDeptIds.length) await admin.from("departments").delete().in("id", createdDeptIds);
  };

  try {
    async function makeUser(name: ActorName): Promise<Omit<Actor, "crewMemberId" | "tourCrewId">> {
      const email = `rls-${run}-${name.toLowerCase()}@example.test`;
      const user = await must(
        `createUser ${name}`,
        admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true }).then((r) => ({
          data: r.data.user,
          error: r.error,
        }))
      );
      createdUserIds.push(user.id);
      const profile = await must(
        `profile ${name}`,
        admin
          .from("profiles")
          .insert({ user_id: user.id, slug: `rls-${run}-${name.toLowerCase()}`, display_name: `RLS ${name}` })
          .select("id")
          .single()
      );
      const client = newClient(PUBLISHABLE_KEY);
      const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
      if (error) throw new Error(`Fixture: login ${name} falló: ${error.message}`);
      return { userId: user.id, profileId: profile.id, client };
    }

    const names: ActorName[] = ["owner", "coAdmin", "soundA", "soundB", "lights", "guest", "outsider"];
    const users = Object.fromEntries(
      await Promise.all(names.map(async (n) => [n, await makeUser(n)] as const))
    ) as Record<ActorName, Omit<Actor, "crewMemberId" | "tourCrewId">>;

    const [sonido, luces] = await must(
      "departments",
      admin
        .from("departments")
        .insert([{ name: `RLS ${run} Sonido` }, { name: `RLS ${run} Luces` }])
        .select("id")
    );
    createdDeptIds.push(sonido.id, luces.id);
    const [rolSonido, rolLuces] = await must(
      "roles",
      admin
        .from("roles")
        .insert([
          { department_id: sonido.id, name: `RLS ${run} Monitores` },
          { department_id: luces.id, name: `RLS ${run} Iluminador` },
        ])
        .select("id")
    );
    createdRoleIds.push(rolSonido.id, rolLuces.id);

    const band = await must(
      "band",
      admin.from("bands").insert({ profile_id: users.owner.profileId, name: `RLS ${run} Banda` }).select("id").single()
    );
    const venue = await must(
      "venue",
      admin
        .from("venues")
        .insert({
          owner_id: users.owner.profileId,
          slug: `rls-${run}-venue`,
          name: `RLS ${run} Venue`,
          city: "Phoenix",
          timezone: "America/Phoenix",
          // No público a propósito: el crew debe leerlo por ser de su gira (0014).
          is_discoverable: false,
        })
        .select("id")
        .single()
    );
    const tour = await must(
      "tour",
      admin
        .from("tours")
        .insert({ band_id: band.id, name: `RLS ${run} Gira`, created_by: users.owner.profileId })
        .select("id")
        .single()
    );
    const [showDate, travelDate] = await must(
      "tour_dates",
      admin
        .from("tour_dates")
        .insert([
          {
            tour_id: tour.id,
            venue_id: venue.id,
            show_date: "2026-11-20",
            status: "confirmed",
            doors_time: "20:00",
            show_time: "21:30",
          },
          // Insert múltiple: PostgREST manda null (no el default) en columnas
          // que falten en alguna fila, así que status va explícito en ambas.
          { tour_id: tour.id, venue_id: null, show_date: "2026-11-21", status: "confirmed", timezone: "America/Denver" },
        ])
        .select("id")
    );

    const crewSpec: Record<CrewActor, { member_role: TourMemberRole; role_id: string | null; party: string | null }> = {
      coAdmin: { member_role: "admin", role_id: null, party: null },
      soundA: { member_role: "member", role_id: rolSonido.id, party: "A" },
      soundB: { member_role: "member", role_id: rolSonido.id, party: "A" },
      lights: { member_role: "member", role_id: rolLuces.id, party: "B" },
      guest: { member_role: "guest", role_id: null, party: null },
    };

    const actors = {
      owner: { ...users.owner, crewMemberId: null, tourCrewId: null },
      outsider: { ...users.outsider, crewMemberId: null, tourCrewId: null },
    } as Record<ActorName, Actor>;

    for (const [name, spec] of Object.entries(crewSpec) as [CrewActor, (typeof crewSpec)[CrewActor]][]) {
      const crew = await must(
        `crew_member ${name}`,
        admin.from("crew_members").insert({ user_id: users[name].userId, full_name: `RLS ${name}` }).select("id").single()
      );
      createdCrewIds.push(crew.id);
      const tc = await must(
        `tour_crew ${name}`,
        admin
          .from("tour_crew")
          .insert({ tour_id: tour.id, crew_member_id: crew.id, status: "confirmed", ...spec })
          .select("id")
          .single()
      );
      actors[name] = { ...users[name], crewMemberId: crew.id, tourCrewId: tc.id };
    }

    async function room(crewMemberId: string, scope: VisibilityScope, label: string) {
      const row = await must(
        `hotel room ${label}`,
        admin
          .from("hotel_room_assignments")
          .insert({
            tour_date_id: showDate.id,
            crew_member_id: crewMemberId,
            hotel_name: "Hotel RLS",
            room_number: label,
            default_scope: scope,
          })
          .select("id")
          .single()
      );
      return row.id as string;
    }

    const rooms = {
      selfSoundA: await room(actors.soundA.crewMemberId!, "self", "101"),
      deptSoundB: await room(actors.soundB.crewMemberId!, "department", "102"),
      tourLights: await room(actors.lights.crewMemberId!, "tour_all", "103"),
      customLights: await room(actors.lights.crewMemberId!, "custom", "104"),
    };
    await must(
      "visibility_grant",
      admin
        .from("visibility_grants")
        .insert({
          tour_id: tour.id,
          subject_type: "person",
          subject_id: actors.soundA.tourCrewId,
          resource_type: "hotel_room",
          resource_id: rooms.customLights,
          scope: "custom",
        })
        .select("id")
    );

    await must("setlist", admin.from("setlists").insert({ tour_date_id: showDate.id, songs: [] }).select("id"));
    await must(
      "labor_call",
      admin
        .from("labor_calls")
        .insert({ tour_date_id: showDate.id, position_title: "Stagehand", headcount: 4, call_time: "14:00" })
        .select("id")
    );

    return {
      admin,
      anon: newClient(PUBLISHABLE_KEY),
      actors,
      tourId: tour.id,
      venueId: venue.id,
      tourDateId: showDate.id,
      travelDateId: travelDate.id,
      rooms,
      cleanup,
    };
  } catch (err) {
    await cleanup();
    throw err;
  }
}
