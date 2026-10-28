import type { RoomScope } from "@gigbridge/types";

/**
 * Lógica de "quién ve el cuarto de quién" (el ejemplo central del brief:
 * visibilidad granular vía RLS sobre `tour_crew`/`visibility_grants`, no
 * columnas booleanas por caso de uso). Hoy replica en la capa de aplicación
 * la regla que en producción vivirá como policy de RLS en Postgres — se
 * mantiene aquí porque tanto un Route Handler con service role (que salta
 * RLS y necesita re-aplicar la regla a mano) como la UI (para explicar POR
 * QUÉ algo está oculto, no solo ocultarlo) la necesitan, y por eso no puede
 * vivir solo en la base de datos.
 */
export function canViewHotelRoom(viewer: { isTourManager: boolean }, target: { roomScope: RoomScope }): boolean {
  if (viewer.isTourManager) return true;
  return target.roomScope === "department" || target.roomScope === "tour_all";
}

export function hotelRoomVisibilityReason(canView: boolean): string {
  return canView
    ? "Cuarto visible: eres Tour Manager de esta gira."
    : "Número de cuarto oculto: solo lo ve el Personal Manager y quien él autorice.";
}
