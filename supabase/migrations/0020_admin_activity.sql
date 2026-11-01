-- ============================================================================
-- Admin activity history + the norlyn owner account.
--
-- 1. `admin_activity` — an append-only log of every write a dashboard account
--    makes (who, when, which table, which record, and the before → after of
--    every changed field) plus every sign-in. Readable by OWNERS ONLY.
-- 2. `admin_team_overview()` — last sign-in / last action per account, which
--    lives in auth.users and is otherwise unreachable from the browser.
-- 3. Promotes admin@norlyn.com to owner (full access to every section).
--
-- ⚠ BEFORE RUNNING: create the account in Supabase → Authentication → Users →
-- "Add user" (email admin@norlyn.com, the agreed password, "Auto Confirm User"
-- ticked). The password is deliberately NOT in this file — migrations are
-- committed to git. If you run this first, nothing breaks: re-run only the
-- "owner seed" block at the bottom once the user exists.
--
-- HOW WRITES ARE CAPTURED
-- One generic AFTER trigger on every admin-managed table. It records a row
-- only when the caller is a signed-in dashboard account (auth.uid() has an
-- admin_profiles row), so shopper traffic — place_order and the newsletter RPC
-- run as anon, the notify function as service role — never fills the log.
-- The trigger swallows its own errors: auditing must never be the reason an
-- admin's save fails.
--
-- Nobody can INSERT/UPDATE/DELETE the log through the API (no policies for
-- it); only the SECURITY DEFINER trigger functions write to it, so a worker
-- cannot erase their tracks — and neither can the owner, from the dashboard.
-- ============================================================================

create table if not exists admin_activity (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  actor_id     uuid references auth.users(id) on delete set null,
  -- copied, not joined: the history must still read correctly after the
  -- account is deleted
  actor_email  text,
  action       text not null check (action in ('insert', 'update', 'delete', 'login')),
  table_name   text,
  record_id    text,
  record_label text,
  -- update: { field: [before, after] } · insert/delete: { field: value }
  changes      jsonb not null default '{}'
);

create index if not exists admin_activity_at_idx    on admin_activity (at desc);
create index if not exists admin_activity_actor_idx on admin_activity (actor_id, at desc);

alter table admin_activity enable row level security;

drop policy if exists "owner reads activity" on admin_activity;
create policy "owner reads activity" on admin_activity
  for select to authenticated using (is_owner());

-- ---------------------------------------------------------------- helpers
-- Secrets never enter the log; long text is clipped so one article edit does
-- not store two copies of the whole body.
create or replace function public.audit_value(k text, v jsonb)
returns jsonb language sql immutable as $$
  select case
    when k ~* '(apikey|api_key|token|secret|password)' and v is not null and v <> 'null'::jsonb
      then to_jsonb('•••'::text)
    when jsonb_typeof(v) = 'string' and char_length(v #>> '{}') > 160
      then to_jsonb(left(v #>> '{}', 160) || '…')
    when jsonb_typeof(v) in ('object', 'array') and char_length(v::text) > 300
      then to_jsonb(left(v::text, 300) || '…')
    else v
  end;
$$;

create or replace function public.log_admin_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_email   text;
  v_old     jsonb;
  v_new     jsonb;
  v_row     jsonb;
  v_changes jsonb := '{}'::jsonb;
  k         text;
begin
  if v_uid is null then
    return null;
  end if;

  select email into v_email from admin_profiles where user_id = v_uid;
  if not found then
    return null;
  end if;

  if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new); end if;
  v_row := coalesce(v_new, v_old);

  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(v_new) loop
      continue when k in ('updated_at', 'created_at');
      if (v_new -> k) is distinct from (v_old -> k) then
        v_changes := v_changes || jsonb_build_object(
          k, jsonb_build_array(audit_value(k, v_old -> k), audit_value(k, v_new -> k))
        );
      end if;
    end loop;
    -- a save that changed nothing but the timestamp is not activity
    if v_changes = '{}'::jsonb then
      return null;
    end if;
  else
    for k in select jsonb_object_keys(v_row) loop
      continue when k in ('updated_at', 'created_at', 'id');
      continue when (v_row -> k) = 'null'::jsonb;
      v_changes := v_changes || jsonb_build_object(k, audit_value(k, v_row -> k));
    end loop;
  end if;

  insert into admin_activity (actor_id, actor_email, action, table_name, record_id, record_label, changes)
  values (
    v_uid,
    v_email,
    lower(tg_op),
    tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'user_id', v_row ->> 'product_id', v_row ->> 'slot'),
    left(coalesce(
      v_row ->> 'order_number',
      v_row ->> 'sale_number',
      v_row ->> 'name_fr',
      v_row ->> 'title_fr',
      v_row ->> 'label',
      v_row ->> 'name',
      v_row ->> 'client_name',
      v_row ->> 'customer_name',
      v_row ->> 'wilaya',
      v_row ->> 'email',
      v_row ->> 'slug',
      v_row ->> 'slot',
      v_row ->> 'subject'
    ), 120),
    v_changes
  );
  return null;
exception when others then
  return null;
end;
$$;

-- ------------------------------------------------------- attach to tables
-- KEEP IN SYNC with TABLE_LABELS in src/pages/admin/Activity.tsx (a table
-- missing there still logs, it just shows its raw name).
do $$
declare
  t text;
begin
  foreach t in array array[
    'products', 'product_images', 'categories', 'orders', 'order_items',
    'delivery_prices', 'client_reviews', 'store_settings', 'admin_profiles',
    'meta_pixels', 'media_slides', 'site_images', 'site_videos', 'articles',
    'contact_messages', 'newsletter_subscribers', 'suppliers', 'expenses',
    'stock_purchases', 'product_costs', 'store_products', 'store_sales',
    'store_sale_items'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists %I on public.%I', t || '_activity', t);
      execute format(
        'create trigger %I after insert or update or delete on public.%I
           for each row execute function public.log_admin_activity()',
        t || '_activity', t
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- sign-ins
-- GoTrue stamps auth.users.last_sign_in_at on every password sign-in (token
-- refreshes do not touch it), so one row here = one real login.
create or replace function public.log_admin_login()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at
     and exists (select 1 from admin_profiles where user_id = new.id) then
    insert into admin_activity (at, actor_id, actor_email, action)
    values (coalesce(new.last_sign_in_at, now()), new.id, new.email, 'login');
  end if;
  return new;
exception when others then
  -- a logging fault must never lock anyone out of the dashboard
  return new;
end;
$$;

drop trigger if exists admin_login_activity on auth.users;
create trigger admin_login_activity
  after update of last_sign_in_at on auth.users
  for each row execute function public.log_admin_login();

-- --------------------------------------------------------- team overview
create or replace function public.admin_team_overview()
returns table (
  user_id         uuid,
  email           text,
  is_owner        boolean,
  active          boolean,
  created_at      timestamptz,
  last_sign_in_at timestamptz,
  last_action_at  timestamptz,
  actions_7d      bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_owner() then
    raise exception 'forbidden';
  end if;

  return query
  select
    p.user_id,
    coalesce(p.email, u.email::text),
    p.is_owner,
    p.active,
    p.created_at,
    u.last_sign_in_at,
    (select max(a.at) from admin_activity a
      where a.actor_id = p.user_id and a.action <> 'login'),
    (select count(*) from admin_activity a
      where a.actor_id = p.user_id and a.action <> 'login'
        and a.at > now() - interval '7 days')
  from admin_profiles p
  left join auth.users u on u.id = p.user_id
  order by p.is_owner desc, u.last_sign_in_at desc nulls last;
end;
$$;

revoke all on function public.admin_team_overview() from public, anon;
grant execute on function public.admin_team_overview() to authenticated;

-- -------------------------------------------------------------- owner seed
insert into admin_profiles (user_id, email, is_owner, sections, active)
select id, email, true, '{}', true
from auth.users
where lower(email) = 'admin@norlyn.com'
on conflict (user_id) do update set is_owner = true, active = true;

do $$
begin
  if not exists (
    select 1 from admin_profiles p join auth.users u on u.id = p.user_id
    where lower(u.email) = 'admin@norlyn.com' and p.is_owner
  ) then
    raise notice 'admin@norlyn.com does not exist in auth.users yet — create it (Authentication → Add user), then re-run the owner seed block.';
  end if;
end $$;
