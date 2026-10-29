import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createFixture } from "../../rls/src/fixture";

export const FIXTURE_FILE = fileURLToPath(new URL("../.fixture.json", import.meta.url));

/** Crea la gira de prueba y deja en disco lo que las pruebas necesitan; devuelve el teardown. */
export default async function globalSetup() {
  const f = await createFixture();
  const { data: venue } = await f.admin.from("venues").select("name").eq("id", f.venueId).single();
  writeFileSync(
    FIXTURE_FILE,
    JSON.stringify({
      password: f.password,
      tourDateId: f.tourDateId,
      travelDateId: f.travelDateId,
      venueName: venue?.name,
      emails: Object.fromEntries(Object.entries(f.actors).map(([k, a]) => [k, a.email])),
    })
  );
  return async () => {
    // Las personas dadas de alta desde la UI no cuelgan de la gira por FK.
    const { data } = await f.admin.from("crew_members").select("id").like("full_name", "E2E %");
    if (data?.length) await f.admin.from("crew_members").delete().in("id", data.map((r) => r.id));
    await f.cleanup();
  };
}
