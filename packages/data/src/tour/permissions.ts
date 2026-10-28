import type { RoomScope } from "@gigbridge/types";

/**
 * Lógica de "quién ve el cuarto de quién" (el ejemplo central del brief:
 * visibilidad granular vía RLS sobre `tour_crew`/`visibility_grants`, no
 * columnas booleanas por caso de uso). Es la MISMA regla que la policy
 * `hotel_room_scoped_read` / función `can_view_hotel_room` de
 * supabase/migrations/0013_fix_hotel_room_rls.sql — si cambias una, cambia
 * la otra. Se mantiene aquí porque tanto un Route Handler con service role
 * (que salta RLS y necesita re-aplicar la regla a mano) como la UI (para
 * explicar POR QUÉ algo está oculto, no solo ocultarlo) la necesitan, y por
 * eso no puede vivir solo en la base de datos.
 */
export interface HotelRoomViewer {
  isTourManager: boolean;
  /** El cuarto es de quien consulta. */
  isOccupant?: boolean;
  /** Quien consulta y la persona hospedada tienen rol en el mismo departamento de esta gira. */
  sameDepartment?: boolean;
  /** Existe un visibility_grant (hotel_room/hospedaje) cuyo sujeto es quien consulta. */
  hasGrant?: boolean;
}

export function canViewHotelRoom(viewer: HotelRoomViewer, target: { roomScope: RoomScope }): boolean {
  if (viewer.isTourManager || viewer.isOccupant || viewer.hasGrant) return true;
  if (target.roomScope === "tour_all") return true;
  return target.roomScope === "department" && viewer.sameDepartment === true;
}

export function hotelRoomVisibilityReason(canView: boolean): string {
  return canView
    ? "Cuarto visible: eres Tour Manager de esta gira."
    : "Número de cuarto oculto: solo lo ve el Personal Manager y quien él autorice.";
}
