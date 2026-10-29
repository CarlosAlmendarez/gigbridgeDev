import { expect, fx, login, test } from "./helpers";

test("en el teléfono el menú muestra las cinco secciones y la activa queda a la vista", async ({ page }) => {
  const { tourDateId } = fx();
  await login(page, "soundA", `/tour/${tourDateId}/equipo/crew`);
  const nav = page.getByRole("navigation", { name: "Secciones de la fecha" });
  await expect(nav.getByRole("link")).toHaveCount(5);
  await expect(nav.getByRole("link", { name: "Equipo" })).toBeInViewport();
  // Las opciones (party, idioma, sesión) van plegadas hasta que se piden.
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeHidden();
  await page.getByRole("button", { name: "Opciones" }).click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
});
