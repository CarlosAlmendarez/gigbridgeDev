-- ============================================================
-- GigBridge unificado — 0002: bands, riders (estructurados) y
-- artefactos de artista (input lists, stage plots, availability)
--
-- Port literal de v1. `riders` aquí es el rider ESTRUCTURADO del artista
-- (items con nivel must/desirable/flexible, usado por el motor de
-- compatibilidad contra el inventario del venue) — NO es lo mismo que
-- los documentos técnicos versionados del venue (ver 0005_documents.sql).
-- El plan pide mover `rider_versions` (concepto de v2, un PDF de rider por
-- gira) al sistema de documentos polimórfico; este `riders` estructurado
-- de v1 se queda igual porque resuelve un problema distinto (matching).
-- ============================================================

create table public.bands (
  id                    uuid        primary key default gen_random_uuid(),
  profile_id            uuid        not null references public.profiles(id) on delete cascade,
  name                  text        not null,
  genre                 text,

  genres                text[]      default '{}',
  city                  text,
  state_region          text,
  country               text        default 'MX',
  has_own_pa            boolean     default false,
  has_own_lighting      boolean     default false,
  price_min             integer,
  price_max             integer,
  currency              text        default 'MXN',
  is_discoverable       boolean     default true,
  profile_photo_url     text,
  cover_photo_url       text,
  formation             jsonb       not null default '[]',

  is_verified           boolean     not null default false,
  verified_at           timestamptz,
  verified_by           uuid        references public.profiles(id) on delete set null,
  verification_status   text        not null default 'unsubmitted'
    check (verification_status in ('unsubmitted', 'pending', 'approved', 'rejected')),
  verification_notes    text,

  subscription_tier     text        not null default 'free_unverified'
    check (subscription_tier in ('free_unverified', 'free_verified', 'pro', 'max')),

  video_url             text,

  active_since          integer,
  formation_type        text
    check (formation_type is null or formation_type in (
      'solo', 'duo', 'trio', 'quartet', 'quintet', 'large_band'
    )),

  epk_photos            jsonb       default '[]',
  featured_video_label  text,
  releases              jsonb       default '[]',
  shows                 jsonb       default '[]',
  press_quotes          jsonb       default '[]',

  spotify_listeners     integer,
  instagram_followers   integer,
  youtube_subscribers   integer,
  tiktok_followers      integer,
  facebook_followers    integer,
  metrics_updated_at    timestamptz,

  base_price            integer,
  price_currency        text        default 'MXN',
  price_negotiable      boolean     default false,
  set_duration_min      integer,
  set_duration_max      integer,
  setup_time            integer,
  has_full_backline     boolean     default false,
  territories           jsonb       default '[]',

  booking_email         text,
  booking_phone         text,
  facebook_url          text,
  tiktok_url            text,
  soundcloud_url        text,
  bandcamp_url          text,

  completeness_score    integer     default 0,
  epk_published         boolean     default true,
  epk_updated_at        timestamptz default now(),

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index bands_profile_id_idx        on public.bands(profile_id);
create index bands_genres_idx            on public.bands using gin(genres);
create index bands_city_idx              on public.bands(city);
create index bands_discoverable_idx      on public.bands(is_discoverable);
create index bands_verification_status_idx on public.bands(verification_status);

create trigger bands_updated_at
  before update on public.bands
  for each row execute function public.handle_updated_at();

alter table public.bands enable row level security;

create policy "bands_public_read" on public.bands
  for select using (true);

create policy "bands_owner_insert" on public.bands
  for insert with check (
    auth.uid() = (select user_id from public.profiles where id = profile_id)
  );

create policy "bands_owner_update" on public.bands
  for update using (
    auth.uid() = (select user_id from public.profiles where id = profile_id)
  );

create policy "bands_owner_delete" on public.bands
  for delete using (
    auth.uid() = (select user_id from public.profiles where id = profile_id)
  );


create table public.riders (
  id           uuid        primary key default gen_random_uuid(),
  profile_id   uuid        not null references public.profiles(id) on delete cascade,
  band_id      uuid        references public.bands(id) on delete set null,
  title        text        not null default 'Rider técnico',
  items        jsonb       not null default '[]',
  notes        text,
  pin          text,
  is_published boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index riders_profile_id_idx on public.riders(profile_id);

create trigger riders_updated_at
  before update on public.riders
  for each row execute function public.handle_updated_at();

alter table public.riders enable row level security;

create policy "riders_public_read" on public.riders
  for select using (
    is_published = true
    or auth.uid() = (select user_id from public.profiles where id = profile_id)
  );

create policy "riders_owner_insert" on public.riders
  for insert with check (
    auth.uid() = (select user_id from public.profiles where id = profile_id)
  );

create policy "riders_owner_update" on public.riders
  for update using (
    auth.uid() = (select user_id from public.profiles where id = profile_id)
  );

create policy "riders_owner_delete" on public.riders
  for delete using (
    auth.uid() = (select user_id from public.profiles where id = profile_id)
  );


create table public.input_lists (
  id         uuid        primary key default gen_random_uuid(),
  profile_id uuid        not null references public.profiles(id) on delete cascade,
  rider_id   uuid        references public.riders(id) on delete set null,
  title      text        not null default 'Input list',
  channels   jsonb       not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index input_lists_profile_id_idx on public.input_lists(profile_id);

create trigger input_lists_updated_at
  before update on public.input_lists
  for each row execute function public.handle_updated_at();

alter table public.input_lists enable row level security;

create policy "input_lists_owner_all" on public.input_lists
  for all using (
    auth.uid() = (select user_id from public.profiles where id = profile_id)
  );


create table public.stage_plots (
  id         uuid        primary key default gen_random_uuid(),
  profile_id uuid        not null references public.profiles(id) on delete cascade,
  title      text        not null default 'Stage plot',
  elements   jsonb       not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stage_plots_profile_id_idx on public.stage_plots(profile_id);

create trigger stage_plots_updated_at
  before update on public.stage_plots
  for each row execute function public.handle_updated_at();

alter table public.stage_plots enable row level security;

create policy "stage_plots_owner_all" on public.stage_plots
  for all using (
    auth.uid() = (select user_id from public.profiles where id = profile_id)
  );


create table public.availability (
  id         uuid           primary key default gen_random_uuid(),
  profile_id uuid           not null references public.profiles(id) on delete cascade,
  date       date           not null,
  status     booking_status not null default 'available',
  city       text,
  notes      text,
  event_id   uuid,
  created_at timestamptz    not null default now(),

  unique(profile_id, date)
);

create index availability_profile_id_idx on public.availability(profile_id);
create index availability_date_idx       on public.availability(date);

alter table public.availability enable row level security;

create policy "availability_public_read" on public.availability
  for select using (true);

create policy "availability_owner_write" on public.availability
  for insert with check (
    auth.uid() = (select user_id from public.profiles where id = profile_id)
  );

create policy "availability_owner_update" on public.availability
  for update using (
    auth.uid() = (select user_id from public.profiles where id = profile_id)
  );

create policy "availability_owner_delete" on public.availability
  for delete using (
    auth.uid() = (select user_id from public.profiles where id = profile_id)
  );


create table public.band_verification_requests (
  id           uuid        primary key default gen_random_uuid(),
  band_id      uuid        not null references public.bands(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  status       text        not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_notes  text,
  reviewed_at  timestamptz,
  reviewed_by  uuid        references public.profiles(id) on delete set null
);

create index band_verification_requests_band_id_idx on public.band_verification_requests(band_id);
create index band_verification_requests_status_idx  on public.band_verification_requests(status);

alter table public.band_verification_requests enable row level security;

create policy "band owner can read own requests" on public.band_verification_requests
  for select using (
    exists (
      select 1 from public.bands b
      join public.profiles p on p.id = b.profile_id
      where b.id = band_verification_requests.band_id
        and p.user_id = auth.uid()
    )
  );


create table public.pdf_export_logs (
  id          uuid        primary key default gen_random_uuid(),
  band_id     uuid        not null references public.bands(id) on delete cascade,
  rider_id    uuid        references public.riders(id) on delete set null,
  exported_at timestamptz not null default now()
);

create index pdf_export_logs_band_month_idx on public.pdf_export_logs(band_id, exported_at);

alter table public.pdf_export_logs enable row level security;

create policy "band owner can read own pdf logs" on public.pdf_export_logs
  for select using (
    exists (
      select 1 from public.bands b
      join public.profiles p on p.id = b.profile_id
      where b.id = pdf_export_logs.band_id
        and p.user_id = auth.uid()
    )
  );

create policy "band owner can insert own pdf logs" on public.pdf_export_logs
  for insert with check (
    exists (
      select 1 from public.bands b
      join public.profiles p on p.id = b.profile_id
      where b.id = pdf_export_logs.band_id
        and p.user_id = auth.uid()
    )
  );
