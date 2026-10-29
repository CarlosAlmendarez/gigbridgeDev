import { readFileSync } from "node:fs";
import { test as base, expect, type Page } from "@playwright/test";
import { FIXTURE_FILE } from "./global-setup";

export interface E2EFixture {
  password: string;
  tourDateId: string;
  travelDateId: string;
  venueName: string;
  emails: Record<"owner" | "coAdmin" | "soundA" | "soundB" | "lights" | "guest" | "soundHead" | "outsider", string>;
}

export const fx = (): E2EFixture => JSON.parse(readFileSync(FIXTURE_FILE, "utf8"));

/** Inicia sesión con el formulario real. `next` es a dónde debe volver. */
export async function login(page: Page, who: keyof E2EFixture["emails"], next?: string) {
  const f = fx();
  await page.goto(next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login");
  await page.locator('input[name="email"]').fill(f.emails[who]);
  await page.locator('input[name="password"]').fill(f.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"));
}

/** `page` que además falla la prueba si hubo errores de JS o de consola. */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await use(page);
    expect(errors, "errores de consola").toEqual([]);
  },
});

export { expect };
