-- ============================================================
-- GigBridge unificado — 0017: invitaciones del crew a una gira
--
-- Hasta aquí una persona del roster (crew_members) solo quedaba ligada a
-- su cuenta (user_id) por SQL o por el seed: un manager creaba la gira
-- pero no tenía forma de meter a nadie. Ahora el admin da de alta a la
-- persona (crew_members sin user_id + tour_crew) y genera un enlace
-- /invite/<token>; quien lo abre con su sesión lo acepta y la fila del
-- roster pasa a ser suya.
--
-- El token es el secreto (64 caracteres hex aleatorios); caduca a los 14 días y
-- sirve una sola vez. Aceptar y previsualizar van por funciones security
-- definer: quien acepta todavía no es miembro, así que la RLS normal no
-- le deja ver ni tocar esas filas.
--
-- Además se cierra un hueco de 0008: `crew_members_authenticated_insert`
-- aceptaba cualquier user_id, así que alguien podía crear una fila con la
-- cuenta de otra persona y meterla a su gira sin que aceptara. Ahora solo
-- se inserta sin user_id (crew freelance o por invitar) o con el propio.
-- ============================================================

drop policy "crew_members_authenticated_insert" on public.crew_members;
create policy "crew_members_authenticated_insert" on public.crew_members
  for insert with check (auth.uid() is not null and (user_id is null or user_id = auth.uid()));


create table public.tour_invites (
  id           uuid        primary key default gen_random_uuid(),
  tour_crew_id uuid        not null references public.tour_crew(id) on delete cascade,
  -- Dos uuid v4 (~244 bits aleatorios) sin depender del esquema de pgcrypto.
  token        text        not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_by   uuid        references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '14 days',
  accepted_at  timestamptz,
  accepted_by  uuid        references public.profiles(id) on delete set null
);

create index tour_invites_tour_crew_id_idx on public.tour_invites(tour_crew_id);

alter table public.tour_invites enable row level security;

-- Solo el admin de la gira ve, crea y revoca invitaciones de su roster.
create policy "tour_invites_admin_all" on public.tour_invites for all
  using (public.is_tour_admin((select tour_id from public.tour_crew where id = tour_crew_id)))
  with check (public.is_tour_admin((select tour_id from public.tour_crew where id = tour_crew_id)));


-- Vista previa para la página /invite/<token>: lo mínimo para que la
-- persona sepa qué acepta. `state`: 'valid' | 'expired' | 'accepted' |
-- 'not_found'. Disponible sin sesión (el token es el secreto).
create or replace function public.get_tour_invite(p_token text)
returns table (state text, tour_name text, band_name text, person_name text, invited_by text, first_date_id uuid)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    case
      when i.id is null then 'not_found'
      when i.accepted_at is not null then 'accepted'
      when i.expires_at < now() then 'expired'
      else 'valid'
    end,
    t.name, b.name, cm.full_name, p.display_name,
    (select td.id from public.tour_dates td where td.tour_id = t.id
      order by (td.show_date < current_date), abs(td.show_date - current_date) limit 1)
  from (select 1) one
  left join public.tour_invites i on i.token = p_token
  left join public.tour_crew tc on tc.id = i.tour_crew_id
  left join public.tours t on t.id = tc.tour_id
  left join public.bands b on b.id = t.band_id
  left join public.crew_members cm on cm.id = tc.crew_member_id
  left join public.profiles p on p.id = i.created_by;
$$;

-- Acepta la invitación con la sesión actual. Devuelve el tour_id, o lanza
-- un error con código legible: invite_not_found, invite_expired,
-- invite_used, not_authenticated, already_member, claimed_by_other.
create or replace function public.accept_tour_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite   public.tour_invites%rowtype;
  v_crew     public.tour_crew%rowtype;
  v_profile  uuid;
  v_target   public.crew_members%rowtype;
  v_existing uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select id into v_profile from public.profiles where user_id = auth.uid();

  select * into v_invite from public.tour_invites where token = p_token for update;
  if not found then raise exception 'invite_not_found'; end if;
  if v_invite.accepted_at is not null then raise exception 'invite_used'; end if;
  if v_invite.expires_at < now() then raise exception 'invite_expired'; end if;

  select * into v_crew from public.tour_crew where id = v_invite.tour_crew_id;
  select * into v_target from public.crew_members where id = v_crew.crew_member_id;
  if v_target.user_id is not null and v_target.user_id <> auth.uid() then raise exception 'claimed_by_other'; end if;

  -- ¿La persona ya tiene una fila de crew_members (de otra gira)? Entonces
  -- esta membresía se mueve a esa fila y la del invitado se descarta, para
  -- no romper el unique de crew_members.user_id.
  select id into v_existing from public.crew_members where user_id = auth.uid();
  if v_existing is not null and v_existing <> v_target.id then
    if exists (select 1 from public.tour_crew where tour_id = v_crew.tour_id and crew_member_id = v_existing) then
      raise exception 'already_member';
    end if;
    update public.tour_crew set crew_member_id = v_existing, status = 'confirmed' where id = v_crew.id;
    -- Los cuartos de hotel ya asignados siguen a la persona.
    update public.hotel_room_assignments set crew_member_id = v_existing
      where crew_member_id = v_target.id
        and tour_date_id in (select id from public.tour_dates where tour_id = v_crew.tour_id);
    delete from public.crew_members cm
      where cm.id = v_target.id and not exists (select 1 from public.tour_crew where crew_member_id = cm.id);
  else
    update public.crew_members set user_id = auth.uid() where id = v_target.id;
    update public.tour_crew set status = 'confirmed' where id = v_crew.id;
  end if;

  update public.tour_invites set accepted_at = now(), accepted_by = v_profile where id = v_invite.id;
  return v_crew.tour_id;
end;
$$;

revoke all on function public.get_tour_invite(text) from public;
revoke all on function public.accept_tour_invite(text) from public;
grant execute on function public.get_tour_invite(text) to anon, authenticated;
grant execute on function public.accept_tour_invite(text) to authenticated;
