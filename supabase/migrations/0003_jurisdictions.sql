-- ============================================================
-- GigBridge unificado — 0003: jurisdicciones (reglas de labor)
--
-- Nueva respecto a v1 y v2. Doc de estrategia, sección "Reglas de labor
-- por jurisdicción": se captura una vez por estado/ciudad y todos sus
-- venues la heredan; el venue puede sobreescribir campos puntuales.
-- MVP: solo captura el dato, sin cálculo/validación automática (eso es
-- fase de crecimiento, ver "Labor call: por qué en escalones" del doc).
-- Se crea antes de venues porque venues.jurisdiction_id la referencia.
-- ============================================================

create table public.jurisdictions (
  id                        uuid        primary key default gen_random_uuid(),
  name                      text        not null,
  country                   text        not null default 'US',
  state_region              text,
  city                      text,
  min_paid_hours            numeric(4,1),
  break_frequency_minutes   integer,
  break_duration_minutes    integer,
  meal_deadline_hour        integer,
  meal_penalty_type         text,
  allows_department_change boolean     not null default true,
  union_required            boolean     not null default false,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  unique (country, state_region, city)
);

create index jurisdictions_country_state_idx on public.jurisdictions(country, state_region);

create trigger jurisdictions_updated_at
  before update on public.jurisdictions
  for each row execute function public.handle_updated_at();

alter table public.jurisdictions enable row level security;

-- Catálogo de referencia: lectura pública, escritura solo admins.
create policy "jurisdictions_public_read" on public.jurisdictions
  for select using (true);

create policy "jurisdictions_admin_write" on public.jurisdictions
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true)
  );
