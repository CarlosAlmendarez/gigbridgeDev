-- ============================================================
-- GigBridge unificado — 0005: booking, eventos (mapa/discovery),
-- notificaciones y push. Port literal de v1 — nada de esto cambia
-- de forma con el giro "venue al centro", solo pasa a vivir en el
-- mismo proyecto Supabase que el resto.
-- ============================================================

create table public.booking_requests (
  id                   uuid        primary key default gen_random_uuid(),
  profile_id           uuid        not null references public.profiles(id) on delete cascade,
  requester_id         uuid        references public.profiles(id) on delete set null,
  requester_name       text,
  requester_email      text,
  event_date           date        not null,
  event_type           text        not null,
  venue_name           text        not null,
  venue_city           text        not null,
  venue_capacity       integer,
  venue_address        text,
  budget_min           integer,
  budget_max           integer,
  currency             text        default 'MXN',
  set_duration_minutes integer,
  load_in_time         time,
  soundcheck_time      time,
  show_time            time        not null,
  has_pa               boolean     default false,
  pa_details           text,
  has_monitors         boolean     default false,
  has_backline         boolean     default false,
  backline_details     text,
  has_lighting         boolean     default false,
  message              text,
  status               text        check (status in (
    'pending', 'viewed', 'accepted', 'rejected', 'negotiating', 'confirmed'
  )) default 'pending',
  rejection_reason     text,
  counter_proposal     text,
  counter_budget       integer,
  counter_show_time    time,
  counter_load_in_time time,
  counter_proposed_at  timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index booking_requests_profile_id_idx   on public.booking_requests(profile_id);
create index booking_requests_requester_id_idx on public.booking_requests(requester_id);
create index booking_requests_status_idx       on public.booking_requests(status);
create index booking_requests_event_date_idx   on public.booking_requests(event_date);

create trigger booking_requests_updated_at
  before update on public.booking_requests
  for each row execute function public.handle_updated_at();

alter table public.booking_requests enable row level security;

create policy "booking_requests_owner_or_requester_read" on public.booking_requests
  for select using (
    profile_id   in (select id from public.profiles where user_id = auth.uid())
    or requester_id in (select id from public.profiles where user_id = auth.uid())
  );

create policy "booking_requests_authenticated_insert" on public.booking_requests
  for insert with check (
    requester_id in (select id from public.profiles where user_id = auth.uid())
    or requester_id is null
  );

create policy "booking_requests_owner_update" on public.booking_requests
  for update using (
    profile_id in (select id from public.profiles where user_id = auth.uid())
  );


create table public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  type       text        not null,
  title      text        not null,
  body       text        not null,
  related_id uuid,
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_read_idx    on public.notifications(user_id, read);

alter table public.notifications enable row level security;

create policy "notifications_owner_all" on public.notifications
  for all using (
    user_id in (select id from public.profiles where user_id = auth.uid())
  );

alter publication supabase_realtime add table public.notifications;


create table public.events (
  id                 uuid        primary key default gen_random_uuid(),
  band_id            uuid        references public.bands(id) on delete cascade,
  venue_id           uuid        references public.venues(id) on delete set null,
  booking_request_id uuid        references public.booking_requests(id) on delete set null,

  title       text        not null,
  description text,
  event_date  date        not null,
  doors_time  time,
  show_time   time        not null,
  end_time    time,

  venue_name    text        not null,
  venue_address text,
  city          text        not null,
  state_region  text,
  country       text        default 'MX',
  latitude      numeric(10,7),
  longitude     numeric(10,7),
  location      geography(Point, 4326),

  is_free          boolean      default false,
  ticket_price_min numeric(10,2),
  ticket_price_max numeric(10,2),
  currency         text         default 'MXN',
  ticket_url       text,
  ticket_platform  text         check (ticket_platform in (
    'ticketmaster', 'boletia', 'eventbrite', 'otra', 'en_puerta'
  )),
  tickets_available boolean      default true,

  status           text         check (status in (
    'draft', 'published', 'cancelled', 'completed'
  )) default 'draft',
  cancelled_reason text,

  is_public       boolean     default true,
  cover_image_url text,
  tags            text[]      default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index events_location_idx   on public.events using gist(location);
create index events_band_id_idx    on public.events(band_id);
create index events_event_date_idx on public.events(event_date);
create index events_status_idx     on public.events(status);

create or replace function public.sync_event_location()
returns trigger language plpgsql as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location = st_setsrid(st_makepoint(new.longitude, new.latitude), 4326);
  end if;
  return new;
end;
$$;

create trigger trg_sync_event_location
  before insert or update on public.events
  for each row execute function public.sync_event_location();

create trigger events_updated_at
  before update on public.events
  for each row execute function public.handle_updated_at();

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

grant execute on function public.nearby_events(
  double precision, double precision, double precision, date, date, boolean
) to anon, authenticated;

alter table public.events enable row level security;

create policy "event owner full access" on public.events
  for all using (
    band_id in (
      select b.id from public.bands b
      join public.profiles p on b.profile_id = p.id
      where p.user_id = auth.uid()
    )
  );

create policy "public read published events" on public.events
  for select using (is_public = true and status = 'published');


alter table public.availability
  add constraint availability_event_id_fkey
  foreign key (event_id) references public.events(id) on delete set null;


create table public.profile_views (
  id          uuid        primary key default gen_random_uuid(),
  band_id     uuid        references public.bands(id) on delete cascade,
  viewer_id   uuid        references public.profiles(id) on delete set null,
  viewer_type text        check (viewer_type in ('fan', 'booker', 'venue', 'anonymous')),
  source      text        check (source in (
    'direct', 'discovery', 'map', 'share_link', 'other'
  )),
  user_agent  text,
  viewed_at   timestamptz default now()
);

create index profile_views_band_id_idx   on public.profile_views(band_id);
create index profile_views_viewed_at_idx on public.profile_views(viewed_at);

alter table public.profile_views enable row level security;

create policy "owner read own views" on public.profile_views
  for select using (
    band_id in (
      select b.id from public.bands b
      join public.profiles p on b.profile_id = p.id
      where p.user_id = auth.uid()
    )
  );

create policy "anyone can insert view" on public.profile_views
  for insert with check (true);


create table public.push_subscriptions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  endpoint   text        not null unique,
  p256dh     text        not null,
  auth_key   text        not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_owner" on public.push_subscriptions
  for all using (
    user_id in (select id from public.profiles where user_id = auth.uid())
  );

create index push_subscriptions_user_id_idx on public.push_subscriptions(user_id);


create table public.notification_preferences (
  user_id             uuid    primary key references public.profiles(id) on delete cascade,
  booking_request     boolean not null default true,
  booking_viewed      boolean not null default true,
  booking_accepted    boolean not null default true,
  booking_rejected    boolean not null default true,
  booking_confirmed   boolean not null default true,
  booking_negotiating boolean not null default true,
  venue_verified      boolean not null default true,
  band_verified       boolean not null default true,
  message             boolean not null default true,
  push_enabled        boolean not null default false,
  updated_at          timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notification_preferences_owner" on public.notification_preferences
  for all using (
    user_id in (select id from public.profiles where user_id = auth.uid())
  );


create or replace view public.slug_availability as
  select slug from public.profiles;

grant select on public.slug_availability to anon, authenticated;
