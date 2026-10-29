-- ============================================================
-- GigBridge unificado — 0016: las secciones de la gira que solo
-- existían en el mock (mockData.ts) pasan a tablas
--
--   venue_contacts     contactos del venue (producción, seguridad…).
--                      Son del venue, no de la gira: se reusan en todas
--                      las giras que tocan ahí. Su lectura respeta
--                      venues.contact_visibility, que hasta ahora solo
--                      se mostraba como etiqueta.
--   tour_contacts      directorio externo de la gira: promotor, hotel,
--                      proveedor, otros.
--   tour_providers     proveedores, separados en los cuatro grupos de la
--                      pestaña Proveedores (recinto/local/general/vetado).
--   tour_vacancies     puestos sin cubrir (Equipo › Áreas).
--   tour_travel_legs   vuelos y traslados de una fecha (Itinerario de
--                      viaje). Los vehículos de la gira NO van aquí:
--                      son el orden de carga (tour_vehicles).
--
-- Y `add_tour_reminder()`: los recordatorios (tabla de 0006) se capturan
-- como hora local de la fecha; la conversión a timestamptz necesita la
-- zona de la fecha (0012), así que se hace en SQL y no en cada cliente.
--
-- Permisos (matriz de 0015): leer = miembro (el directorio externo y los
-- proveedores, solo quien no es invitado); escribir = admin de la gira,
-- y las vacantes también el jefe del departamento.
-- ============================================================

create table public.venue_contacts (
  id         uuid        primary key default gen_random_uuid(),
  venue_id   uuid        not null references public.venues(id) on delete cascade,
  name       text        not null,
  role       text,
  email      text,
  phone      text,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

create index venue_contacts_venue_id_idx on public.venue_contacts(venue_id);

alter table public.venue_contacts enable row level security;

-- Solo `authenticated`: is_tour_member_at_venue (0014) no está concedida a
-- anon y, evaluada en una policy, rompería la lectura completa (ver 0011).
-- La página pública del venue no muestra contactos todavía.
create policy "venue_contacts_read" on public.venue_contacts for select to authenticated using (
  public.is_admin()
  or exists (
    select 1 from public.venues v
    where v.id = venue_contacts.venue_id
      and (
        v.owner_id in (select id from public.profiles where user_id = auth.uid())
        or (v.contact_visibility = 'public' and v.is_discoverable)
        or (
          v.contact_visibility = 'verified_pros' and v.is_discoverable and exists (
            select 1 from public.profiles p where p.user_id = auth.uid() and p.subscription_tier <> 'free_unverified'
          )
        )
      )
  )
  -- El crew de una gira con fecha en el venue ve sus contactos sea cual sea la visibilidad.
  or public.is_tour_member_at_venue(venue_id)
);

create policy "venue_contacts_owner_write" on public.venue_contacts for all
  using (
    public.is_admin()
    or venue_id in (
      select v.id from public.venues v join public.profiles p on p.id = v.owner_id where p.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or venue_id in (
      select v.id from public.venues v join public.profiles p on p.id = v.owner_id where p.user_id = auth.uid()
    )
  );


create table public.tour_contacts (
  id           uuid        primary key default gen_random_uuid(),
  tour_id      uuid        not null references public.tours(id) on delete cascade,
  contact_type text        not null default 'other'
    check (contact_type in ('promoter', 'hotel', 'vendor', 'other')),
  name         text        not null,
  role         text,
  email        text,
  phone        text,
  note         text,
  created_at   timestamptz not null default now()
);

create index tour_contacts_tour_id_idx on public.tour_contacts(tour_id);

alter table public.tour_contacts enable row level security;
create policy "tour_contacts_contributor_read" on public.tour_contacts for select using (public.is_tour_contributor(tour_id));
create policy "tour_contacts_admin_write" on public.tour_contacts for all
  using (public.is_tour_admin(tour_id)) with check (public.is_tour_admin(tour_id));


create table public.tour_providers (
  id           uuid        primary key default gen_random_uuid(),
  tour_id      uuid        not null references public.tours(id) on delete cascade,
  -- Con venue: proveedor ligado a ese recinto (autorizado, local o vetado ahí).
  venue_id     uuid        references public.venues(id) on delete set null,
  bucket       text        not null default 'general'
    check (bucket in ('recinto', 'local', 'general', 'vetado')),
  name         text        not null,
  service      text        not null,
  contact_name text,
  city         text,
  email        text,
  phone        text,
  note         text,
  created_at   timestamptz not null default now()
);

create index tour_providers_tour_id_idx on public.tour_providers(tour_id);

alter table public.tour_providers enable row level security;
create policy "tour_providers_contributor_read" on public.tour_providers for select using (public.is_tour_contributor(tour_id));
create policy "tour_providers_admin_write" on public.tour_providers for all
  using (public.is_tour_admin(tour_id)) with check (public.is_tour_admin(tour_id));


create table public.tour_vacancies (
  id            uuid        primary key default gen_random_uuid(),
  tour_id       uuid        not null references public.tours(id) on delete cascade,
  role_title    text        not null,
  department_id uuid        references public.departments(id) on delete set null,
  party         text,
  created_at    timestamptz not null default now()
);

create index tour_vacancies_tour_id_idx on public.tour_vacancies(tour_id);

alter table public.tour_vacancies enable row level security;
create policy "tour_vacancies_member_read" on public.tour_vacancies for select using (public.is_tour_member(tour_id));
create policy "tour_vacancies_admin_write" on public.tour_vacancies for all
  using (public.is_tour_admin(tour_id)) with check (public.is_tour_admin(tour_id));
create policy "tour_vacancies_dept_head_write" on public.tour_vacancies for all
  using (public.is_tour_dept_head(tour_id, department_id))
  with check (public.is_tour_dept_head(tour_id, department_id));


create table public.tour_travel_legs (
  id           uuid        primary key default gen_random_uuid(),
  tour_date_id uuid        not null references public.tour_dates(id) on delete cascade,
  kind         text        not null default 'ground' check (kind in ('flight', 'ground', 'other')),
  title        text        not null,
  departs_at   time,
  details      text,
  note         text,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now()
);

create index tour_travel_legs_tour_date_id_idx on public.tour_travel_legs(tour_date_id);

alter table public.tour_travel_legs enable row level security;
create policy "tour_travel_legs_member_read" on public.tour_travel_legs for select using (
  public.is_tour_member((select tour_id from public.tour_dates where id = tour_date_id))
);
create policy "tour_travel_legs_admin_write" on public.tour_travel_legs for all
  using (public.is_tour_admin((select tour_id from public.tour_dates where id = tour_date_id)))
  with check (public.is_tour_admin((select tour_id from public.tour_dates where id = tour_date_id)));


-- Recordatorio personal a una hora local de la fecha. Las horas antes de
-- las 05:00 cuentan como la madrugada siguiente (un load-out a las 00:15
-- es después del show, no antes). security invoker: la RLS de
-- tour_dates (ser miembro) y de reminders (dueño) sigue aplicando.
create or replace function public.add_tour_reminder(p_tour_date_id uuid, p_local_time time, p_message text)
returns uuid
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_profile uuid;
  v_date date;
  v_id uuid;
begin
  select id into v_profile from public.profiles where user_id = auth.uid();
  select show_date into v_date from public.tour_dates where id = p_tour_date_id;
  if v_profile is null or v_date is null then
    return null;
  end if;
  if p_local_time < time '05:00' then
    v_date := v_date + 1;
  end if;
  insert into public.reminders (user_id, tour_date_id, remind_at, message)
  values (v_profile, p_tour_date_id, (v_date + p_local_time) at time zone public.tour_date_timezone(p_tour_date_id), btrim(p_message))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.add_tour_reminder(uuid, time, text) from public;
grant execute on function public.add_tour_reminder(uuid, time, text) to authenticated;
