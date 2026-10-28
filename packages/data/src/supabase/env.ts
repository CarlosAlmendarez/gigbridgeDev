function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia apps/web/.env.local.example a .env.local y ` +
        `llena los valores del proyecto Supabase de GigBridge (Project Settings → API).`
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

/**
 * Supabase renombró las API keys: "publishable"/"secret" (prefijos
 * sb_publishable_/sb_secret_) reemplazan a las anon/service_role key
 * antiguas basadas en JWT. El proyecto de gigbridgeDev ya se creó con
 * las nuevas — no hay JWT legacy que soportar aquí.
 */
export function getSupabasePublishableKey(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

export function getSupabaseSecretKey(): string {
  return requireEnv("SUPABASE_SECRET_KEY");
}
