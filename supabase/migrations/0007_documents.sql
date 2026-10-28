-- ============================================================
-- GigBridge unificado — 0007: documentos versionados y polimórficos
--
-- El diferenciador frente a Master Tour (doc "Área 2 — Venues"). Una
-- sola tabla `documents` + `document_versions` sirve para el expediente
-- técnico del venue, los documentos de una gira/fecha y (a futuro) los
-- de una banda o un crew member — en vez de una tabla `riders`/
-- `rider_versions` por caso de uso, que es lo que tenía v2.
--
-- NO reemplaza `public.riders` (0002_bands.sql): ese es el rider
-- ESTRUCTURADO del artista para el motor de compatibilidad. Aquí un
-- "rider técnico" es un documento_type más (un PDF con versión y
-- vigencia) que puede colgar de un venue.
-- ============================================================

create table public.document_types (
  id                   uuid    primary key default gen_random_uuid(),
  key                  text    not null unique,
  label                text    not null,
  default_owner_types  text[]  not null default '{}',
  default_validity_days integer,
  sort_order           integer not null default 0
);

insert into public.document_types (key, label, default_owner_types, default_validity_days, sort_order) values
  ('rider_tecnico',      'Rider técnico',                 '{venue,band}', 180, 1),
  ('stage_plot',         'Stage plot',                     '{venue,band}', 180, 2),
  ('rigging_plot',       'Rigging plot',                   '{venue}',      180, 3),
  ('patch_list',         'Patch list',                     '{venue,band}', 180, 4),
  ('reglamento_interno', 'Reglamento interno',             '{venue}',      365, 5),
  ('mapa_camerinos',     'Mapa de camerinos y oficinas',   '{venue}',      365, 6),
  ('catering',           'Horarios de catering',           '{venue}',      365, 7),
  ('loading_dock',       'Loading dock / indicaciones de llegada', '{venue}', 365, 8);

create table public.documents (
  id                 uuid        primary key default gen_random_uuid(),
  owner_type         text        not null check (owner_type in ('venue', 'band', 'tour', 'tour_date', 'crew')),
  owner_id           uuid        not null,
  document_type_id   uuid        not null references public.document_types(id),
  title              text        not null,
  -- Visibilidad por defecto según el bloque del expediente (doc, tabla
  -- "Contenido del expediente"): pública, solo profesionales
  -- verificados/giras con fecha en el venue, solo giras con fecha, o
  -- solo el dueño.
  visibility         text        not null default 'owner_only'
    check (visibility in ('public', 'verified_pros', 'tour_members', 'owner_only')),
  current_version_id uuid,
  created_by         uuid        references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index documents_owner_idx on public.documents(owner_type, owner_id);

create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();


create table public.document_versions (
  id            uuid        primary key default gen_random_uuid(),
  document_id   uuid        not null references public.documents(id) on delete cascade,
  version_number integer    not null,
  file_url      text        not null,
  valid_from    date        not null default current_date,
  valid_until   date,
  change_notes  text,
  uploaded_by   uuid        references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),

  unique (document_id, version_number)
);

create index document_versions_document_id_idx on public.document_versions(document_id);

alter table public.documents
  add constraint documents_current_version_fkey
  foreign key (current_version_id) references public.document_versions(id) on delete set null;


-- Botón "solicitar actualización" (doc, sección "Versionado y vigencia").
create table public.document_update_requests (
  id           uuid        primary key default gen_random_uuid(),
  document_id  uuid        not null references public.documents(id) on delete cascade,
  requested_by uuid        references public.profiles(id) on delete set null,
  requested_at timestamptz not null default now(),
  status       text        not null default 'pending' check (status in ('pending', 'resolved')),
  resolved_at  timestamptz,
  resolved_by  uuid        references public.profiles(id) on delete set null
);

create index document_update_requests_document_id_idx on public.document_update_requests(document_id);


-- Referencia en vivo, no copia (doc, sección 3): al armar una fecha
-- contra un venue, se guarda qué versión consultó el equipo. Si
-- documents.current_version_id ya no coincide con seen_version_id, la
-- UI muestra "hay una versión más reciente".
create table public.tour_date_document_refs (
  id               uuid        primary key default gen_random_uuid(),
  tour_date_id     uuid        not null references public.tour_dates(id) on delete cascade,
  document_id      uuid        not null references public.documents(id) on delete cascade,
  seen_version_id  uuid        references public.document_versions(id) on delete set null,
  created_at       timestamptz not null default now(),

  unique (tour_date_id, document_id)
);

create index tour_date_document_refs_tour_date_id_idx on public.tour_date_document_refs(tour_date_id);


-- ── Helper de acceso: unifica los 5 owner_type posibles ─────────────
create or replace function public.can_access_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    d.visibility = 'public'
    or (
      d.owner_type = 'venue' and exists (
        select 1 from public.venues v
        join public.profiles p on p.id = v.owner_id
        where v.id = d.owner_id and p.user_id = auth.uid()
      )
    )
    or (
      d.owner_type = 'venue' and d.visibility = 'tour_members' and exists (
        select 1 from public.tour_dates td
        where td.venue_id = d.owner_id and public.is_tour_member(td.tour_id)
      )
    )
    or (
      d.owner_type = 'venue' and d.visibility = 'verified_pros' and exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and p.subscription_tier <> 'free_unverified'
      )
    )
    or (
      d.owner_type = 'band' and exists (
        select 1 from public.bands b
        join public.profiles p on p.id = b.profile_id
        where b.id = d.owner_id and p.user_id = auth.uid()
      )
    )
    or (d.owner_type = 'tour' and public.is_tour_member(d.owner_id))
    or (
      d.owner_type = 'tour_date' and exists (
        select 1 from public.tour_dates td where td.id = d.owner_id and public.is_tour_member(td.tour_id)
      )
    )
    or (
      d.owner_type = 'crew' and exists (
        select 1 from public.crew_members cm where cm.id = d.owner_id and cm.user_id = auth.uid()
      )
    )
  from public.documents d
  where d.id = p_document_id
$$;

create or replace function public.can_manage_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (
      d.owner_type = 'venue' and exists (
        select 1 from public.venues v
        join public.profiles p on p.id = v.owner_id
        where v.id = d.owner_id and p.user_id = auth.uid()
      )
    )
    or (
      d.owner_type = 'band' and exists (
        select 1 from public.bands b
        join public.profiles p on p.id = b.profile_id
        where b.id = d.owner_id and p.user_id = auth.uid()
      )
    )
    or (d.owner_type in ('tour', 'tour_date') and public.is_tour_admin(
      case when d.owner_type = 'tour' then d.owner_id
           else (select td.tour_id from public.tour_dates td where td.id = d.owner_id) end
    ))
    or exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true)
  from public.documents d
  where d.id = p_document_id
$$;

revoke all on function public.can_access_document(uuid) from public;
revoke all on function public.can_manage_document(uuid) from public;
grant execute on function public.can_access_document(uuid) to authenticated, anon;
grant execute on function public.can_manage_document(uuid) to authenticated;

alter table public.document_types enable row level security;
create policy "document_types_public_read" on public.document_types for select using (true);

alter table public.documents enable row level security;
create policy "documents_read" on public.documents for select using (public.can_access_document(id));
create policy "documents_manage" on public.documents for all using (public.can_manage_document(id));

alter table public.document_versions enable row level security;
create policy "document_versions_read" on public.document_versions for select using (
  public.can_access_document(document_id)
);
create policy "document_versions_manage" on public.document_versions for all using (
  public.can_manage_document(document_id)
);

alter table public.document_update_requests enable row level security;
create policy "document_update_requests_read" on public.document_update_requests for select using (
  public.can_access_document(document_id) or public.can_manage_document(document_id)
);
create policy "document_update_requests_insert" on public.document_update_requests for insert with check (
  public.can_access_document(document_id)
);
create policy "document_update_requests_manage" on public.document_update_requests for update using (
  public.can_manage_document(document_id)
);

alter table public.tour_date_document_refs enable row level security;
create policy "tour_date_document_refs_member_read" on public.tour_date_document_refs for select using (
  exists (select 1 from public.tour_dates td where td.id = tour_date_id and public.is_tour_member(td.tour_id))
);
create policy "tour_date_document_refs_admin_write" on public.tour_date_document_refs for all using (
  exists (select 1 from public.tour_dates td where td.id = tour_date_id and public.is_tour_admin(td.tour_id))
);
