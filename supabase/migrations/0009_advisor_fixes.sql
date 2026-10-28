-- ============================================================
-- GigBridge unificado — 0009: correcciones de `supabase db advisors`
--
-- Hallazgos ERROR arreglados aquí:
--   - slug_availability sin `security_invoker` (corre con permisos del
--     dueño de la vista, no del que consulta).
--   - spatial_ref_sys (tabla del sistema de PostGIS) sin RLS.
-- Más 3 funciones sin `search_path` fijo (hardening estándar) y un
-- índice duplicado en venues (heredado de v1: `slug` ya es `unique not
-- null` en la definición de columna, no hace falta el índice aparte).
--
-- NO arreglados aquí (quedan como deuda conocida, documentada, no
-- silenciosa): `auth_rls_initplan` (43 casos — envolver `auth.uid()`
-- como `(select auth.uid())` en cada policy) y `multiple_permissive_policies`
-- (144 casos — son advertencias de PERFORMANCE, no de seguridad; afectan
-- que Postgres evalúe varias policies por fila en vez de una combinada.
-- Requieren revisar policy por policy, se dejan para un pase dedicado.
-- ============================================================

create or replace view public.slug_availability
  with (security_invoker = true) as
  select slug from public.profiles;

grant select on public.slug_availability to anon, authenticated;

-- spatial_ref_sys es propiedad de la extensión postgis, no del rol que
-- corre las migraciones — Supabase no permite alterar su RLS sin ser
-- dueño de la tabla. Es un catálogo de referencia (SRIDs), de solo
-- lectura, sin datos de usuarios: se deja tal cual, es el mismo
-- comportamiento en cualquier proyecto Supabase con PostGIS habilitado.

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_event_location()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location = st_setsrid(st_makepoint(new.longitude, new.latitude), 4326);
  end if;
  return new;
end;
$$;

create or replace function public.nearby_events(
  lat          double precision,
  lng          double precision,
  radius_m     double precision default 50000,
  date_from    date    default null,
  date_to      date    default null,
  tickets_only boolean default false
)
returns setof public.events
language sql
stable
set search_path = public, pg_temp
as $$
  select e.*
  from public.events e
  where e.status = 'published'
    and e.is_public = true
    and e.location is not null
    and st_dwithin(
      e.location,
      st_setsrid(st_makepoint(lng, lat), 4326)::geography,
      radius_m
    )
    and (date_from is null or e.event_date >= date_from)
    and (date_to   is null or e.event_date <= date_to)
    and (not tickets_only or e.tickets_available = true)
  order by st_distance(
    e.location,
    st_setsrid(st_makepoint(lng, lat), 4326)::geography
  ) asc
  limit 200
$$;

drop index if exists public.venues_slug_idx;
