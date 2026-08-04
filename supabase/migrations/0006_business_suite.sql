-- Business suite: the website's P&L (/admin/finance) and the physical shop's
-- own ledger + till (/admin/store). ONE aggregation engine, TWO completely
-- separate sets of tables — the two businesses never share a total, a
-- catalogue or a stock count. The only thing they share is the supplier list.
--
-- Adds two grantable section keys: 'finance' and 'store'. KEEP IN SYNC with
-- src/lib/adminSections.ts and create-worker's ALLOWED_SECTIONS.

-- ----------------------------------------------------------------- suppliers
create table if not exists suppliers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  email      text,
  address    text,
  notes      text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------- product_costs
-- Buy price for a WEBSITE product, deliberately a SIDE TABLE: RLS is
-- row-level, and `products` carries a public "anon read active products"
-- policy — a cost column there would publish the shop's margins to its
-- competitors through the REST API.
create table if not exists product_costs (
  product_id  uuid primary key references products(id) on delete cascade,
  cost_price  numeric(12,2) not null default 0,
  supplier_id uuid references suppliers(id) on delete set null,
  notes       text,
  updated_at  timestamptz not null default now()
);

create trigger product_costs_updated_at
  before update on product_costs
  for each row execute function update_updated_at();

-- Open the buy-price screen on an editable list, not an empty join.
insert into product_costs (product_id, cost_price)
select id, 0 from products
on conflict (product_id) do nothing;

-- ------------------------------------------------- cost frozen onto the line
alter table order_items add column if not exists unit_cost numeric(12,2) not null default 0;

-- Margin must be computed against what the unit cost was ON THE DAY OF THE
-- SALE; joining live to product_costs silently rewrites last month's profit
-- every time the owner records a new buy price.
--
-- A trigger, NOT an edit to place_order(): that RPC has been hardened for
-- stock locking and rate limiting, and re-declaring it to set one column risks
-- regressing all of it. The trigger fires for every insert path, the RPC
-- included.
create or replace function snapshot_order_item_cost()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.unit_cost, 0) = 0 and new.product_id is not null then
    select coalesce(cost_price, 0) into new.unit_cost
    from product_costs where product_id = new.product_id;
    new.unit_cost := coalesce(new.unit_cost, 0);
  end if;
  return new;
end;
$$;

drop trigger if exists order_items_snapshot_cost on order_items;
create trigger order_items_snapshot_cost
  before insert on order_items
  for each row execute function snapshot_order_item_cost();

-- ------------------------------------------------------------ store_products
-- The counter's own catalogue — a SECOND table, not a flag on `products`. The
-- two businesses stock different things, price them differently, and must
-- never cross-contaminate a stock count. Services live here via `kind`,
-- sharing one sale-line shape; their cost_price/stock stay 0.
create table if not exists store_products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  kind        text not null default 'product' check (kind in ('product','service')),
  sku         text,
  category    text,
  cost_price  numeric(12,2) not null default 0,
  price       numeric(12,2) not null default 0,
  stock       integer not null default 0,
  supplier_id uuid references suppliers(id) on delete set null,
  active      boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger store_products_updated_at
  before update on store_products
  for each row execute function update_updated_at();

-- ------------------------------------------------ purchases + expenses (both)
create table if not exists stock_purchases (
  id               uuid primary key default gen_random_uuid(),
  scope            text not null check (scope in ('online','store')),
  product_id       uuid references products(id) on delete set null,
  store_product_id uuid references store_products(id) on delete set null,
  label            text,
  supplier_id      uuid references suppliers(id) on delete set null,
  quantity         integer not null default 0,
  unit_cost        numeric(12,2) not null default 0,
  total_cost       numeric(12,2) generated always as (quantity * unit_cost) stored,
  purchased_at     date not null default current_date,
  notes            text,
  created_at       timestamptz not null default now()
);

create index if not exists stock_purchases_scope_date_idx
  on stock_purchases (scope, purchased_at desc);

create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null check (scope in ('online','store')),
  label       text not null,
  category    text not null default 'other' check (category in
              ('rent','salary','marketing','delivery','supplies','utilities','other')),
  amount      numeric(12,2) not null default 0,
  spent_at    date not null default current_date,
  supplier_id uuid references suppliers(id) on delete set null,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists expenses_scope_date_idx on expenses (scope, spent_at desc);

-- ------------------------------------------------------- the counter's sales
create table if not exists store_sales (
  id             uuid primary key default gen_random_uuid(),
  sale_number    text not null unique,
  customer_name  text,
  customer_phone text,
  subtotal       numeric(12,2) not null default 0,
  discount       numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  -- denormalised on the header: the range dashboards would otherwise have to
  -- load every line just to show a margin.
  cost_total     numeric(12,2) not null default 0,
  payment_method text not null default 'cash'
                 check (payment_method in ('cash','card','transfer','other')),
  sold_at        date not null default current_date,
  notes          text,
  created_at     timestamptz not null default now()
);

create index if not exists store_sales_date_idx on store_sales (sold_at desc);

create table if not exists store_sale_items (
  id               uuid primary key default gen_random_uuid(),
  sale_id          uuid not null references store_sales(id) on delete cascade,
  store_product_id uuid references store_products(id) on delete set null,
  name             text not null,
  kind             text not null default 'product',
  unit_price       numeric(12,2) not null default 0,
  unit_cost        numeric(12,2) not null default 0,
  quantity         integer not null default 1,
  line_total       numeric(12,2) generated always as (unit_price * quantity) stored
);

create index if not exists store_sale_items_sale_idx on store_sale_items (sale_id);

-- Without this the catalogue drifts every time a mistyped sale is removed.
-- (Contrast the website side, where deleting an order does NOT restock — that
-- fires on the *cancelled* transition. Tell the client.)
create or replace function restock_store_sale_item()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.store_product_id is not null then
    update store_products
       set stock = stock + old.quantity
     where id = old.store_product_id and kind = 'product';
  end if;
  return old;
end;
$$;

drop trigger if exists store_sale_items_restock on store_sale_items;
create trigger store_sale_items_restock
  before delete on store_sale_items
  for each row execute function restock_store_sale_item();

-- ------------------------------------------------------- create_store_sale
-- Header, lines and stock decrements have to land together: a crash between
-- them leaves either a sale with no lines (revenue with no cost) or stock gone
-- with nothing sold.
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
  -- DEFINER writes past the very policies that would otherwise enforce this.
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

  -- pass 1: validate, lock, price
  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty <= 0 or v_qty > 1000 then
      raise exception 'ERR_INVALID_QTY: quantity out of range';
    end if;

    if (v_item->>'store_product_id') is not null then
      -- lock before the stock check, or two tills sell the last unit twice
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
      -- The client may override the SELL price (haggling happens at a
      -- counter), never the COST. A browser that could dictate cost could
      -- dictate margin.
      v_cost := v_product.cost_price;
      v_price := coalesce((v_item->>'unit_price')::numeric, v_product.price);
    else
      -- ad-hoc line, nothing in the catalogue
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

  -- a fat-fingered discount must not book negative revenue
  v_discount := least(greatest(coalesce((sale->>'discount')::numeric, 0), 0), v_subtotal);

  v_sale_number := 'ST-' || to_char(now(), 'YYYYMMDD') || '-' ||
                   upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));

  insert into store_sales (sale_number, customer_name, customer_phone, subtotal,
                           discount, total, cost_total, payment_method, sold_at, notes)
  values (v_sale_number,
          nullif(left(btrim(coalesce(sale->>'customer_name', '')), 80), ''),
          nullif(left(btrim(coalesce(sale->>'customer_phone', '')), 20), ''),
          v_subtotal, v_discount, v_subtotal - v_discount, v_cost_total,
          v_method, v_sold_at,
          nullif(left(btrim(coalesce(sale->>'notes', '')), 500), ''))
  returning id into v_sale_id;

  -- pass 2: write the lines and decrement stock (already verified sufficient)
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

-- Postgres grants EXECUTE to PUBLIC on every new function and `anon` inherits
-- it — revoking from anon alone would leave the till callable by any visitor.
revoke execute on function create_store_sale(jsonb, jsonb) from public;
revoke execute on function create_store_sale(jsonb, jsonb) from anon;
grant  execute on function create_store_sale(jsonb, jsonb) to authenticated;

-- ----------------------------------------------------------------------- RLS
alter table suppliers        enable row level security;
alter table product_costs    enable row level security;
alter table store_products   enable row level security;
alter table stock_purchases  enable row level security;
alter table expenses         enable row level security;
alter table store_sales      enable row level security;
alter table store_sale_items enable row level security;

-- shared by both ledgers
create policy "admin manage suppliers" on suppliers
  for all to authenticated
  using (has_section('finance') or has_section('store'))
  with check (has_section('finance') or has_section('store'));

create policy "admin manage stock purchases" on stock_purchases
  for all to authenticated
  using (has_section('finance') or has_section('store'))
  with check (has_section('finance') or has_section('store'));

create policy "admin manage expenses" on expenses
  for all to authenticated
  using (has_section('finance') or has_section('store'))
  with check (has_section('finance') or has_section('store'));

-- the product editor writes the buy price inline when a product is created
create policy "admin manage product costs" on product_costs
  for all to authenticated
  using (has_section('finance') or has_section('products'))
  with check (has_section('finance') or has_section('products'));

-- the counter's own tables
create policy "admin manage store products" on store_products
  for all to authenticated
  using (has_section('store')) with check (has_section('store'));

create policy "admin manage store sales" on store_sales
  for all to authenticated
  using (has_section('store')) with check (has_section('store'));

create policy "admin manage store sale items" on store_sale_items
  for all to authenticated
  using (has_section('store')) with check (has_section('store'));
