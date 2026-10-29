-- ============================================================
-- GigBridge unificado — 0015: permisos reales para `guest` y
-- `dept_head`, y alta de giras solo con la banda propia
--
-- Hasta 0014, `tour_crew.member_role` solo distinguía admin del resto:
-- un invitado (`guest`) y un jefe de departamento (`dept_head`) tenían
-- exactamente los permisos de un `member`. La matriz que se aplica aquí
-- (pendiente de validar con el Tour Manager):
--
--   guest     solo lectura del día a día de la gira (fechas, horarios,
--             venue, setlist, notas). No ve la lista de invitados ni el
--             directorio externo, y no escribe nada.
--   member    lo anterior + agrega invitados y notas (igual que antes).
--   dept_head lo de member + captura/edita los labor calls y vacantes
--             de SU departamento (roles.department_id de su rol).
--   admin     todo, sin cambios.
--
-- Limitación conocida: los teléfonos/correos del roster viven en
-- crew_members, cuya lectura (0011) no distingue rol; ocultárselos a un
-- invitado requiere una vista o RPC aparte, no una policy.
--
-- Además: `tours_authenticated_insert` (0006) solo exigía que
-- created_by fuera el perfil propio, pero aceptaba cualquier band_id —
-- se podía crear una gira a nombre de una banda ajena. Ahora la banda
-- también debe ser del perfil que crea la gira.
-- ============================================================

-- Miembro que puede aportar (no invitado). Incluye admins y al creador.
create or replace function public.is_tour_contributor(p_tour_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_tour_admin(p_tour_id) or exists (
    select 1 from public.tour_crew tc
    join public.crew_members cm on cm.id = tc.crew_member_id
    where tc.tour_id = p_tour_id and cm.user_id = auth.uid()
      and tc.member_role in ('dept_head', 'member')
  );
$$;

-- Jefe del departamento indicado en esta gira (por el departamento de su rol operativo).
create or replace function public.is_tour_dept_head(p_tour_id uuid, p_department_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_department_id is not null and exists (
    select 1 from public.tour_crew tc
    join public.crew_members cm on cm.id = tc.crew_member_id
    join public.roles r on r.id = tc.role_id
    where tc.tour_id = p_tour_id and cm.user_id = auth.uid()
      and tc.member_role = 'dept_head' and r.department_id = p_department_id
  );
$$;

revoke all on function public.is_tour_contributor(uuid) from public;
revoke all on function public.is_tour_dept_head(uuid, uuid) from public;
grant execute on function public.is_tour_contributor(uuid) to authenticated;
grant execute on function public.is_tour_dept_head(uuid, uuid) to authenticated;


-- Lista de invitados: ni la ve ni la llena un invitado.
drop policy "guest_list_member_read" on public.guest_list_entries;
drop policy "guest_list_member_write" on public.guest_list_entries;
create policy "guest_list_contributor_read" on public.guest_list_entries for select using (
  public.is_tour_contributor((select tour_id from public.tour_dates where id = tour_date_id))
);
create policy "guest_list_contributor_insert" on public.guest_list_entries for insert with check (
  public.is_tour_contributor((select tour_id from public.tour_dates where id = tour_date_id))
);

-- Notas: un invitado las lee pero no publica.
drop policy "tour_notes_member_insert" on public.tour_notes;
create policy "tour_notes_contributor_insert" on public.tour_notes for insert with check (
  public.is_tour_contributor(tour_id)
);

-- Labor calls: el jefe de departamento edita los de su departamento.
-- Policy aparte (las permisivas se suman con OR a labor_calls_admin_write).
create policy "labor_calls_dept_head_write" on public.labor_calls for all
  using (public.is_tour_dept_head((select tour_id from public.tour_dates where id = tour_date_id), department_id))
  with check (public.is_tour_dept_head((select tour_id from public.tour_dates where id = tour_date_id), department_id));

-- Alta de giras: la banda tiene que ser del perfil que la crea.
drop policy "tours_authenticated_insert" on public.tours;
create policy "tours_authenticated_insert" on public.tours for insert with check (
  created_by in (select id from public.profiles where user_id = auth.uid())
  and band_id in (
    select b.id from public.bands b join public.profiles p on p.id = b.profile_id where p.user_id = auth.uid()
  )
);
