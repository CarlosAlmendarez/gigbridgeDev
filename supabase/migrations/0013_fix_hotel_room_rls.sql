-- ============================================================
-- GigBridge unificado — 0013: corrige la visibilidad de cuartos de hotel
--
-- La policy "hotel_room_scoped_read" de 0006_tour.sql tenía tres huecos:
--
-- 1. La rama de visibility_grants solo verificaba que EXISTIERA una
--    concesión sobre ese cuarto, no que fuera para quien consulta, ni que
--    quien consulta fuera miembro de la gira. Una sola concesión volvía el
--    cuarto (hotel + número) legible para cualquier usuario autenticado.
-- 2. default_scope = 'department' se trataba igual que 'tour_all': toda
--    la gira veía el cuarto, no solo el departamento.
-- 3. La persona hospedada no podía ver su propio cuarto con scope 'self'.
--
-- Regla nueva (la misma que packages/data/src/tour/permissions.ts):
--   - admin de la gira: siempre.
--   - la persona hospedada: siempre (es su cuarto).
--   - 'tour_all': cualquier miembro de la gira.
--   - 'department': miembros cuyo rol en ESTA gira es del mismo
--     departamento que el rol de la persona hospedada.
--   - 'self' / 'custom': solo quien tenga una concesión que lo nombre a
--     él — como persona (tour_crew.id), grupo (tour_crew.party),
--     departamento o rol — sobre ese cuarto (resource_type 'hotel_room',
--     resource_id = el cuarto) o sobre toda la sección de hospedaje
--     (resource_type 'hospedaje', resource_id null). Una concesión
--     también amplía 'department'.
--
-- Se resuelve en una función security definer para no encadenar la RLS
-- de tour_crew/visibility_grants/roles dentro de la policy.
-- ============================================================

create or replace function public.can_view_hotel_room(p_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with room as (
    select h.id, h.crew_member_id, h.default_scope, td.tour_id
    from public.hotel_room_assignments h
    join public.tour_dates td on td.id = h.tour_date_id
    where h.id = p_assignment_id
  ),
  -- Membresía de quien consulta en la gira del cuarto (0 o 1 fila: unique
  -- (tour_id, crew_member_id) y crew_members.user_id es único).
  viewer as (
    select tc.id as tour_crew_id, tc.crew_member_id, tc.role_id, tc.party, r.department_id
    from room
    join public.tour_crew tc on tc.tour_id = room.tour_id
    join public.crew_members cm on cm.id = tc.crew_member_id
    left join public.roles r on r.id = tc.role_id
    where cm.user_id = auth.uid()
  ),
  occupant as (
    select r.department_id
    from room
    join public.tour_crew tc on tc.tour_id = room.tour_id and tc.crew_member_id = room.crew_member_id
    left join public.roles r on r.id = tc.role_id
  )
  select
    exists (select 1 from room where public.is_tour_admin(room.tour_id))
    or exists (
      select 1 from room
      join public.crew_members cm on cm.id = room.crew_member_id
      where cm.user_id = auth.uid()
    )
    or exists (select 1 from room, viewer where room.default_scope = 'tour_all')
    or exists (
      select 1 from room, viewer, occupant
      where room.default_scope = 'department'
        and viewer.department_id is not null
        and viewer.department_id = occupant.department_id
    )
    or exists (
      select 1 from room, viewer, public.visibility_grants vg
      where vg.tour_id = room.tour_id
        and (
          (vg.resource_type = 'hotel_room' and vg.resource_id = room.id)
          or (vg.resource_type = 'hospedaje' and vg.resource_id is null)
        )
        and (
          (vg.subject_type = 'person' and vg.subject_id = viewer.tour_crew_id::text)
          or (vg.subject_type = 'group' and vg.subject_id = viewer.party)
          or (vg.subject_type = 'department' and vg.subject_id = viewer.department_id::text)
          or (vg.subject_type = 'role' and vg.subject_id = viewer.role_id::text)
        )
    );
$$;

revoke all on function public.can_view_hotel_room(uuid) from public;
grant execute on function public.can_view_hotel_room(uuid) to authenticated;

drop policy "hotel_room_scoped_read" on public.hotel_room_assignments;
create policy "hotel_room_scoped_read" on public.hotel_room_assignments
  for select to authenticated using (public.can_view_hotel_room(id));
