-- ============================================================
-- GigBridge unificado — 0014: los miembros de una gira leen los venues
-- de sus fechas
--
-- En 0004 un venue solo es legible por su dueño, un admin o cualquiera si
-- `is_discoverable = true`. El doc de estrategia pide lo contrario para el
-- caso de gira: "toda la info técnica cuelga del venue y la fecha solo lo
-- referencia". Con un venue no público (is_discoverable = false), el crew
-- de una gira que toca ahí no podía leer el venue de su propio day sheet,
-- y `tour_date_timezone` (0012, security invoker) caía a la zona por
-- defecto en vez de la del venue.
--
-- Esto abre la FILA del venue a los miembros de la gira. Qué contactos ve
-- cada quien sigue gobernado por `contact_visibility` en la capa de
-- aplicación, igual que hoy para los venues públicos.
-- ============================================================

create or replace function public.is_tour_member_at_venue(p_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.tour_dates td
    where td.venue_id = p_venue_id and public.is_tour_member(td.tour_id)
  );
$$;

revoke all on function public.is_tour_member_at_venue(uuid) from public;
grant execute on function public.is_tour_member_at_venue(uuid) to authenticated;

create policy "tour members read venues of their dates" on public.venues
  for select to authenticated using (public.is_tour_member_at_venue(id));
