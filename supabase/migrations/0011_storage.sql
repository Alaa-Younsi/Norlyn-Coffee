-- Storage: the buckets the admin dashboard uploads into, and who may write them.
--
-- ⚠ THIS IS WHY UPLOADS FAILED ⚠
-- Every admin form has had an upload button since 0007, but no migration ever
-- created a bucket or a storage policy. Two things were therefore true in a
-- fresh project:
--   • `product-images` / `product-videos` did not exist, so the API answered
--     "Bucket not found";
--   • `storage.objects` ships with RLS ENABLED and no policies, which denies
--     every insert even to a logged-in owner.
-- The dashboard reported both as a bare "upload failed", so this looked like a
-- front-end bug for as long as it existed.
--
-- Run this in the Supabase SQL editor (the `postgres` role owns the storage
-- schema; a project anon/service key in a client library cannot create these).
-- Safe to re-run.

-- --------------------------------------------------------------- the buckets
-- `public = true` is required, not a convenience: lib/upload.ts hands the row
-- a getPublicUrl() result, and every shopper loads that URL unauthenticated.
--
-- The size ceilings are the real guard. lib/image.ts compresses to a 1400px
-- WebP before uploading, but it FALLS BACK to the original file whenever the
-- browser cannot decode the source, so an untouched phone photo does reach
-- this line and the bucket is what stops a 40 MB one.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760, -- 10 MB
  -- web-renderable formats only. HEIC is deliberately absent: Chrome cannot
  -- decode it, so compressImage() would pass the original through and the
  -- shopper would get an image their browser refuses to paint. Better a clear
  -- rejection at upload time than a broken picture on the storefront.
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-videos',
  'product-videos',
  true,
  52428800, -- 50 MB; videos are NOT compressed client-side
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- -------------------------------------------------------------- who may read
-- A public bucket still answers through storage.objects' RLS on the REST path,
-- so the read policy is what makes a product photo loadable by a shopper who
-- has never logged in.
drop policy if exists "public read store media" on storage.objects;
create policy "public read store media" on storage.objects
  for select
  using (bucket_id in ('product-images', 'product-videos'));

-- ------------------------------------------------------------- who may write
-- Gated on is_admin(), NOT on has_section(): a file is not the thing being
-- published — the row that points at it is, and those rows already carry their
-- own section policies (products → 'products', site_images → 'content', …).
-- Splitting the bucket by section would mean a staff member with 'content' but
-- not 'products' gets a different upload button, for no gain: the worst case
-- here is an orphaned object nobody can reference, which is a few kilobytes,
-- while the write that actually matters stays blocked one layer down.
drop policy if exists "admin write store media" on storage.objects;
create policy "admin write store media" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'product-videos') and public.is_admin());

-- upsert on a path that already exists (re-uploading over the same object)
drop policy if exists "admin update store media" on storage.objects;
create policy "admin update store media" on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'product-videos') and public.is_admin())
  with check (bucket_id in ('product-images', 'product-videos') and public.is_admin());

-- deleteUploadedImage() in lib/upload.ts is the caller; without this the
-- cleanup silently no-ops and every replaced photo stays billable forever
drop policy if exists "admin delete store media" on storage.objects;
create policy "admin delete store media" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'product-videos') and public.is_admin());
