-- ============================================================
-- Secure storage bucket upload policies
--
-- Path convention: all uploads must be stored as
--   {auth.uid()}/{filename}
--
-- This lets each policy scope access to the first path segment,
-- which must equal the uploading user's UUID.  A contractor
-- uploading their logo at contractor-logos/abc-uuid/logo.png
-- passes; a different user attempting to overwrite that path fails.
-- ============================================================

-- ------------------------------------------------------------
-- contractor-logos
-- ------------------------------------------------------------
drop policy if exists "Authenticated upload contractor logos" on storage.objects;

create policy "Owner insert contractor logos"
  on storage.objects for insert
  with check (
    bucket_id = 'contractor-logos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner update contractor logos"
  on storage.objects for update
  using (
    bucket_id = 'contractor-logos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner delete contractor logos"
  on storage.objects for delete
  using (
    bucket_id = 'contractor-logos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
-- contractor-covers
-- ------------------------------------------------------------
drop policy if exists "Authenticated upload contractor covers" on storage.objects;

create policy "Owner insert contractor covers"
  on storage.objects for insert
  with check (
    bucket_id = 'contractor-covers'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner update contractor covers"
  on storage.objects for update
  using (
    bucket_id = 'contractor-covers'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner delete contractor covers"
  on storage.objects for delete
  using (
    bucket_id = 'contractor-covers'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
-- portfolio-photos
-- ------------------------------------------------------------
drop policy if exists "Authenticated upload portfolio photos" on storage.objects;

create policy "Owner insert portfolio photos"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner update portfolio photos"
  on storage.objects for update
  using (
    bucket_id = 'portfolio-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner delete portfolio photos"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
-- avatars
-- ------------------------------------------------------------
drop policy if exists "Authenticated upload avatars" on storage.objects;

create policy "Owner insert avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner update avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner delete avatars"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
