-- ============================================================
-- GigBridge unificado — 0001: extensiones, enums, profiles
--
-- Punto de partida: port casi literal de profiles desde
-- GigBridge/gigbridge/supabase/schema_master.sql (v1, en producción).
-- No cambia de forma aquí — profiles es la única tabla que la auditoría
-- de v1 confirmó como ya-en-uso-real y no necesita romperse.
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists postgis;

create type user_role as enum (
  'artist', 'booker', 'venue', 'fan', 'manager'
);

create type availability_status as enum (
  'available', 'busy', 'on_tour'
);

create type booking_status as enum (
  'available', 'booked', 'blocked', 'busy', 'on_tour'
);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  slug                text        not null unique,
  display_name        text        not null,
  role                user_role   not null default 'artist',
  bio_short           text,
  bio_long            text,
  cover_image_url     text,
  avatar_url          text,
  availability_status availability_status not null default 'available',
  availability_city   text,
  spotify_url         text,
  youtube_url         text,
  instagram_url       text,
  website_url         text,
  rider_pin           text,
  is_admin            boolean     not null default false,
  is_super_admin      boolean     not null default false,
  subscription_tier   text        not null default 'free_unverified'
    check (subscription_tier in ('free_unverified', 'free_verified', 'pro', 'max')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint slug_length  check (char_length(slug) >= 2 and char_length(slug) <= 50)
);

create index profiles_user_id_idx      on public.profiles(user_id);
create index profiles_subscription_tier_idx on public.profiles(subscription_tier);
create index profiles_is_super_admin_idx on public.profiles(is_super_admin)
  where is_super_admin = true;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_public_read" on public.profiles
  for select using (true);

create policy "profiles_owner_insert" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = user_id);

create policy "profiles_owner_delete" on public.profiles
  for delete using (auth.uid() = user_id);

-- Hardening (portado de v1): oculta is_admin/is_super_admin/rider_pin de la
-- lectura pública vía columnas, no filas — RLS no puede esconder columnas.
revoke select on public.profiles from anon, authenticated;
grant select (
  id, user_id, slug, display_name, role,
  bio_short, bio_long, cover_image_url, avatar_url,
  availability_status, availability_city,
  spotify_url, youtube_url, instagram_url, website_url,
  subscription_tier, created_at, updated_at
) on public.profiles to anon, authenticated;

create or replace function public.current_profile()
returns setof public.profiles
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select * from public.profiles where user_id = auth.uid()
$$;

revoke all on function public.current_profile() from public;
grant execute on function public.current_profile() to authenticated;
