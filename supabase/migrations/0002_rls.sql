-- RLS — anon reads the public catalogue only; authenticated = store admin.
--
-- SECURITY NOTE (go-live checklist item): the `authenticated` policies below
-- grant full admin access to ANY Supabase Auth session. This is only safe
-- because public sign-up MUST be disabled in Authentication → Settings.
-- If customer accounts are ever added, replace these with an
-- admin_users + is_admin(auth.uid()) pattern.

alter table categories      enable row level security;
alter table products        enable row level security;
alter table product_images  enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table store_settings  enable row level security;
alter table delivery_prices enable row level security;
alter table client_reviews  enable row level security;

-- Public storefront reads
create policy "anon read categories" on categories
  for select to anon using (true);

create policy "anon read active products" on products
  for select to anon using (status = 'active');

create policy "anon read product images" on product_images
  for select to anon using (true);

create policy "anon read store settings" on store_settings
  for select to anon using (true);

create policy "anon read delivery prices" on delivery_prices
  for select to anon using (true);

create policy "anon read active reviews" on client_reviews
  for select to anon using (active = true);

-- NO anon policy on orders/order_items — writes go exclusively through the
-- place_order SECURITY DEFINER RPC; reads through get_order_by_number.

-- Admin (single-operator store; see note above)
create policy "admin all categories"      on categories      for all to authenticated using (true) with check (true);
create policy "admin all products"        on products        for all to authenticated using (true) with check (true);
create policy "admin all product images"  on product_images  for all to authenticated using (true) with check (true);
create policy "admin all orders"          on orders          for all to authenticated using (true) with check (true);
create policy "admin all order items"     on order_items     for all to authenticated using (true) with check (true);
create policy "admin all store settings"  on store_settings  for all to authenticated using (true) with check (true);
create policy "admin all delivery prices" on delivery_prices for all to authenticated using (true) with check (true);
create policy "admin all reviews"         on client_reviews  for all to authenticated using (true) with check (true);
