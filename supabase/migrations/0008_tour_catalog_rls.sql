-- ============================================================
-- GigBridge unificado — 0008: RLS faltante en 0006_tour.sql
--
-- departments, roles y crew_members se crearon sin `enable row level
-- security` ni políticas — verificado con
-- `select tablename, rowsecurity from pg_tables` contra el proyecto ya
-- migrado. crew_members guarda PII real (phone, email, full_name), así
-- que esto no es cosmético: sin RLS, cualquier request con la
-- publishable/anon key puede leer y escribir esa tabla completa.
-- ============================================================

alter table public.departments enable row level security;

create policy "departments_public_read" on public.departments
  for select using (true);

create policy "departments_admin_write" on public.departments
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true)
  );


alter table public.roles enable row level security;

create policy "roles_public_read" on public.roles
  for select using (true);

create policy "roles_admin_write" on public.roles
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true)
  );


create or replace function public.shares_tour_with_crew_member(p_crew_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.tour_crew tc_self
    join public.crew_members cm_self on cm_self.id = tc_self.crew_member_id
    join public.tour_crew tc_target on tc_target.tour_id = tc_self.tour_id
    where cm_self.user_id = auth.uid() and tc_target.crew_member_id = p_crew_member_id
  );
$$;

create or replace function public.is_tour_admin_over_crew_member(p_crew_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.tour_crew tc
    where tc.crew_member_id = p_crew_member_id and public.is_tour_admin(tc.tour_id)
  );
$$;

revoke all on function public.shares_tour_with_crew_member(uuid) from public;
revoke all on function public.is_tour_admin_over_crew_member(uuid) from public;
grant execute on function public.shares_tour_with_crew_member(uuid) to authenticated;
grant execute on function public.is_tour_admin_over_crew_member(uuid) to authenticated;

alter table public.crew_members enable row level security;

-- Lectura: uno mismo, cualquiera que comparta una gira con este crew
-- member (roster), o el admin de alguna gira donde participe.
create policy "crew_members_read" on public.crew_members
  for select using (
    user_id = auth.uid()
    or public.shares_tour_with_crew_member(id)
    or public.is_tour_admin_over_crew_member(id)
    or exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true)
  );

-- Insert abierto a cualquier autenticado: un tour admin da de alta crew
-- freelance/invitado ANTES de que exista el tour_crew que los vincula
-- (no hay todavía una gira compartida que verificar).
create policy "crew_members_authenticated_insert" on public.crew_members
  for insert with check (auth.uid() is not null);

create policy "crew_members_update" on public.crew_members
  for update using (
    user_id = auth.uid()
    or public.is_tour_admin_over_crew_member(id)
    or exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true)
  );

create policy "crew_members_delete" on public.crew_members
  for delete using (
    public.is_tour_admin_over_crew_member(id)
    or exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true)
  );
