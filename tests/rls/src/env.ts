import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Credenciales del proyecto de Supabase contra el que corren las pruebas.
 * Se leen de apps/web/.env.local (las mismas que usa la app en dev) salvo
 * que ya vengan en el entorno.
 *
 * Estas pruebas CREAN Y BORRAN usuarios y filas reales. Por eso se niegan a
 * correr contra el proyecto de producción de la v1, aunque alguien copie
 * por error su .env.local.
 */
const PRODUCTION_PROJECT_REFS = ["jrchaxyybvcpgjsnhelp"];

const envFile = fileURLToPath(new URL("../../../apps/web/.env.local", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} (apps/web/.env.local o variable de entorno)`);
  return value;
}

export const SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL");
export const PUBLISHABLE_KEY = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
export const SECRET_KEY = required("SUPABASE_SECRET_KEY");

const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
if (PRODUCTION_PROJECT_REFS.includes(projectRef)) {
  throw new Error(
    `Las pruebas de RLS no corren contra producción (${projectRef}). Apunta apps/web/.env.local al proyecto de dev.`
  );
}
