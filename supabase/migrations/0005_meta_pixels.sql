-- Admin-managed Meta pixels (multi-pixel, DB-driven).
-- The owner runs several campaigns at once with different objectives, so the
-- shop runs several pixels and which one is live depends on the page. IDs and
-- targeting are edited in /admin/pixels — no redeploy, no index.html snippet.

create table if not exists meta_pixels (
  id              uuid primary key default gen_random_uuid(),
  label           text not null,               -- human name: "Retargeting — hiver"
  pixel_id        text not null,               -- the 15–16 digit Meta id
  active          boolean not null default true,
  scope           text not null default 'all'
                  check (scope in ('all','paths','products','landing')),
  -- empty match_values on a SCOPED pixel means "every page of that kind"
  -- (one pixel for all product pages) — not "no pages".
  match_values    text[] not null default '{}',
  events          jsonb not null default
    '{"page_view":true,"view_content":true,"add_to_cart":true,"initiate_checkout":true,"purchase":true,"lead":true,"search":true}',
  test_event_code text,
  currency        text not null default 'DZD',
  sort_order      integer not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger meta_pixels_updated_at
  before update on meta_pixels
  for each row execute function update_updated_at();

alter table meta_pixels enable row level security;

-- The storefront has to read this to know what to load, so anon SELECT is
-- filtered to active = true: a paused campaign's ID must not be readable.
create policy "anon read active pixels" on meta_pixels
  for select to anon using (active = true);

create policy "admin manage pixels" on meta_pixels
  for all to authenticated
  using (has_section('pixels')) with check (has_section('pixels'));
