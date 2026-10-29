import { expect, fx, login, test } from "./helpers";

test("sin sesión, una fecha manda al login y después vuelve a ella", async ({ page }) => {
  const { tourDateId, venueName } = fx();
  await page.goto(`/tour/${tourDateId}/dia`);
  await expect(page).toHaveURL(/\/auth\/login\?next=/);
  await page.locator('input[name="email"]').fill(fx().emails.soundA);
  await page.locator('input[name="password"]').fill(fx().password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`/tour/${tourDateId}/dia$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(venueName);
});

test("un ?next= hacia otro dominio no saca de la app", async ({ page }) => {
  await login(page, "soundA", "//evil.example.com");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("el inicio lista la gira y la abre", async ({ page }) => {
  await login(page, "soundA");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: /Gira/ }).first().click();
  await expect(page).toHaveURL(/\/tour\/.+\/dia$/);
});

test("un miembro no ve controles de admin; el admin sí", async ({ page }) => {
  const { tourDateId } = fx();
  await login(page, "soundA", `/tour/${tourDateId}/show`);
  await expect(page.getByText("Tu rol en esta gira: miembro")).toBeVisible();
  await expect(page.getByRole("button", { name: "Subir documento del show" })).toHaveCount(0);
  await page.goto(`/tour/${tourDateId}/equipo/crew`);
  await expect(page.getByRole("button", { name: "Agregar persona" })).toHaveCount(0);

  await page.context().clearCookies();
  await login(page, "owner", `/tour/${tourDateId}/show`);
  await expect(page.getByText("Tu rol en esta gira: admin")).toBeVisible();
  await expect(page.getByRole("button", { name: "Subir documento del show" })).toBeVisible();
});

test("un invitado de la gira solo lee", async ({ page }) => {
  const { tourDateId } = fx();
  await login(page, "guest", `/tour/${tourDateId}/dia`);
  await expect(page.getByText("Como invitado de la gira puedes leer las notas, pero no publicar.")).toBeVisible();
  await expect(page.getByPlaceholder("Escribe un aviso para el equipo")).toHaveCount(0);
  await page.goto(`/tour/${tourDateId}/equipo/invitados`);
  await expect(page.getByText("La lista de invitados no está disponible para invitados de la gira.")).toBeVisible();
});

test("en inglés, la gira sale en inglés", async ({ page }) => {
  const { tourDateId } = fx();
  await page.context().addCookies([{ name: "GIGBRIDGE_LOCALE", value: "en", domain: "localhost", path: "/" }]);
  await login(page, "soundA", `/tour/${tourDateId}/dia`);
  await expect(page.getByRole("link", { name: "Day sheet" })).toBeVisible();
  await expect(page.getByText("Your role on this tour: member")).toBeVisible();
});

test("un recordatorio se guarda y se quita", async ({ page }) => {
  const { tourDateId } = fx();
  await login(page, "soundB", `/tour/${tourDateId}/dia`);
  await page.getByLabel("Hora", { exact: true }).fill("16:45");
  await page.getByLabel("Recordatorio", { exact: true }).fill("E2E salir al soundcheck");
  await page.getByRole("button", { name: "Agregar recordatorio" }).click();
  await expect(page.getByText("E2E salir al soundcheck")).toBeVisible();
  await page.reload();
  await expect(page.getByText("E2E salir al soundcheck")).toBeVisible();
  await page.getByRole("button", { name: "Quitar recordatorio de las 16:45" }).click();
  await expect(page.getByText("E2E salir al soundcheck")).toHaveCount(0);
});

test("el admin agrega a una persona y ella entra a la gira con su enlace", async ({ page, browser }) => {
  const { tourDateId } = fx();
  await login(page, "owner", `/tour/${tourDateId}/equipo/crew`);
  await page.getByRole("button", { name: "Agregar persona" }).click();
  await page.locator('input[name="name"]').fill("E2E Persona invitada");
  await page.getByRole("button", { name: "Agregar e invitar" }).click();
  const url = await page.locator("input[readonly]").inputValue();
  expect(url).toMatch(/\/invite\/[0-9a-f]{64}$/);

  const other = await browser.newContext();
  const p2 = await other.newPage();
  await p2.goto(url);
  await expect(p2.getByText(/te invita a unirte a .* como E2E Persona invitada/)).toBeVisible();
  await p2.getByRole("button", { name: "Ya tengo cuenta: iniciar sesión" }).click();
  await p2.locator('input[name="email"]').fill(fx().emails.outsider);
  await p2.locator('input[name="password"]').fill(fx().password);
  await p2.locator('button[type="submit"]').click();
  await p2.getByRole("button", { name: "Unirme a la gira" }).click();
  await expect(p2).toHaveURL(new RegExp(`/tour/${tourDateId}/dia$`));
  await expect(p2.getByText("Tu rol en esta gira: miembro")).toBeVisible();
  await other.close();
});
