-- ============================================================
-- GigBridge unificado — 0010: Supabase Storage (buckets + políticas)
--
-- La auditoría de v1 encontró que sus buckets (`avatars`, `covers`) y
-- CUALQUIER política sobre storage.objects se gestionaron a mano desde
-- el dashboard — no reproducibles, no versionadas (hueco #8). Aquí se
-- crean por SQL, versionadas, junto con el bucket nuevo `documents` que
-- separa PDFs del expediente de venue (antes mezclados dentro de
-- `covers` en v1 — ver GigBridge/gigbridge/api/venues/upload-document).
--
-- Convención de paths:
--   avatars/{profileId}/avatar.{ext}, {profileId}/avatar_original.{ext}
--   covers/{profileId}/cover.{ext}, {profileId}/epk-photos/{ts}.{ext},
--          venues/{venueId}/{cover|logo}.{ext}, venues/{venueId}/gallery/{...}
--   documents/{ownerType}/{ownerId}/{documentId}/v{n}.{ext}
--
-- Todos públicos para lectura (como en v1): la visibilidad real de un
-- documento la controla la fila en `documents` (columna `visibility` +
-- RLS), no el bucket — mismo modelo que ya usaba v1 para riders con PIN.
-- Escritura: avatars/covers permiten subir directo desde el navegador
-- (con estas políticas) si el primer segmento del path es un profile o
-- venue del propio dueño; `documents` solo se escribe con el cliente
-- service-role desde Route Handlers que ya verifican permisos con
-- can_manage_document() antes de subir — más simple que replicar esa
-- misma lógica en una policy de storage.
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] in (
      select id::text from public.profiles where user_id = auth.uid()
    )
  );

create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] in (
      select id::text from public.profiles where user_id = auth.uid()
    )
  );

create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] in (
      select id::text from public.profiles where user_id = auth.uid()
    )
  );


create policy "covers_public_read" on storage.objects
  for select using (bucket_id = 'covers');

-- El primer segmento es o el id de un profile propio (cover/epk-photos),
-- o el literal 'venues' seguido del id de un venue propio.
create policy "covers_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'covers'
    and (
      (storage.foldername(name))[1] in (
        select id::text from public.profiles where user_id = auth.uid()
      )
      or (
        (storage.foldername(name))[1] = 'venues'
        and (storage.foldername(name))[2] in (
          select v.id::text from public.venues v
          join public.profiles p on p.id = v.owner_id
          where p.user_id = auth.uid()
        )
      )
    )
  );

create policy "covers_owner_update" on storage.objects
  for update using (
    bucket_id = 'covers'
    and (
      (storage.foldername(name))[1] in (
        select id::text from public.profiles where user_id = auth.uid()
      )
      or (
        (storage.foldername(name))[1] = 'venues'
        and (storage.foldername(name))[2] in (
          select v.id::text from public.venues v
          join public.profiles p on p.id = v.owner_id
          where p.user_id = auth.uid()
        )
      )
    )
  );

create policy "covers_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'covers'
    and (
      (storage.foldername(name))[1] in (
        select id::text from public.profiles where user_id = auth.uid()
      )
      or (
        (storage.foldername(name))[1] = 'venues'
        and (storage.foldername(name))[2] in (
          select v.id::text from public.venues v
          join public.profiles p on p.id = v.owner_id
          where p.user_id = auth.uid()
        )
      )
    )
  );


create policy "documents_bucket_public_read" on storage.objects
  for select using (bucket_id = 'documents');

-- Sin policy de insert/update/delete para 'documents': solo el cliente
-- service-role escribe ahí (bypassea RLS), siempre detrás de
-- can_manage_document() verificado en el Route Handler.
