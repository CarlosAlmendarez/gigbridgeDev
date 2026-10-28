/**
 * Destino de `?next=` después de iniciar sesión: solo rutas internas. Se
 * rechaza "//" y cualquier "\" porque los navegadores leen "/\sitio.com"
 * como "//sitio.com", es decir, otro dominio (redirección abierta).
 */
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : fallback;
}
