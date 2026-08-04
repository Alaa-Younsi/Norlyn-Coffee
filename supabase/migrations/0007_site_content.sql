-- Editable site content: hero media slider, named image slots, the blog, and
-- the contact inbox. Everything the client can change without a redeploy.
--
-- Adds three grantable section keys: 'content', 'articles', 'messages'.
-- KEEP IN SYNC with src/lib/adminSections.ts and create-worker's
-- ALLOWED_SECTIONS.

-- -------------------------------------------------------------- media_slides
-- The hero slider on the landing page: images AND videos, ordered, per-slide
-- caption and optional link.
create table if not exists media_slides (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null default 'image' check (kind in ('image','video')),
  url          text not null,
  -- videos need a still for preload="none"; images ignore it
  poster_url   text,
  title_fr     text,
  title_ar     text,
  subtitle_fr  text,
  subtitle_ar  text,
  link_url     text,
  placement    text not null default 'hero' check (placement in ('hero','gallery')),
  sort_order   integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger media_slides_updated_at
  before update on media_slides
  for each row execute function update_updated_at();

create index if not exists media_slides_placement_idx
  on media_slides (placement, sort_order) where active;

-- --------------------------------------------------------------- site_images
-- Named image slots the DESIGN defines and the client fills — e.g.
-- 'about.hero', 'about.roastery', 'contact.side'. The storefront renders a
-- designed placeholder until a row exists, so a missing photo never breaks a
-- layout. Keys are declared in src/lib/imageSlots.ts.
create table if not exists site_images (
  slot       text primary key,
  url        text not null,
  alt_fr     text,
  alt_ar     text,
  updated_at timestamptz not null default now()
);

create trigger site_images_updated_at
  before update on site_images
  for each row execute function update_updated_at();

-- ------------------------------------------------------------------ articles
create table if not exists articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title_fr     text not null,
  title_ar     text not null,
  excerpt_fr   text,
  excerpt_ar   text,
  body_fr      text,
  body_ar      text,
  cover_url    text,
  tag_fr       text,
  tag_ar       text,
  author       text,
  read_minutes integer not null default 3,
  featured     boolean not null default false,
  status       text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger articles_updated_at
  before update on articles
  for each row execute function update_updated_at();

create index if not exists articles_published_idx
  on articles (published_at desc) where status = 'published';

-- ---------------------------------------------------------- contact_messages
create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  subject    text,
  message    text not null,
  status     text not null default 'new' check (status in ('new','read','archived')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_idx on contact_messages (created_at desc);
create index if not exists contact_messages_rate_idx on contact_messages (email, created_at desc);

-- ----------------------------------------------------------------------- RLS
alter table media_slides     enable row level security;
alter table site_images      enable row level security;
alter table articles         enable row level security;
alter table contact_messages enable row level security;

create policy "anon read active slides" on media_slides
  for select to anon using (active = true);

create policy "anon read site images" on site_images
  for select to anon using (true);

create policy "anon read published articles" on articles
  for select to anon using (status = 'published');

-- NO anon policy on contact_messages: it holds visitors' names, emails and
-- phone numbers — a blanket read would let anyone dump the inbox through the
-- REST API. Writes go exclusively through submit_contact_message() below.

create policy "admin manage slides" on media_slides
  for all to authenticated
  using (has_section('content')) with check (has_section('content'));

create policy "admin manage site images" on site_images
  for all to authenticated
  using (has_section('content')) with check (has_section('content'));

create policy "admin manage articles" on articles
  for all to authenticated
  using (has_section('articles')) with check (has_section('articles'));

create policy "admin manage messages" on contact_messages
  for all to authenticated
  using (has_section('messages')) with check (has_section('messages'));

-- ------------------------------------------------- submit_contact_message()
-- Same reasoning as place_order: the anon key ships in the JS bundle, so the
-- zod schema and honeypot in the browser are UX, not a boundary. Validate and
-- rate-limit server-side.
create or replace function submit_contact_message(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name    text := btrim(coalesce(payload->>'name', ''));
  v_email   text := btrim(coalesce(payload->>'email', ''));
  v_phone   text := btrim(coalesce(payload->>'phone', ''));
  v_subject text := btrim(coalesce(payload->>'subject', ''));
  v_message text := btrim(coalesce(payload->>'message', ''));
  v_recent  integer;
begin
  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'ERR_INVALID_INPUT: name';
  end if;
  if v_email <> '' and (length(v_email) > 120 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$') then
    raise exception 'ERR_INVALID_INPUT: email';
  end if;
  if v_phone <> '' and v_phone !~ '^0[5-7][0-9]{8}$' then
    raise exception 'ERR_INVALID_INPUT: phone';
  end if;
  if v_email = '' and v_phone = '' then
    raise exception 'ERR_INVALID_INPUT: contact';
  end if;
  if length(v_message) < 10 or length(v_message) > 2000 then
    raise exception 'ERR_INVALID_INPUT: message';
  end if;

  -- throttle on whichever identity was given (5 per hour)
  select count(*) into v_recent
  from contact_messages
  where created_at > now() - interval '1 hour'
    and ((v_email <> '' and email = v_email) or (v_phone <> '' and phone = v_phone));

  if v_recent >= 5 then
    raise exception 'ERR_RATE_LIMIT: too many messages';
  end if;

  insert into contact_messages (name, email, phone, subject, message)
  values (v_name, nullif(v_email, ''), nullif(v_phone, ''),
          nullif(left(v_subject, 120), ''), left(v_message, 2000));
end;
$$;

revoke execute on function submit_contact_message(jsonb) from public;
grant  execute on function submit_contact_message(jsonb) to anon;
grant  execute on function submit_contact_message(jsonb) to authenticated;
