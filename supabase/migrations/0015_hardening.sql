-- Post-audit hardening. Three defects, all found in a full-stack review:
--
--  1. Order / sale numbers were 5 hex chars (~1M values). `get_order_by_number`
--     is anon-readable BY NUMBER and returns the customer's name + city, so a
--     5-char space is a scrape of the day's customer list. Widen to 10.
--  2. `place_order` rate-limited per phone only — a bot rotating fake numbers
--     bypassed it completely, and every fake order decremented real stock.
--     Add a global burst circuit breaker.
--  3. `subscribe_newsletter` capped signups at 20 per HOUR globally: ~20 junk
--     addresses kept inside any trailing hour locked out every real signup
--     indefinitely, as a generic error. Narrow the window to 1 minute (so a
--     lockout self-heals) and raise the ceiling far above any real burst.
--
-- Plus: `apply_stock_delta()` — an ATOMIC stock adjustment RPC to replace the
-- read-Number()-write round-trip in useFinance.ts that lost updates under any
-- concurrent purchase / order / cancel.
--
-- Every function here is CREATE OR REPLACE on the exact signature it already
-- has (see 0003, 0006, 0010) — same grants, evolve in place.

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
  v_product products%rowtype;
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
  if v_language not in ('fr', 'ar') then
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

  -- 1b. Global burst circuit breaker. The per-phone limit above does nothing
  -- against a bot that picks a fresh fake number every request — which is the
  -- abuse case, and each fake order still moves real stock. A single COD store
  -- never legitimately books 25 orders in a minute; if it does, one lost sale
  -- while a human checks the logs beats an emptied catalogue. Short window so a
  -- real spike clears on its own; logged so the operator can see it trip.
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

  -- 3. First pass: validate every line + sufficient stock (reject, never clamp)
  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty <= 0 or v_qty > 20 then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: quantity';
    end if;

    select * into v_product from products
      where id = (v_item->>'product_id')::uuid and status = 'active'
      for update;
    if not found then
      raise exception 'ERR_PRODUCT_UNAVAILABLE: %', v_item->>'product_id';
    end if;
    if v_product.stock < v_qty then
      raise exception 'ERR_STOCK: %', v_product.slug;
    end if;

    -- 4. Server-side price only — ignore any client-sent price
    v_subtotal := v_subtotal + v_product.price * v_qty;
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
  if v_settings.free_ship_threshold is not null
     and v_subtotal >= v_settings.free_ship_threshold then
    v_shipping := 0;
  end if;

  v_total := v_subtotal + v_shipping;

  -- 6. Insert order + snapshotted items, decrement stock
  --    10 hex chars (~1.1e12 values), not 5 — the number is the anon lookup key
  --    for get_order_by_number and a 5-char space is enumerable.
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
    select * into v_product from products where id = (v_item->>'product_id')::uuid;

    insert into order_items
      (order_id, product_id, name_fr, name_ar, price, quantity, color, size, image_url)
    values
      (v_order_id, v_product.id, v_product.name_fr, v_product.name_ar,
       v_product.price, v_qty,
       left(v_item->>'color', 40), left(v_item->>'size', 40),
       (select url from product_images
          where product_id = v_product.id order by sort_order limit 1));

    update products set stock = stock - v_qty where id = v_product.id;
  end loop;

  return v_order_number;
end;
$$;

grant execute on function place_order(jsonb, jsonb) to anon;

-- ========================================================= create_store_sale
-- Only the sale-number width changes (5 -> 10 hex); the rest is 0006 verbatim.
create or replace function create_store_sale(sale jsonb, items jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item        jsonb;
  v_product     store_products%rowtype;
  v_qty         integer;
  v_price       numeric(12,2);
  v_cost        numeric(12,2);
  v_name        text;
  v_kind        text;
  v_subtotal    numeric(12,2) := 0;
  v_cost_total  numeric(12,2) := 0;
  v_discount    numeric(12,2);
  v_sale_id     uuid;
  v_sale_number text;
  v_method      text;
  v_sold_at     date;
begin
  if not has_section('store') then
    raise exception 'ERR_FORBIDDEN: store section required';
  end if;

  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'ERR_EMPTY_SALE: no lines';
  end if;
  if jsonb_array_length(items) > 100 then
    raise exception 'ERR_EMPTY_SALE: too many lines';
  end if;

  v_method := coalesce(sale->>'payment_method', 'cash');
  if v_method not in ('cash','card','transfer','other') then
    v_method := 'other';
  end if;

  v_sold_at := coalesce((sale->>'sold_at')::date, current_date);

  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty <= 0 or v_qty > 1000 then
      raise exception 'ERR_INVALID_QTY: quantity out of range';
    end if;

    if (v_item->>'store_product_id') is not null then
      select * into v_product from store_products
       where id = (v_item->>'store_product_id')::uuid
       for update;

      if not found then
        raise exception 'ERR_ITEM_NOT_FOUND: unknown catalogue item';
      end if;
      if v_product.kind = 'product' and v_product.stock < v_qty then
        raise exception 'ERR_OUT_OF_STOCK: %', v_product.name;
      end if;

      v_name := v_product.name;
      v_kind := v_product.kind;
      v_cost := v_product.cost_price;
      v_price := coalesce((v_item->>'unit_price')::numeric, v_product.price);
    else
      v_name := left(btrim(coalesce(v_item->>'name', '')), 120);
      if v_name = '' then
        raise exception 'ERR_ITEM_NOT_FOUND: ad-hoc line needs a name';
      end if;
      v_kind := 'product';
      v_cost := greatest(coalesce((v_item->>'unit_cost')::numeric, 0), 0);
      v_price := coalesce((v_item->>'unit_price')::numeric, 0);
    end if;

    if v_price < 0 then
      raise exception 'ERR_INVALID_QTY: negative price';
    end if;

    v_subtotal := v_subtotal + v_price * v_qty;
    v_cost_total := v_cost_total + v_cost * v_qty;
  end loop;

  v_discount := least(greatest(coalesce((sale->>'discount')::numeric, 0), 0), v_subtotal);

  v_sale_number := 'ST-' || to_char(now(), 'YYYYMMDD') || '-' ||
                   upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));

  insert into store_sales (sale_number, customer_name, customer_phone, subtotal,
                           discount, total, cost_total, payment_method, sold_at, notes)
  values (v_sale_number,
          nullif(left(btrim(coalesce(sale->>'customer_name', '')), 80), ''),
          nullif(left(btrim(coalesce(sale->>'customer_phone', '')), 20), ''),
          v_subtotal, v_discount, v_subtotal - v_discount, v_cost_total,
          v_method, v_sold_at,
          nullif(left(btrim(coalesce(sale->>'notes', '')), 500), ''))
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := (v_item->>'quantity')::int;

    if (v_item->>'store_product_id') is not null then
      select * into v_product from store_products
       where id = (v_item->>'store_product_id')::uuid;

      insert into store_sale_items (sale_id, store_product_id, name, kind,
                                    unit_price, unit_cost, quantity)
      values (v_sale_id, v_product.id, v_product.name, v_product.kind,
              coalesce((v_item->>'unit_price')::numeric, v_product.price),
              v_product.cost_price, v_qty);

      if v_product.kind = 'product' then
        update store_products set stock = stock - v_qty where id = v_product.id;
      end if;
    else
      insert into store_sale_items (sale_id, store_product_id, name, kind,
                                    unit_price, unit_cost, quantity)
      values (v_sale_id, null,
              left(btrim(v_item->>'name'), 120), 'product',
              coalesce((v_item->>'unit_price')::numeric, 0),
              greatest(coalesce((v_item->>'unit_cost')::numeric, 0), 0), v_qty);
    end if;
  end loop;

  return v_sale_number;
end;
$$;

revoke execute on function create_store_sale(jsonb, jsonb) from public;
revoke execute on function create_store_sale(jsonb, jsonb) from anon;
grant  execute on function create_store_sale(jsonb, jsonb) to authenticated;

-- ======================================================= subscribe_newsletter
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
  if length(v_email) > 160
     or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$' then
    raise exception 'ERR_INVALID_INPUT: email';
  end if;

  if v_source not in ('site', 'popup', 'import', 'checkout') then
    v_source := 'site';
  end if;

  -- Global throttle, but a NARROW one. The previous 20-per-HOUR ceiling let a
  -- bot keep ~20 rotated addresses inside any trailing hour and lock out every
  -- real signup indefinitely — an invisible, permanent outage. A 1-minute
  -- window self-heals in 60s, and 60 signups in a minute is far past anything
  -- a shop this size sees organically, so a real campaign spike sails under it
  -- while a flood still trips (and gets logged for the operator).
  select count(*) into v_recent
  from newsletter_subscribers
  where created_at > now() - interval '1 minute';

  if v_recent >= 60 then
    raise log 'subscribe_newsletter throttle tripped: % signups in the last minute', v_recent;
    raise exception 'ERR_RATE_LIMIT: too many signups';
  end if;

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

-- ========================================================== apply_stock_delta
-- Atomic replacement for useFinance.ts's SELECT stock -> UPDATE stock = N + q.
-- That round-trip lost writes whenever a purchase, an order decrement or a
-- cancel-restock landed between the read and the write. One statement, one lock.
--
-- SECURITY DEFINER so it can write past RLS — which means it has to re-check
-- the caller's grants itself, mirroring the table policies from 0004 / 0006.
create or replace function apply_stock_delta(p_scope text, p_id uuid, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_delta is null or p_delta = 0 then
    return;
  end if;

  if p_scope = 'online' then
    if not (has_section('products') or has_section('finance')) then
      raise exception 'ERR_FORBIDDEN: products or finance section required';
    end if;
    update products
       set stock = greatest(stock + p_delta, 0)
     where id = p_id;
    if not found then
      raise exception 'ERR_NOT_FOUND: product %', p_id;
    end if;

  elsif p_scope = 'store' then
    if not has_section('store') then
      raise exception 'ERR_FORBIDDEN: store section required';
    end if;
    update store_products
       set stock = greatest(stock + p_delta, 0)
     where id = p_id and kind = 'product';
    if not found then
      raise exception 'ERR_NOT_FOUND: store product %', p_id;
    end if;

  else
    raise exception 'ERR_INVALID_INPUT: scope';
  end if;
end;
$$;

revoke execute on function apply_stock_delta(text, uuid, integer) from public;
revoke execute on function apply_stock_delta(text, uuid, integer) from anon;
grant  execute on function apply_stock_delta(text, uuid, integer) to authenticated;
