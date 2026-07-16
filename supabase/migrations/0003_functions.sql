-- Server-side order placement — the security core. NEVER trust client prices.
-- Evolve by CREATE OR REPLACE on the same signature; never rename it.

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

  -- 1. Per-phone rate limit (cancelled orders still count)
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
  v_order_number := 'NRL-' || to_char(now(), 'YYYYMMDD') || '-' ||
    upper(substr(md5(gen_random_uuid()::text), 1, 5));

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

-- Restock on the transition INTO 'cancelled' (COD refusals are common);
-- guarded so re-saving an already-cancelled order can't double-credit.
create or replace function restock_cancelled_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update products p
      set stock = p.stock + oi.qty
      from (
        select product_id, sum(quantity) as qty
        from order_items
        where order_id = new.id and product_id is not null
        group by product_id
      ) oi
      where p.id = oi.product_id;
  end if;
  return new;
end;
$$;

create trigger orders_restock_on_cancel
  after update of status on orders
  for each row execute function restock_cancelled_order();

-- Guest order lookup for the confirmation page: orders has no anon SELECT
-- policy (it holds every customer's phone), so the page reads through this
-- minimal RPC — phone/address deliberately omitted from the payload.
create or replace function get_order_by_number(p_order_number text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_items jsonb;
begin
  select * into v_order from orders where order_number = p_order_number;
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'name_fr', name_fr,
      'name_ar', name_ar,
      'price', price,
      'quantity', quantity,
      'image_url', image_url
    ) order by id), '[]'::jsonb)
  into v_items
  from order_items where order_id = v_order.id;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'customer_name', v_order.customer_name,
    'wilaya', v_order.wilaya,
    'city', v_order.city,
    'delivery_type', v_order.delivery_type,
    'subtotal', v_order.subtotal,
    'shipping', v_order.shipping,
    'total', v_order.total,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'items', v_items
  );
end;
$$;

grant execute on function get_order_by_number(text) to anon;
