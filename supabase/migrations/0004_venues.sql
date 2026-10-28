-- ============================================================
-- GigBridge unificado — 0004: venues (entidad central del MVP)
--
-- Port de v1 (schema_master.sql + 20260614_venue_enhancements.sql +
-- 20260615_venue_rooms.sql + 20260613_venue_completeness_score.sql +
-- 20260613_venue_views.sql) más los campos nuevos que pide el doc de
-- estrategia y que la auditoría confirmó que NO existen todavía en v1:
-- `management_type`, `contact_visibility`, jurisdicción/reglas de labor
-- heredadas, y el estado de "claim" (propiedad compartida).
--
-- stage_plot_pdf_url / technical_rider_pdf_url de v1 NO se portan como
-- columnas sueltas: esos documentos ahora viven en la tabla polimórfica
-- `documents` (0006_documents.sql) para que tengan versión, vigencia y
-- autor como cualquier otro documento del expediente del venue.
-- ============================================================

create table public.venues (
  id              uuid        primary key default gen_random_uuid(),
  owner_id        uuid        references public.profiles(id) on delete cascade,
  slug            text        unique not null,

  name            text        not null,
  description     text,
  logo_url        text,
  cover_photo_url text,
  photos          text[]      default '{}',

  instagram_url   text,
  facebook_url    text,
  twitter_url     text,
  tiktok_url      text,
  website_url     text,

  address         text,
  city            text        not null,
  state_region    text,
  country         text        default 'MX',
  google_maps_url text,

  capacity              integer,
  venue_type            text        not null default 'live_venue'
    check (venue_type in ('live_venue', 'rehearsal_studio', 'hybrid')),
  stage_width_m         numeric(5,2),
  stage_depth_m         numeric(5,2),
  stage_height_m        numeric(5,2),
  stage_surface         text,
  stage_load_kg_per_m2  integer,
  stage_notes           text,

  power_outlets_stage   integer     default 0,
  power_voltage         integer     default 127,
  has_ground_connection boolean     default false,
  has_backup_generator  boolean     default false,
  power_notes           text,

  has_pa          boolean     default false,
  pa_brand        text,
  pa_model        text,
  pa_watts        integer,
  pa_max_db       integer,
  has_frontfills  boolean     default false,
  has_outfills    boolean     default false,
  has_subwoofers  boolean     default false,
  pa_notes        text,

  has_foh_console      boolean     default false,
  foh_console_brand    text,
  foh_console_model    text,
  foh_console_type     text        check (foh_console_type in ('analog', 'digital')),
  foh_console_channels integer,
  foh_console_outputs  integer,
  foh_max_distance_m   integer,

  floor_monitors_count  integer     default 0,
  floor_monitor_brand   text,
  floor_monitor_model   text,
  sidefills_count       integer     default 0,
  has_in_ear_system     boolean     default false,
  monitor_notes         text,

  microphones           jsonb       default '[]',

  mic_stands_boom       integer     default 0,
  mic_stands_straight   integer     default 0,
  mic_stands_short      integer     default 0,
  di_boxes_count        integer     default 0,

  has_backline_loan     boolean     default false,
  backline              jsonb       default '[]',

  has_lighting          boolean     default false,
  lighting_notes        text,
  has_lighting_engineer boolean     default false,

  has_audio_engineer    boolean     default false,
  has_stage_manager     boolean     default false,

  -- rehearsal-studio-specific (venue_type = 'rehearsal_studio' | 'hybrid')
  soundproofing_level      text
    check (soundproofing_level in ('none','basic','professional','studio_grade')),
  acoustic_treatment_type  text,
  hourly_rate              numeric,
  lockers_available        boolean     not null default false,
  has_reception            boolean     not null default false,

  -- reglas de booking
  cancellation_policy         text,
  load_in_time_limit_minutes  integer,
  curfew_time                 time,

  -- carga/descarga y logística
  has_loading_dock       boolean     not null default false,
  ground_floor_access    boolean     not null default true,
  parking_availability   text
    check (parking_availability in ('none','street','private_lot','van_trailer_accessible')),

  -- backstage
  has_green_room         boolean     not null default false,
  wifi_speed_mbps         numeric,
  has_private_restroom   boolean     not null default false,

  -- accesibilidad
  wheelchair_accessible  boolean     not null default false,
  accessible_restroom    boolean     not null default false,
  accessibility_notes    text,

  -- multimedia
  promo_video_url        text,

  -- verificación por admin
  is_verified           boolean     default false,
  verified_at           timestamptz,
  verified_by           uuid        references public.profiles(id),
  verification_status   text        check (verification_status in (
    'unsubmitted', 'pending', 'approved', 'rejected'
  )) default 'unsubmitted',
  verification_notes    text,

  -- propiedad / claim (nuevo — doc "Propiedad y claim")
  management_type       text        not null default 'independent'
    check (management_type in ('independent', 'managed', 'hybrid')),
  claim_status           text        not null default 'unclaimed'
    check (claim_status in ('unclaimed', 'pending', 'claimed')),
  contact_visibility     text        not null default 'verified_pros'
    check (contact_visibility in ('public', 'verified_pros', 'tour_members')),

  -- reglas de labor (nuevo — hereda de la jurisdicción, el venue sobreescribe)
  jurisdiction_id        uuid        references public.jurisdictions(id) on delete set null,
  labor_rule_overrides   jsonb       not null default '{}',

  -- discovery
  is_discoverable       boolean     default true,
  price_per_event_min   integer,
  price_per_event_max   integer,
  currency              text        default 'MXN',
  genres_hosted         text[]      default '{}',
  completeness_score    integer     not null default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index venues_slug_idx         on public.venues(slug);
create index        venues_owner_id_idx     on public.venues(owner_id);
create index        venues_city_idx         on public.venues(city);
create index        venues_discoverable_idx on public.venues(is_discoverable) where is_discoverable = true;
create index        venues_jurisdiction_idx on public.venues(jurisdiction_id);

create trigger venues_updated_at
  before update on public.venues
  for each row execute function public.handle_updated_at();

alter table public.venues enable row level security;

create policy "venue owner full access" on public.venues
  for all using (
    owner_id in (select id from public.profiles where user_id = auth.uid())
  );

create policy "public read discoverable venues" on public.venues
  for select using (is_discoverable = true);

create policy "admin full access to venues" on public.venues
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true)
  );


create table public.venue_rooms (
  id                    uuid        primary key default gen_random_uuid(),
  venue_id              uuid        not null references public.venues(id) on delete cascade,
  name                  text        not null default 'Sala Principal',
  description           text,
  stage_plot_elements   jsonb       not null default '[]',
  stage_plot_pdf_url    text,
  sort_order            integer     not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index venue_rooms_venue_id_idx on public.venue_rooms(venue_id);

create trigger venue_rooms_updated_at
  before update on public.venue_rooms
  for each row execute function public.handle_updated_at();

alter table public.venue_rooms enable row level security;

create policy "venue_rooms_public_read" on public.venue_rooms
  for select using (
    exists (select 1 from public.venues where id = venue_rooms.venue_id and is_discoverable = true)
  );

create policy "venue_rooms_owner_all" on public.venue_rooms
  for all using (
    exists (
      select 1 from public.venues v
      join public.profiles p on v.owner_id = p.id
      where v.id = venue_rooms.venue_id and p.user_id = auth.uid()
    )
  );


create table public.venue_availability_blocks (
  id              uuid        primary key default gen_random_uuid(),
  venue_id        uuid        not null references public.venues(id) on delete cascade,
  day_of_week     integer     not null check (day_of_week between 0 and 6),
  start_time      time        not null,
  end_time        time        not null,
  block_type      text        not null default 'available'
    check (block_type in ('available','blocked')),
  notes           text,
  created_at      timestamptz not null default now()
);

create index venue_availability_blocks_venue_id_idx on public.venue_availability_blocks(venue_id);

alter table public.venue_availability_blocks enable row level security;

create policy "venue_availability_owner_all" on public.venue_availability_blocks
  for all using (
    exists (
      select 1 from public.venues v
      join public.profiles p on v.owner_id = p.id
      where v.id = venue_availability_blocks.venue_id and p.user_id = auth.uid()
    )
  );

create policy "venue_availability_public_read" on public.venue_availability_blocks
  for select using (true);


create table public.venue_views (
  id           uuid        primary key default gen_random_uuid(),
  venue_id     uuid        not null references public.venues(id) on delete cascade,
  viewed_at    timestamptz not null default now(),
  country      text,
  city         text,
  source       text,
  referrer_url text
);

create index venue_views_venue_id_idx  on public.venue_views(venue_id);
create index venue_views_viewed_at_idx on public.venue_views(viewed_at);

alter table public.venue_views enable row level security;

create policy "venue_views_owner_select" on public.venue_views
  for select using (
    venue_id in (
      select v.id from public.venues v
      join public.profiles p on v.owner_id = p.id
      where p.user_id = auth.uid()
    )
  );


-- Cubre tanto la verificación original de v1 como el flujo nuevo de
-- "reclamar perfil" (`request_type = 'claim'`): un venue creado por
-- GigBridge (owner_id null o admin) pasa a `management_type = 'hybrid'`
-- y `claim_status = 'claimed'` cuando un admin aprueba la solicitud.
create table public.venue_verification_requests (
  id           uuid        primary key default gen_random_uuid(),
  venue_id     uuid        references public.venues(id) on delete cascade,
  request_type text        not null default 'verification'
    check (request_type in ('verification', 'claim')),
  submitted_by uuid        references public.profiles(id) on delete set null,
  submitted_at timestamptz default now(),
  admin_notes  text,
  status       text        check (status in ('pending', 'approved', 'rejected')) default 'pending',
  reviewed_at  timestamptz,
  reviewed_by  uuid        references public.profiles(id)
);

create index venue_verif_venue_id_idx on public.venue_verification_requests(venue_id);
create index venue_verif_status_idx   on public.venue_verification_requests(status);

alter table public.venue_verification_requests enable row level security;

create policy "owner can read own verification requests" on public.venue_verification_requests
  for select using (
    venue_id in (
      select v.id from public.venues v
      join public.profiles p on v.owner_id = p.id
      where p.user_id = auth.uid()
    )
    or submitted_by in (select id from public.profiles where user_id = auth.uid())
  );

create policy "authenticated can submit verification or claim requests" on public.venue_verification_requests
  for insert with check (
    submitted_by in (select id from public.profiles where user_id = auth.uid())
  );

create policy "admin full access to verification requests" on public.venue_verification_requests
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true)
  );
