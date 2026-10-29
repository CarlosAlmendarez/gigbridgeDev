import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { acceptTourInvite, addTourCrewMember, createSupabaseTourRepository, createTourInvite, getTourInvite } from "@gigbridge/data";
import { createFixture, type Fixture } from "./fixture";

/** Alta de crew e invitaciones (0017), con la sesión de cada actor. */

let f: Fixture;

beforeAll(async () => {
  f = await createFixture();
});

afterAll(async () => {
  // Las filas de crew_members creadas por invitación no cuelgan de la gira.
  const { data } = await f.admin.from("crew_members").select("id").like("full_name", "Invitada RLS%");
  if (data?.length) await f.admin.from("crew_members").delete().in("id", data.map((r) => r.id));
  await f?.cleanup();
});

describe("alta de crew e invitación", () => {
  it("solo un admin agrega personas", async () => {
    const res = await addTourCrewMember(f.actors.soundA.client, { tourDateId: f.tourDateId, name: "Invitada RLS x", memberRole: "member" });
    expect(res).toEqual({ ok: false, message: "Solo un admin de la gira puede agregar personas e invitarlas." });
  });

  it("un admin agrega a una persona; con el enlace, una cuenta nueva la reclama y entra a la gira", async () => {
    const added = await addTourCrewMember(f.actors.coAdmin.client, {
      tourDateId: f.tourDateId,
      name: "Invitada RLS uno",
      email: "uno@example.test",
      memberRole: "member",
      party: "B",
    });
    if (!added.ok) throw new Error(added.message);

    // Antes de aceptar: aparece en el roster sin cuenta; el outsider no ve la gira.
    const roster = await createSupabaseTourRepository(f.actors.coAdmin.client, { dateId: f.tourDateId }).listRoster();
    expect(roster.find((p) => p.name === "Invitada RLS uno")).toMatchObject({ account: false, onSite: false, party: "B" });
    expect(await createSupabaseTourRepository(f.actors.outsider.client, { dateId: f.tourDateId }).getTourSummary()).toBeNull();

    // La vista previa funciona sin sesión.
    expect(await getTourInvite(f.anon, added.result.token)).toMatchObject({
      state: "valid",
      tourName: expect.stringMatching(/Gira$/),
      personName: "Invitada RLS uno",
    });

    // Reusar el enlace vigente en vez de crear otro.
    const again = await createTourInvite(f.actors.coAdmin.client, { tourCrewId: added.result.tourCrewId });
    expect(again).toEqual({ ok: true, result: { token: added.result.token } });

    const accepted = await acceptTourInvite(f.actors.outsider.client, { token: added.result.token });
    expect(accepted).toEqual({ ok: true, result: { tourId: f.tourId, dateId: f.tourDateId } });
    const summary = await createSupabaseTourRepository(f.actors.outsider.client, { dateId: f.tourDateId }).getTourSummary();
    expect(summary?.viewerRole).toBe("member");
    const after = await createSupabaseTourRepository(f.actors.coAdmin.client, { dateId: f.tourDateId }).listRoster();
    expect(after.find((p) => p.name === "Invitada RLS uno")).toMatchObject({ account: true, onSite: true });

    // Un solo uso.
    expect(await getTourInvite(f.anon, added.result.token)).toMatchObject({ state: "accepted" });
    expect(await acceptTourInvite(f.actors.guest.client, { token: added.result.token })).toEqual({
      ok: false,
      message: "Esta invitación ya se usó.",
    });
  });

  it("si la cuenta ya está en el roster de otra gira, la membresía se mueve a su fila existente", async () => {
    // soundA ya tiene crew_members (de esta gira): una segunda gira la invita.
    const res = await f.admin.from("bands").select("id").limit(1).single();
    const tourId = crypto.randomUUID();
    await f.admin.from("tours").insert({ id: tourId, band_id: res.data!.id, name: "RLS segunda gira", created_by: f.actors.owner.profileId });
    const dateId = crypto.randomUUID();
    await f.admin.from("tour_dates").insert({ id: dateId, tour_id: tourId, show_date: "2027-03-01", status: "hold" });
    try {
      const added = await addTourCrewMember(f.actors.owner.client, { tourDateId: dateId, name: "Invitada RLS dos", memberRole: "guest" });
      if (!added.ok) throw new Error(added.message);
      expect((await acceptTourInvite(f.actors.soundA.client, { token: added.result.token })).ok).toBe(true);

      const { data: tc } = await f.admin.from("tour_crew").select("crew_member_id, member_role").eq("id", added.result.tourCrewId).single();
      expect(tc).toEqual({ crew_member_id: f.actors.soundA.crewMemberId, member_role: "guest" });
      const { data: placeholder } = await f.admin.from("crew_members").select("id").eq("full_name", "Invitada RLS dos");
      expect(placeholder).toEqual([]);
    } finally {
      await f.admin.from("tours").delete().eq("id", tourId);
    }
  });

  it("un enlace caducado o inventado no sirve", async () => {
    const added = await addTourCrewMember(f.actors.owner.client, { tourDateId: f.tourDateId, name: "Invitada RLS tres", memberRole: "member" });
    if (!added.ok) throw new Error(added.message);
    await f.admin.from("tour_invites").update({ expires_at: "2020-01-01T00:00:00Z" }).eq("token", added.result.token);
    expect(await acceptTourInvite(f.actors.outsider.client, { token: added.result.token })).toEqual({
      ok: false,
      message: "Esta invitación caducó. Pide un enlace nuevo a quien te invitó.",
    });
    expect((await getTourInvite(f.anon, "no-existe")).state).toBe("not_found");
  });

  it("nadie crea una fila de crew con la cuenta de otra persona", async () => {
    const { error } = await f.actors.soundA.client
      .from("crew_members")
      .insert({ full_name: "Suplantado", user_id: f.actors.lights.userId });
    expect(error).not.toBeNull();
  });
});
