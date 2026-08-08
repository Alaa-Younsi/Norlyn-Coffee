-- Named FILM slots — the video counterpart of `site_images` (0007).
--
-- Two films on this site are fixtures rather than a slider: the hero's screen
-- on the landing page and the espresso loop that runs beside the buy form on
-- EVERY product page. Both were deploy-only — a file committed at
-- public/videos/hero.mp4 and public/videos/espresso.mp4 — so replacing either
-- one meant a developer and a build. The client changes their photographs from
-- the dashboard; there was no reason the films should be different.
--
-- Same shape and the same rules as site_images: keyed by the slot string, so
-- adding a slot needs no migration (declare it in src/lib/videoSlots.ts), and
-- a missing row is an ordinary state — the storefront falls back to the
-- committed file, and then to a still photograph.
--
-- Adds NO new grantable section: these belong to 'content', beside the images
-- and the slider they sit next to in the admin.

create table if not exists site_videos (
  slot       text primary key,
  url        text not null,
  -- the still the player shows before the first frame decodes, and the whole
  -- screen for visitors on reduced-motion or Save-Data. Nullable: the slot
  -- definition ships a photograph to use when the client uploads none.
  poster_url text,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_videos_updated_at on site_videos;
create trigger site_videos_updated_at
  before update on site_videos
  for each row execute function update_updated_at();

alter table site_videos enable row level security;

drop policy if exists "anon read site videos" on site_videos;
create policy "anon read site videos" on site_videos
  for select to anon using (true);

drop policy if exists "admin manage site videos" on site_videos;
create policy "admin manage site videos" on site_videos
  for all to authenticated
  using (has_section('content')) with check (has_section('content'));

-- Deliberately NOT seeded. A row here means "the client chose this film"; the
-- committed drop-in is what plays until they do, and seeding a row pointing at
-- /videos/hero.mp4 would make the admin claim a film exists on a site where
-- that file has not been committed yet.
