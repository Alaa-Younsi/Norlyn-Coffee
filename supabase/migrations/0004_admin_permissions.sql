-- Staff accounts with per-section permissions — enforced in the DATABASE.
--
-- ⚠ READ BEFORE RUNNING ⚠
-- This migration replaces the old blanket `TO authenticated USING (true)`
-- policies (which gave ANY Supabase Auth session full store-owner access) with
-- section-scoped policies keyed on admin_profiles. After it runs, ONLY seeded
-- admins can write. A self-registered account has no admin_profiles row and is
-- therefore powerless — this closes the public-sign-up takeover hole.
--
-- STEP 1 — before running: replace OWNER_EMAIL_PLACEHOLDER below with the
-- client's real admin email (the account created in Supabase Auth).
-- A safety net at the bottom promotes existing auth users if no owner was
-- matched, so the client can never be locked out of their own dashboard.
--
-- STEP 2 — after running: log in as the owner and confirm every section is
-- reachable, THEN create staff from /admin/team.

-- ------------------------------------------------------------ admin_profiles
create table if not exists admin_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  is_owner   boolean not null default false,
  sections   text[]  not null default '{}',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table admin_profiles enable row level security;

-- ------------------------------------------------------------------ helpers
-- SECURITY DEFINER is REQUIRED, not a shortcut: these read admin_profiles with
-- the definer's rights, bypassing that table's own RLS. Without it every policy
-- calling has_section() re-enters admin_profiles' policies and Postgres errors
-- with infinite recursion.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and active
  );
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and active and is_owner
  );
$$;

-- KEEP IN SYNC with src/lib/adminSections.ts and the create-worker function's
-- ALLOWED_SECTIONS. A key present in one list but not the others fails
-- silently: granted in the UI, dropped on save, nav item that redirects.
create or replace function public.has_section(s text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid() and active and (is_owner or s = any(sections))
  );
$$;

-- --------------------------------------------------- admin_profiles policies
-- A user reads THEIR OWN row only (that's how the UI learns its grants).
drop policy if exists "read own admin profile" on admin_profiles;
create policy "read own admin profile" on admin_profiles
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "owner manages admins" on admin_profiles;
create policy "owner manages admins" on admin_profiles
  for all to authenticated using (is_owner()) with check (is_owner());

-- --------------------------------------------- rewrite every admin policy
drop policy if exists "admin all categories"      on categories;
drop policy if exists "admin all products"        on products;
drop policy if exists "admin all product images"  on product_images;
drop policy if exists "admin all orders"          on orders;
drop policy if exists "admin all order items"     on order_items;
drop policy if exists "admin all store settings"  on store_settings;
drop policy if exists "admin all delivery prices" on delivery_prices;
drop policy if exists "admin all reviews"         on client_reviews;

create policy "admin manage categories" on categories
  for all to authenticated
  using (has_section('categories')) with check (has_section('categories'));

-- products is read by more than one section: the catalogue editor owns it, but
-- finance derives margin from it and the order screens display live names.
create policy "admin manage products" on products
  for all to authenticated
  using (has_section('products')) with check (has_section('products'));

create policy "admin read products" on products
  for select to authenticated
  using (has_section('products') or has_section('orders') or has_section('finance'));

create policy "admin manage product images" on product_images
  for all to authenticated
  using (has_section('products')) with check (has_section('products'));

create policy "admin read product images" on product_images
  for select to authenticated
  using (has_section('products') or has_section('orders') or has_section('finance'));

create policy "admin manage orders" on orders
  for all to authenticated
  using (has_section('orders')) with check (has_section('orders'));

create policy "admin read orders" on orders
  for select to authenticated
  using (has_section('orders') or has_section('finance'));

create policy "admin manage order items" on order_items
  for all to authenticated
  using (has_section('orders')) with check (has_section('orders'));

create policy "admin read order items" on order_items
  for select to authenticated
  using (has_section('orders') or has_section('finance'));

-- Global config is not a grantable section — every admin needs it, nobody
-- should have to be granted it.
create policy "admin manage store settings" on store_settings
  for all to authenticated using (is_admin()) with check (is_admin());

create policy "admin manage delivery prices" on delivery_prices
  for all to authenticated
  using (has_section('delivery')) with check (has_section('delivery'));

create policy "admin read delivery prices" on delivery_prices
  for select to authenticated
  using (is_admin());

create policy "admin manage reviews" on client_reviews
  for all to authenticated
  using (has_section('reviews')) with check (has_section('reviews'));

-- ---------------------------------------------------------------- seed owner
insert into admin_profiles (user_id, email, is_owner, sections)
select id, email, true, '{}'
from auth.users
where email = 'OWNER_EMAIL_PLACEHOLDER'
on conflict (user_id) do update set is_owner = true, active = true;

-- Lockout safety net: if the email above matched nothing (placeholder left in,
-- typo, different casing), promote every EXISTING auth user to owner — at
-- go-live that is exactly the one admin account created in the dashboard.
-- Runs only while admin_profiles is still empty, so it can never re-fire later
-- and silently promote a customer account.
do $$
begin
  if not exists (select 1 from admin_profiles) then
    insert into admin_profiles (user_id, email, is_owner, sections)
    select id, email, true, '{}' from auth.users
    on conflict (user_id) do nothing;
    raise notice 'admin_profiles was empty — promoted all existing auth users to owner. Verify /admin/team and deactivate anyone who should not be an owner.';
  end if;
end $$;
