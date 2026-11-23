-- Packs (multi-product bundles) + fully customisable sales pages.
--
--  1. `packs` — a bundle of several products with its own pricing rules
--     (fixed / % off / amount off / custom per-item prices, rounding,
--     psychological endings, floor, quantity tiers, free shipping), an
--     optional sale window, and its own page (`page` jsonb, the block
--     document the page builder edits — see src/lib/pageBuilder/types.ts).
--  2. `product_pages` — the same page document for one product, either
--     replacing the default product page or extending it below.
--  3. `order_items.pack_id` / `pack_contents` — a pack is ONE order line,
--     with the contents snapshotted for the dispatcher.
--  4. `pack_quote()` — the ONE pricing formula, used by place_order. The
--     client mirror is src/lib/packPricing.ts; keep them identical.
--  5. `place_order` — CREATE OR REPLACE on the same signature. Accepts pack
--     lines, checks stock across ALL lines at once (a pack and a single box
--     of the same coffee draw from the same stock), and restores two things
--     0015 silently regressed from 0012: the 'en' order language and the
--     name_en snapshot.
--
-- Permissions: both tables belong to the existing 'products' grant — no new
-- checkbox, no create-worker redeploy. Idempotent: safe to run twice.

-- ===================================================================== packs
create table if not exists packs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  status      text not null default 'draft' check (status in ('draft', 'published')),
  name_fr     text not null check (char_length(name_fr) between 1 and 120),
  name_ar     text check (char_length(name_ar) <= 120),
  name_en     text check (char_length(name_en) <= 120),
  tagline_fr  text check (char_length(tagline_fr) <= 240),
  tagline_ar  text check (char_length(tagline_ar) <= 240),
  tagline_en  text check (char_length(tagline_en) <= 240),
  cover_url   text check (cover_url ~ '^(https://|/)'),
  -- [{ product_id, quantity, price? }] — price = custom unit price for this pack only
  items       jsonb not null default '[]' check (jsonb_typeof(items) = 'array'),
  -- see pack_quote() below for every key
  pricing     jsonb not null default '{"mode":"percent","value":10,"compare":"auto"}'
              check (jsonb_typeof(pricing) = 'object'),
  starts_at   timestamptz,
  ends_at     timestamptz,
  max_per_order int not null default 10 check (max_per_order between 1 and 20),
  featured    boolean not null default false,
  sort_order  int not null default 0,
  page        jsonb not null default '{}' check (jsonb_typeof(page) = 'object'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists packs_updated_at on packs;
create trigger packs_updated_at before update on packs
  for each row execute function update_updated_at();

alter table packs enable row level security;

drop policy if exists "public read published packs" on packs;
create policy "public read published packs" on packs
  for select to anon, authenticated using (status = 'published');

drop policy if exists "staff manage packs" on packs;
create policy "staff manage packs" on packs
  for all to authenticated
  using (has_section('products')) with check (has_section('products'));

-- ============================================================= product_pages
create table if not exists product_pages (
  product_id uuid primary key references products(id) on delete cascade,
  enabled    boolean not null default false,
  -- 'replace' = the custom page IS the product page; 'extend' = default page + blocks below
  mode       text not null default 'replace' check (mode in ('replace', 'extend')),
  page       jsonb not null default '{}' check (jsonb_typeof(page) = 'object'),
  updated_at timestamptz not null default now()
);

drop trigger if exists product_pages_updated_at on product_pages;
create trigger product_pages_updated_at before update on product_pages
  for each row execute function update_updated_at();

alter table product_pages enable row level security;

drop policy if exists "public read enabled product pages" on product_pages;
create policy "public read enabled product pages" on product_pages
  for select to anon, authenticated using (enabled);

drop policy if exists "staff manage product pages" on product_pages;
create policy "staff manage product pages" on product_pages
  for all to authenticated
  using (has_section('products')) with check (has_section('products'));

-- ================================================================ order lines
alter table order_items add column if not exists pack_id uuid references packs(id) on delete set null;
-- [{ product_id, slug, name_fr, quantity }] per ONE pack — what to put in the box
alter table order_items add column if not exists pack_contents jsonb;

-- activity log (0020): attach to the two new tables if that migration ran
do $$
declare t text;
begin
  if to_regprocedure('public.log_admin_activity()') is null then return; end if;
  foreach t in array array['packs', 'product_pages'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_activity', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.log_admin_activity()',
      t || '_activity', t);
  end loop;
end $$;

-- ================================================================ pack_quote
-- pricing keys (all optional except mode):
--   mode     'sum' | 'fixed' | 'percent' | 'amount'
--   value    number  (fixed price / % off (0–95) / DA off)
--   step     round DOWN to a multiple of this (1 = none)
--   ending   0–99: force the last two digits (e.g. 90 → 2 890), never rounding up
--   floor    minimum unit price
--   compare  'auto' (sum of list prices) | 'none' | a number — the crossed-out price
--   tiers    [{ qty, percent }] — extra % off the LINE when buying qty+ packs
--   free_shipping  boolean
-- Item prices: items[].price overrides the product price inside this pack.
-- Returns NULL unit when any product is missing / inactive.
create or replace function pack_quote(p_items jsonb, p_pricing jsonb)
returns table (base numeric, list numeric, unit numeric, compare numeric)
language plpgsql stable security definer set search_path = public as $$
declare
  v_item jsonb;
  v_price numeric;
  v_qty int;
  v_base numeric := 0;
  v_list numeric := 0;
  v_x numeric;
  v_mode text := coalesce(p_pricing->>'mode', 'sum');
  v_value numeric := greatest(coalesce((p_pricing->>'value')::numeric, 0), 0);
  v_step numeric := greatest(coalesce((p_pricing->>'step')::numeric, 1), 1);
  v_ending numeric := (p_pricing->>'ending')::numeric;
  v_floor numeric := greatest(coalesce((p_pricing->>'floor')::numeric, 0), 0);
  v_cmp text := coalesce(p_pricing->>'compare', 'auto');
  v_candidate numeric;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return query select null::numeric, null::numeric, null::numeric, null::numeric;
    return;
  end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item->>'quantity')::int, 1), 1);
    select p.price into v_price from products p
      where p.id = (v_item->>'product_id')::uuid and p.status = 'active';
    if not found then
      return query select null::numeric, null::numeric, null::numeric, null::numeric;
      return;
    end if;
    v_list := v_list + v_price * v_qty;
    -- NOT coalesce(greatest(price, 0), list): greatest() skips NULLs, so a
    -- line with no custom price would come out at 0 DA
    v_base := v_base + case
      when v_item->>'price' is null then v_price
      else greatest((v_item->>'price')::numeric, 0)
    end * v_qty;
  end loop;

  v_x := case v_mode
    when 'fixed'   then v_value
    when 'percent' then round(v_base * (100 - least(v_value, 95)) / 100)
    when 'amount'  then v_base - v_value
    else v_base
  end;
  if v_step > 1 then v_x := floor(v_x / v_step) * v_step; end if;
  if v_ending is not null and v_ending between 0 and 99 then
    v_candidate := floor(v_x / 100) * 100 + v_ending;
    if v_candidate > v_x then v_candidate := v_candidate - 100; end if;
    v_x := v_candidate;
  end if;
  v_x := greatest(v_x, v_floor, 0);

  return query select
    v_base, v_list, v_x,
    case
      when v_cmp = 'none' then null::numeric
      when v_cmp = 'auto' then case when v_list > v_x then v_list else null end
      when v_cmp ~ '^[0-9]+(\.[0-9]+)?$' then case when v_cmp::numeric > v_x then v_cmp::numeric else null end
      else null::numeric
    end;
end;
$$;

-- line total for N packs, tiers applied — the client mirror is packLineTotal()
create or replace function pack_line_total(p_unit numeric, p_qty int, p_pricing jsonb)
returns numeric language sql immutable as $$
  select round(p_unit * p_qty * (100 - least(coalesce((
    select max((t->>'percent')::numeric)
    from jsonb_array_elements(case when jsonb_typeof(p_pricing->'tiers') = 'array'
                                   then p_pricing->'tiers' else '[]'::jsonb end) t
    where (t->>'qty')::int <= p_qty
  ), 0), 95)) / 100);
$$;

-- ================================================================ place_order
create or replace function place_order(items jsonb, customer jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_phone text;
  v_wilaya text;
  v_city text;
  v_delivery_type text;
  v_language text;
  v_item jsonb;
  v_part jsonb;
  v_product products%rowtype;
  v_pack packs%rowtype;
  v_qty int;
  v_line_count int;
  v_subtotal numeric(10,2) := 0;
  v_shipping numeric(10,2);
  v_total numeric(10,2);
  v_delivery delivery_prices%rowtype;
  v_settings store_settings%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_recent_10m int;
  v_recent_24h int;
  v_burst_1m int;
  v_burst_1h int;
  v_need jsonb := '{}'::jsonb;   -- product_id -> units needed across every line
  v_pid text;
  v_units int;
  v_unit numeric;
  v_line numeric;
  v_free_ship boolean := false;
  v_contents jsonb;
  v_cost numeric;
begin
  -- 0. Server-side customer validation (client zod/honeypot is bypassable)
  v_name := btrim(coalesce(customer->>'name', ''));
  v_phone := btrim(coalesce(customer->>'phone', ''));
  v_wilaya := btrim(coalesce(customer->>'wilaya', ''));
  v_city := btrim(coalesce(customer->>'city', ''));
  v_delivery_type := coalesce(customer->>'delivery_type', 'home');
  v_language := coalesce(customer->>'language', 'fr');

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'ERR_INVALID_INPUT: name';
  end if;
  if v_phone !~ '^0[5-7][0-9]{8}$' then
    raise exception 'ERR_INVALID_INPUT: phone';
  end if;
  if char_length(v_city) < 1 or char_length(v_city) > 80 then
    raise exception 'ERR_INVALID_INPUT: city';
  end if;
  if v_delivery_type not in ('home', 'office') then
    raise exception 'ERR_INVALID_INPUT: delivery_type';
  end if;
  -- RESTORED from 0012 (0015 dropped 'en'): English orders kept their language
  if v_language not in ('fr', 'ar', 'en') then
    v_language := 'fr';
  end if;

  -- 1a. Per-phone rate limit (cancelled orders still count)
  select count(*) into v_recent_10m from orders
    where customer_phone = v_phone and created_at > now() - interval '10 minutes';
  if v_recent_10m >= 3 then
    raise exception 'ERR_RATE_LIMIT: 10m';
  end if;
  select count(*) into v_recent_24h from orders
    where customer_phone = v_phone and created_at > now() - interval '24 hours';
  if v_recent_24h >= 10 then
    raise exception 'ERR_RATE_LIMIT: 24h';
  end if;

  -- 1b. Global burst circuit breaker (see 0015)
  select count(*) into v_burst_1m from orders
    where created_at > now() - interval '1 minute';
  select count(*) into v_burst_1h from orders
    where created_at > now() - interval '1 hour';
  if v_burst_1m >= 25 or v_burst_1h >= 250 then
    raise log 'place_order burst breaker tripped: %/min, %/hour', v_burst_1m, v_burst_1h;
    raise exception 'ERR_RATE_LIMIT: burst';
  end if;

  -- 2. Cart shape
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'ERR_CART_EMPTY';
  end if;
  v_line_count := jsonb_array_length(items);
  if v_line_count > 20 then
    raise exception 'ERR_PRODUCT_UNAVAILABLE: too many lines';
  end if;

  -- 3. First pass: validate every line, price it SERVER-SIDE, sum the units
  --    each product needs across ALL lines (single boxes + packs together)
  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty <= 0 or v_qty > 20 then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: quantity';
    end if;

    if v_item ? 'pack_id' then
      select * into v_pack from packs
        where id = (v_item->>'pack_id')::uuid and status = 'published'
          and (starts_at is null or starts_at <= now())
          and (ends_at is null or ends_at > now());
      if not found then
        raise exception 'ERR_PRODUCT_UNAVAILABLE: pack %', v_item->>'pack_id';
      end if;
      if v_qty > v_pack.max_per_order then
        raise exception 'ERR_PRODUCT_UNAVAILABLE: quantity';
      end if;
      select q.unit into v_unit from pack_quote(v_pack.items, v_pack.pricing) q;
      if v_unit is null then
        raise exception 'ERR_PRODUCT_UNAVAILABLE: pack %', v_pack.slug;
      end if;
      v_subtotal := v_subtotal + pack_line_total(v_unit, v_qty, v_pack.pricing);
      if coalesce((v_pack.pricing->>'free_shipping')::boolean, false) then
        v_free_ship := true;
      end if;
      for v_part in select * from jsonb_array_elements(v_pack.items) loop
        v_pid := v_part->>'product_id';
        v_need := jsonb_set(v_need, array[v_pid],
          to_jsonb(coalesce((v_need->>v_pid)::int, 0)
                   + greatest(coalesce((v_part->>'quantity')::int, 1), 1) * v_qty));
      end loop;
    else
      select * into v_product from products
        where id = (v_item->>'product_id')::uuid and status = 'active';
      if not found then
        raise exception 'ERR_PRODUCT_UNAVAILABLE: %', v_item->>'product_id';
      end if;
      -- 4. Server-side price only — ignore any client-sent price
      v_subtotal := v_subtotal + v_product.price * v_qty;
      v_pid := v_product.id::text;
      v_need := jsonb_set(v_need, array[v_pid],
        to_jsonb(coalesce((v_need->>v_pid)::int, 0) + v_qty));
    end if;
  end loop;

  -- 3b. Lock every product touched (stable id order: no deadlock between two
  --     concurrent carts) and reject — never clamp — on insufficient stock
  for v_pid, v_units in
    select key, value::int from jsonb_each_text(v_need) order by key
  loop
    select * into v_product from products where id = v_pid::uuid for update;
    if not found or v_product.status <> 'active' then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: %', v_pid;
    end if;
    if v_product.stock < v_units then
      raise exception 'ERR_STOCK: %', v_product.slug;
    end if;
  end loop;

  -- 5. Shipping from delivery_prices; unknown/disabled wilaya = rejected
  select * into v_delivery from delivery_prices where wilaya = v_wilaya;
  if not found then
    raise exception 'ERR_INVALID_INPUT: wilaya';
  end if;
  if not v_delivery.active then
    raise exception 'ERR_WILAYA_DISABLED: %', v_wilaya;
  end if;
  v_shipping := case v_delivery_type
    when 'office' then v_delivery.office_price
    else v_delivery.home_price
  end;

  select * into v_settings from store_settings where id = 1;
  if v_free_ship
     or (v_settings.free_ship_threshold is not null
         and v_subtotal >= v_settings.free_ship_threshold) then
    v_shipping := 0;
  end if;

  v_total := v_subtotal + v_shipping;

  -- 6. Insert order + snapshotted items, decrement stock
  v_order_number := 'NRL-' || to_char(now(), 'YYYYMMDD') || '-' ||
    upper(substr(md5(gen_random_uuid()::text), 1, 10));

  insert into orders
    (order_number, customer_name, customer_phone, wilaya, city,
     subtotal, shipping, total, status, language, delivery_type)
  values
    (v_order_number, v_name, v_phone, v_wilaya, v_city,
     v_subtotal, v_shipping, v_total, 'pending', v_language, v_delivery_type)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := (v_item->>'quantity')::int;

    if v_item ? 'pack_id' then
      select * into v_pack from packs where id = (v_item->>'pack_id')::uuid;
      select q.unit into v_unit from pack_quote(v_pack.items, v_pack.pricing) q;
      v_line := pack_line_total(v_unit, v_qty, v_pack.pricing);

      select coalesce(jsonb_agg(jsonb_build_object(
               'product_id', p.id, 'slug', p.slug, 'name_fr', p.name_fr,
               'quantity', greatest(coalesce((e->>'quantity')::int, 1), 1))), '[]'::jsonb),
             coalesce(sum(coalesce(c.cost_price, 0) * greatest(coalesce((e->>'quantity')::int, 1), 1)), 0)
        into v_contents, v_cost
        from jsonb_array_elements(v_pack.items) e
        join products p on p.id = (e->>'product_id')::uuid
        left join product_costs c on c.product_id = p.id;

      insert into order_items
        (order_id, product_id, pack_id, pack_contents, name_fr, name_ar, name_en,
         price, quantity, unit_cost, image_url)
      values
        (v_order_id, null, v_pack.id, v_contents,
         v_pack.name_fr, coalesce(v_pack.name_ar, v_pack.name_fr), v_pack.name_en,
         round(v_line / v_qty, 2), v_qty, v_cost,
         coalesce(v_pack.cover_url,
           (select url from product_images
              where product_id = (v_pack.items->0->>'product_id')::uuid
              order by sort_order limit 1)));
    else
      select * into v_product from products where id = (v_item->>'product_id')::uuid;
      insert into order_items
        (order_id, product_id, name_fr, name_ar, name_en, price, quantity, color, size, image_url)
      values
        (v_order_id, v_product.id, v_product.name_fr, v_product.name_ar, v_product.name_en,
         v_product.price, v_qty,
         left(v_item->>'color', 40), left(v_item->>'size', 40),
         (select url from product_images
            where product_id = v_product.id order by sort_order limit 1));
    end if;
  end loop;

  for v_pid, v_units in select key, value::int from jsonb_each_text(v_need) loop
    update products set stock = stock - v_units where id = v_pid::uuid;
  end loop;

  return v_order_number;
end;
$$;

grant execute on function place_order(jsonb, jsonb) to anon;
-- pack_quote / pack_line_total are internal; the storefront uses the TS mirror
revoke execute on function pack_quote(jsonb, jsonb) from public, anon, authenticated;
