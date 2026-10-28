-- ============================================================
-- GigBridge unificado — 0012: zona horaria del venue y de la fecha
--
-- Doc de estrategia, "Arquitectura base del MVP" §5: una gira cruza
-- zonas (California, Arizona, Colorado) y los horarios de llamado deben
-- mostrarse en hora local del venue. Ninguna tabla de 0001–0011 guardaba
-- la zona: `tour_dates.doors_time/show_time` y `labor_calls.call_time`
-- son `time` sin zona, así que no había forma de saber a qué hora
-- absoluta correspondían.
--
-- Decisión: los horarios del día siguen siendo hora de pared (`time`),
-- que es como los escribe el venue y como los lee el crew; lo que se
-- agrega es la zona IANA que los interpreta.
--   - venues.timezone: obligatoria, la hereda toda fecha en ese venue.
--   - tour_dates.timezone: opcional, solo para días sin venue (viaje,
--     descanso) o para corregir un caso puntual. Zona efectiva de una
--     fecha = coalesce(tour_dates.timezone, venues.timezone).
-- Lo que ya es un instante (reminders.remind_at, created_at, etc.) sigue
-- en timestamptz/UTC y no cambia.
-- ============================================================

-- `check` no puede consultar pg_timezone_names (no es inmutable). Probar
-- la conversión y atrapar el error es el patrón estándar; se declara
-- immutable porque la base de zonas IANA no cambia entre transacciones.
create or replace function public.is_valid_timezone(p_tz text)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
begin
  perform now() at time zone p_tz;
  return true;
exception when invalid_parameter_value then
  return false;
end;
$$;

alter table public.venues
  add column timezone text not null default 'America/Mexico_City'
    constraint venues_timezone_valid check (public.is_valid_timezone(timezone));

alter table public.tour_dates
  add column timezone text
    constraint tour_dates_timezone_valid check (timezone is null or public.is_valid_timezone(timezone));

-- Zona efectiva de una fecha. security invoker (default): respeta la RLS
-- de tour_dates/venues de quien consulta.
create or replace function public.tour_date_timezone(p_tour_date_id uuid)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(td.timezone, v.timezone, 'America/Mexico_City')
  from public.tour_dates td
  left join public.venues v on v.id = td.venue_id
  where td.id = p_tour_date_id;
$$;

grant execute on function public.tour_date_timezone(uuid) to authenticated;
