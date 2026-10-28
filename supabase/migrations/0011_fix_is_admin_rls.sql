-- ============================================================
-- GigBridge unificado — 0011: corrige policies que leían
-- profiles.is_admin directamente
--
-- Bug real encontrado con una prueba end-to-end contra el proyecto
-- vivo (no solo linter/typecheck): la página pública de un venue
-- `is_discoverable = true` devolvía 404 para un visitante anónimo.
-- Causa: 0001_foundations.sql revoca el SELECT de anon/authenticated
-- sobre `profiles` y solo otorga un grant por columnas (sin
-- `is_admin`). Varias policies de 0003/0004/0008 hacían
-- `exists (select 1 from profiles where user_id = auth.uid() and
-- is_admin = true)` directo en el `using (...)` — Postgres evalúa
-- TODAS las policies permisivas de una tabla para decidir el OR final,
-- así que evaluar esa subconsulta falla con "permission denied for
-- table profiles" aunque el visitante no sea admin y esa policy en
-- particular ni aplicara. Rompía la lectura completa de la tabla, no
-- solo el acceso de admin.
--
-- Arreglo: un helper `is_admin()` security definer (mismo patrón que
-- `current_profile()` en 0001) que sí puede leer la columna, y todas
-- las policies afectadas reescritas para llamarlo en vez de
-- consultar `profiles` directo.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles where user_id = auth.uid() and is_admin = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

drop policy "jurisdictions_admin_write" on public.jurisdictions;
create policy "jurisdictions_admin_write" on public.jurisdictions
  for all using (public.is_admin());

drop policy "admin full access to venues" on public.venues;
create policy "admin full access to venues" on public.venues
  for all using (public.is_admin());

drop policy "admin full access to verification requests" on public.venue_verification_requests;
create policy "admin full access to verification requests" on public.venue_verification_requests
  for all using (public.is_admin());

drop policy "departments_admin_write" on public.departments;
create policy "departments_admin_write" on public.departments
  for all using (public.is_admin());

drop policy "roles_admin_write" on public.roles;
create policy "roles_admin_write" on public.roles
  for all using (public.is_admin());

drop policy "crew_members_read" on public.crew_members;
create policy "crew_members_read" on public.crew_members
  for select using (
    user_id = auth.uid()
    or public.shares_tour_with_crew_member(id)
    or public.is_tour_admin_over_crew_member(id)
    or public.is_admin()
  );

drop policy "crew_members_update" on public.crew_members;
create policy "crew_members_update" on public.crew_members
  for update using (
    user_id = auth.uid()
    or public.is_tour_admin_over_crew_member(id)
    or public.is_admin()
  );

drop policy "crew_members_delete" on public.crew_members;
create policy "crew_members_delete" on public.crew_members
  for delete using (
    public.is_tour_admin_over_crew_member(id)
    or public.is_admin()
  );
