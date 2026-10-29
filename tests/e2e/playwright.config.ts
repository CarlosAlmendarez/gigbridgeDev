import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de navegador contra la app real (build de producción) y el
 * proyecto de Supabase de DESARROLLO: el setup global crea una gira con un
 * actor por rol (fixture de tests/rls, que se niega a correr contra
 * producción) y la borra al terminar.
 *
 * Corren en serie: algunas escriben (alta de crew, invitación aceptada).
 */
const PORT = 3930;

export default defineConfig({
  testDir: "./src",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./src/global-setup.ts",
  timeout: 45_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Sin esto el navegador manda Accept-Language en-US y la app (bien)
    // detecta inglés; las pruebas están escritas con los textos en español.
    locale: "es-MX",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "escritorio", testMatch: /tour\.spec\.ts/, use: { ...devices["Desktop Chrome"], locale: "es-MX" } },
    { name: "telefono", testMatch: /mobile\.spec\.ts/, use: { ...devices["Pixel 7"], locale: "es-MX" } },
  ],
  webServer: {
    command: `pnpm --filter @gigbridge/web build && pnpm --filter @gigbridge/web exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/manifest.webmanifest`,
    reuseExistingServer: false,
    timeout: 240_000,
    env: { TOUR_DATA_SOURCE: "supabase" },
  },
});
