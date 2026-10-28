-- ============================================================
-- GigBridge unificado — 0006: módulo de gira, reestructurado con venue
-- como núcleo (tour_dates.venue_id referencia venues; nunca al revés).
--
-- Toma de v2 (hoy solo mock data en packages/data/src/tour/mockData.ts):
-- departments/roles, crew_members con user_id opcional, tour_crew con
-- reports_to, reminders. Cambios respecto al diseño original de v2:
--   - tour_dates YA NO tiene rider_version_id: los documentos de una
--     fecha se referencian vía tour_date_document_refs (0007), que
--     apunta a la tabla polimórfica `documents`.
--   - `visibility_grants` se generaliza: antes solo colgaba de
--     tour_crew_id + resource_type; ahora el sujeto puede ser persona,
--     grupo, departamento o rol (doc "Permisos por membresía").
--   - El rol de aplicación por gira (admin/jefe de depto/miembro/
--     invitado) se guarda en `tour_crew.member_role` en vez de una
--     tabla `tour_members` aparte, para no duplicar la fila de
--     membresía — `role_id` sigue siendo el rol operativo (sonido,
--     luces, etc.) y es un concepto distinto.
--   - Grupos ("party" que Phil no quiere mezclar) son un campo de texto
--     libre por gira (`tour_crew.party`), no una tabla de catálogo: el
--     doc no pide gestión de grupos como entidad, solo poder segmentar
--     visibilidad por ellos.
-- ============================================================

create table public.departments (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,
  sort_order integer     not null default 0
);

create table public.roles (
  id                 uuid    primary key default gen_random_uuid(),
  department_id      uuid    references public.departments(id) on delete set null,
  name               text    not null,
  description        text,
  is_department_head boolean not null default false
);

create index roles_department_id_idx on public.roles(department_id);

-- user_id nullable a propósito: crew freelance/invitado sin cuenta todavía
-- (doc "crew_members con user_id opcional"). El flujo de invitado sin
-- cuenta (enlace mágico) se resuelve en la capa de aplicación con el
-- cliente service-role, no con RLS directa sobre esta tabla.
create table public.crew_members (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users(id) on delete set null,
  full_name  text        not null,
  phone      text,
  email      text,
  created_at timestamptz not null default now()
);

create unique index crew_members_user_id_idx on public.crew_members(user_id) where user_id is not null;


create table public.tours (
  id              uuid        primary key default gen_random_uuid(),
  band_id         uuid        not null references public.bands(id) on delete cascade,
  name            text        not null,
  status          text        not null default 'planning'
    check (status in ('planning', 'active', 'completed', 'cancelled')),
  region          text,
  start_date      date,
  end_date        date,
  tour_manager_id uuid        references public.crew_members(id) on delete set null,
  created_by      uuid        references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index tours_band_id_idx on public.tours(band_id);

create trigger tours_updated_at
  before update on public.tours
  for each row execute function public.handle_updated_at();


-- Fecha de gira: venue_id nullable porque días de viaje/descanso no
-- tienen venue. Cuando sí lo tiene, TODA la info técnica cuelga del
-- venue (documents, reglas de labor heredadas) — la fecha solo referencia.
create table public.tour_dates (
  id               uuid        primary key default gen_random_uuid(),
  tour_id          uuid        not null references public.tours(id) on delete cascade,
  venue_id         uuid        references public.venues(id) on delete set null,
  show_date        date        not null,
  doors_time       time,
  show_time        time,
  status           text        not null default 'hold'
    check (status in ('hold', 'confirmed', 'cancelled', 'completed')),
  deal_type        text        check (deal_type in ('guarantee', 'split', 'buyout', 'hybrid')),
  guarantee_amount numeric,
  split_percentage numeric,
  currency         text        default 'MXN',
  advance_date     date,
  sequence_order   integer,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index tour_dates_tour_id_idx  on public.tour_dates(tour_id);
create index tour_dates_venue_id_idx on public.tour_dates(venue_id);
create index tour_dates_show_date_idx on public.tour_dates(show_date);

create trigger tour_dates_updated_at
  before update on public.tour_dates
  for each row execute function public.handle_updated_at();


create table public.tour_crew (
  id             uuid        primary key default gen_random_uuid(),
  tour_id        uuid        not null references public.tours(id) on delete cascade,
  crew_member_id uuid        not null references public.crew_members(id) on delete cascade,
  role_id        uuid        references public.roles(id) on delete set null,
  member_role    text        not null default 'member'
    check (member_role in ('admin', 'dept_head', 'member', 'guest')),
  reports_to     uuid        references public.tour_crew(id) on delete set null,
  party          text,
  status         text        not null default 'pending'
    check (status in ('confirmed', 'pending', 'denied')),
  start_date     date,
  end_date       date,
  created_at     timestamptz not null default now(),

  unique (tour_id, crew_member_id)
);

create index tour_crew_tour_id_idx    on public.tour_crew(tour_id);
create index tour_crew_reports_to_idx on public.tour_crew(reports_to);

-- ── Helpers de permisos (security definer: RLS no puede hacer joins
-- recursivos de forma barata sin esto) ──────────────────────────────
create or replace function public.is_tour_admin(p_tour_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.tour_crew tc
    join public.crew_members cm on cm.id = tc.crew_member_id
    where tc.tour_id = p_tour_id and cm.user_id = auth.uid() and tc.member_role = 'admin'
  ) or exists (
    select 1 from public.tours t
    join public.profiles p on p.id = t.created_by
    where t.id = p_tour_id and p.user_id = auth.uid()
  );
$$;

create or replace function public.is_tour_member(p_tour_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_tour_admin(p_tour_id) or exists (
    select 1 from public.tour_crew tc
    join public.crew_members cm on cm.id = tc.crew_member_id
    where tc.tour_id = p_tour_id and cm.user_id = auth.uid()
  );
$$;

revoke all on function public.is_tour_admin(uuid) from public;
revoke all on function public.is_tour_member(uuid) from public;
grant execute on function public.is_tour_admin(uuid) to authenticated;
grant execute on function public.is_tour_member(uuid) to authenticated;

alter table public.tours enable row level security;
create policy "tours_member_read" on public.tours for select using (public.is_tour_member(id));
create policy "tours_admin_write" on public.tours for all using (public.is_tour_admin(id));
create policy "tours_authenticated_insert" on public.tours for insert with check (
  created_by in (select id from public.profiles where user_id = auth.uid())
);

alter table public.tour_dates enable row level security;
create policy "tour_dates_member_read" on public.tour_dates for select using (public.is_tour_member(tour_id));
create policy "tour_dates_admin_write" on public.tour_dates for all using (public.is_tour_admin(tour_id));

alter table public.tour_crew enable row level security;
create policy "tour_crew_member_read" on public.tour_crew for select using (public.is_tour_member(tour_id));
create policy "tour_crew_admin_write" on public.tour_crew for all using (public.is_tour_admin(tour_id));


-- Generaliza el `visibility_grants` de v2 (antes solo tour_crew_id +
-- resource_type). El sujeto de la concesión depende de subject_type:
--   'person'     → subject_id = tour_crew.id (membresía en ESTA gira)
--   'department' → subject_id = departments.id
--   'role'       → subject_id = roles.id
--   'group'      → subject_id = el valor libre de tour_crew.party
-- resource_id es opcional: null = aplica a toda la sección
-- (resource_type), no-null = una fila concreta (ej. un hotel_room_assignment).
create table public.visibility_grants (
  id            uuid        primary key default gen_random_uuid(),
  tour_id       uuid        not null references public.tours(id) on delete cascade,
  subject_type  text        not null check (subject_type in ('person', 'group', 'department', 'role')),
  subject_id    text        not null,
  resource_type text        not null check (resource_type in (
    'labor', 'contactos', 'hospedaje', 'finanzas', 'documentos', 'hotel_room', 'itinerary'
  )),
  resource_id   uuid,
  scope         text        not null default 'tour_all'
    check (scope in ('self', 'department', 'tour_all', 'custom')),
  granted_by    uuid        references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index visibility_grants_tour_id_idx on public.visibility_grants(tour_id);
create index visibility_grants_resource_idx on public.visibility_grants(resource_type, resource_id);

alter table public.visibility_grants enable row level security;
create policy "visibility_grants_member_read" on public.visibility_grants for select using (public.is_tour_member(tour_id));
create policy "visibility_grants_admin_write" on public.visibility_grants for all using (public.is_tour_admin(tour_id));


-- Visibilidad del cuarto de hotel: replica en RLS la misma regla que
-- packages/data/src/tour/permissions.ts (canViewHotelRoom) aplica en la
-- capa de aplicación — admin siempre; si no, solo cuando default_scope
-- es 'department'/'tour_all', o hay un visibility_grants explícito
-- (resource_type='hotel_room', resource_id=esta fila) para ese sujeto.
create table public.hotel_room_assignments (
  id             uuid        primary key default gen_random_uuid(),
  tour_date_id   uuid        not null references public.tour_dates(id) on delete cascade,
  crew_member_id uuid        not null references public.crew_members(id) on delete cascade,
  hotel_name     text        not null,
  room_number    text,
  check_in       date,
  check_out      date,
  default_scope  text        not null default 'department'
    check (default_scope in ('self', 'department', 'tour_all', 'custom')),
  created_at     timestamptz not null default now()
);

create index hotel_room_assignments_tour_date_id_idx on public.hotel_room_assignments(tour_date_id);

alter table public.hotel_room_assignments enable row level security;

create policy "hotel_room_admin_write" on public.hotel_room_assignments for all using (
  public.is_tour_admin((select tour_id from public.tour_dates where id = tour_date_id))
);

create policy "hotel_room_scoped_read" on public.hotel_room_assignments for select using (
  public.is_tour_admin((select tour_id from public.tour_dates where id = tour_date_id))
  or (
    default_scope in ('department', 'tour_all')
    and public.is_tour_member((select tour_id from public.tour_dates where id = tour_date_id))
  )
  or exists (
    select 1 from public.visibility_grants vg
    where vg.resource_type = 'hotel_room'
      and vg.resource_id = hotel_room_assignments.id
      and vg.tour_id = (select tour_id from public.tour_dates where id = hotel_room_assignments.tour_date_id)
  )
);


create table public.guest_list_entries (
  id           uuid        primary key default gen_random_uuid(),
  tour_date_id uuid        not null references public.tour_dates(id) on delete cascade,
  guest_name   text        not null,
  added_by     uuid        references public.profiles(id) on delete set null,
  status       text        not null default 'pending'
    check (status in ('pending', 'confirmed', 'denied')),
  created_at   timestamptz not null default now()
);

create index guest_list_entries_tour_date_id_idx on public.guest_list_entries(tour_date_id);

alter table public.guest_list_entries enable row level security;
create policy "guest_list_member_read" on public.guest_list_entries for select using (
  public.is_tour_member((select tour_id from public.tour_dates where id = tour_date_id))
);
create policy "guest_list_member_write" on public.guest_list_entries for insert with check (
  public.is_tour_member((select tour_id from public.tour_dates where id = tour_date_id))
);
create policy "guest_list_admin_update" on public.guest_list_entries for update using (
  public.is_tour_admin((select tour_id from public.tour_dates where id = tour_date_id))
);


create table public.setlists (
  id           uuid        primary key default gen_random_uuid(),
  tour_date_id uuid        not null unique references public.tour_dates(id) on delete cascade,
  songs        jsonb       not null default '[]',
  updated_at   timestamptz not null default now()
);

alter table public.setlists enable row level security;
create policy "setlists_member_read" on public.setlists for select using (
  public.is_tour_member((select tour_id from public.tour_dates where id = tour_date_id))
);
create policy "setlists_admin_write" on public.setlists for all using (
  public.is_tour_admin((select tour_id from public.tour_dates where id = tour_date_id))
);


create table public.tour_vehicles (
  id         uuid        primary key default gen_random_uuid(),
  tour_id    uuid        not null references public.tours(id) on delete cascade,
  label      text        not null,
  vehicle_type text      check (vehicle_type in ('truck', 'bus', 'van')),
  load_order integer,
  created_at timestamptz not null default now()
);

create index tour_vehicles_tour_id_idx on public.tour_vehicles(tour_id);

alter table public.tour_vehicles enable row level security;
create policy "tour_vehicles_member_read" on public.tour_vehicles for select using (public.is_tour_member(tour_id));
create policy "tour_vehicles_admin_write" on public.tour_vehicles for all using (public.is_tour_admin(tour_id));


create table public.reminders (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  tour_date_id uuid        references public.tour_dates(id) on delete set null,
  remind_at    timestamptz not null,
  message      text        not null,
  dismissed_at timestamptz,
  created_at   timestamptz not null default now()
);

create index reminders_user_id_idx on public.reminders(user_id);

alter table public.reminders enable row level security;
create policy "reminders_owner_all" on public.reminders for all using (
  user_id in (select id from public.profiles where user_id = auth.uid())
);


create table public.tour_notes (
  id          uuid        primary key default gen_random_uuid(),
  tour_id     uuid        not null references public.tours(id) on delete cascade,
  entity_type text        not null check (entity_type in (
    'tour', 'tour_date', 'tour_crew', 'contract', 'provider', 'venue'
  )),
  entity_id   uuid        not null,
  body        text        not null,
  created_by  uuid        references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index tour_notes_tour_id_idx on public.tour_notes(tour_id);

alter table public.tour_notes enable row level security;
create policy "tour_notes_member_read" on public.tour_notes for select using (public.is_tour_member(tour_id));
create policy "tour_notes_member_insert" on public.tour_notes for insert with check (public.is_tour_member(tour_id));


-- Labor call MVP — "en escalones": solo captura el dato (puesto,
-- manos, entrada/salida). Sin validación contra jurisdictions/venue
-- todavía (doc: "primero se captura bien el dato").
create table public.labor_calls (
  id             uuid        primary key default gen_random_uuid(),
  tour_date_id   uuid        not null references public.tour_dates(id) on delete cascade,
  department_id  uuid        references public.departments(id) on delete set null,
  position_title text        not null,
  headcount      integer     not null default 1,
  call_time      time        not null,
  end_time       time,
  notes          text,
  created_at     timestamptz not null default now()
);

create index labor_calls_tour_date_id_idx on public.labor_calls(tour_date_id);

alter table public.labor_calls enable row level security;
create policy "labor_calls_member_read" on public.labor_calls for select using (
  public.is_tour_member((select tour_id from public.tour_dates where id = tour_date_id))
);
create policy "labor_calls_admin_write" on public.labor_calls for all using (
  public.is_tour_admin((select tour_id from public.tour_dates where id = tour_date_id))
);
