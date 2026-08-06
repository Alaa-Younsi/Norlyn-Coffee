-- Newsletter subscriptions.
--
-- Same shape as contact_messages in 0007, and for the same reason: the anon key
-- ships inside the JS bundle, so the browser-side check is UX and the database
-- is the boundary. Writes go through one SECURITY DEFINER RPC; the table itself
-- has no anon policy at all.
--
-- ⚠ KEEP IN SYNC — adding the 'newsletter' section touches three lists:
--   1. `key` in src/lib/adminSections.ts
--   2. the has_section('newsletter') policy below
--   3. ALLOWED_SECTIONS in supabase/functions/create-worker/index.ts
-- A key in the nav but missing from the whitelist is granted in the UI and
-- dropped on save — the worker then sees a nav item that redirects.

-- ------------------------------------------------------ newsletter_subscribers
create table if not exists newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  -- stored lower-cased and trimmed by the RPC, so the unique index is a real
  -- "one row per human" guarantee rather than one per capitalisation
  email           text not null unique,
  status          text not null default 'subscribed'
                  check (status in ('subscribed','unsubscribed')),
  -- where the signup came from, so the client can tell the footer form from a
  -- future popup or import without guessing from timestamps
  source          text not null default 'site',
  created_at      timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index if not exists newsletter_created_idx
  on newsletter_subscribers (created_at desc);

-- the rate-limit probe below counts recent rows regardless of address
create index if not exists newsletter_recent_idx
  on newsletter_subscribers (created_at);

-- ----------------------------------------------------------------------- RLS
alter table newsletter_subscribers enable row level security;

-- NO anon policy, in either direction:
--   • SELECT would let anyone dump the mailing list through the REST API —
--     it is a list of real people's email addresses.
--   • INSERT would skip the validation and throttle below.
-- The storefront reaches this table only through subscribe_newsletter().
create policy "admin manage newsletter" on newsletter_subscribers
  for all to authenticated
  using (has_section('newsletter')) with check (has_section('newsletter'));

-- -------------------------------------------------------- subscribe_newsletter
create or replace function subscribe_newsletter(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email  text := lower(btrim(coalesce(payload->>'email', '')));
  v_source text := btrim(coalesce(payload->>'source', 'site'));
  v_recent integer;
begin
  -- same address grammar as submit_contact_message() and the create-worker edge
  -- function, so a mail that is accepted in one place is accepted in all three
  if length(v_email) > 160
     or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$' then
    raise exception 'ERR_INVALID_INPUT: email';
  end if;

  if v_source not in ('site', 'popup', 'import', 'checkout') then
    v_source := 'site';
  end if;

  -- Throttle on the whole table, not on this address. Per-address would be
  -- useless here: the attacker picks a new address every request, which is
  -- exactly the abuse case (stuffing the list with junk signups). 20 new rows
  -- an hour is far above any real signup rate for a shop this size.
  select count(*) into v_recent
  from newsletter_subscribers
  where created_at > now() - interval '1 hour';

  if v_recent >= 20 then
    raise exception 'ERR_RATE_LIMIT: too many signups';
  end if;

  -- An address that is already on the list must look exactly like a brand-new
  -- one from the outside. Returning "you are already subscribed" would turn
  -- this endpoint into an oracle for testing whether a given person shops here.
  -- Re-subscribing someone who had opted out revives their row; it never
  -- resets created_at, so the client keeps the true joined-on date.
  insert into newsletter_subscribers (email, source)
  values (v_email, v_source)
  on conflict (email) do update
    set status          = 'subscribed',
        unsubscribed_at = null
    where newsletter_subscribers.status = 'unsubscribed';
end;
$$;

revoke execute on function subscribe_newsletter(jsonb) from public;
grant  execute on function subscribe_newsletter(jsonb) to anon;
grant  execute on function subscribe_newsletter(jsonb) to authenticated;
