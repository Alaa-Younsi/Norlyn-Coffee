-- English as a first-class CONTENT language.
--
-- 0008 made 'en' an accepted order language, but only the interface was ever
-- translated: every localized column in the schema was `*_fr` / `*_ar`, so
-- `pickLang()` fell back to French for product names, descriptions, capsule
-- details, article bodies, slide captions and image alt text. An English
-- visitor got an English shell wrapped around a French shop.
--
-- This migration adds the missing column to every localized table and fills it
-- for the launch content seeded by 0001/0009. Everything stays nullable and
-- `pickLang()` still falls back to FR, so a row the client adds later without
-- English is a slightly French page, never an empty one.
--
-- Kept in sync with src/types/db.ts, src/data/fallback.ts, src/data/journal.ts
-- and src/data/slides.ts (the no-Supabase mirrors).

-- ---------------------------------------------------------------- columns
alter table categories    add column if not exists name_en        text;
alter table categories    add column if not exists description_en text;

alter table products      add column if not exists name_en        text;
alter table products      add column if not exists description_en text;
alter table products      add column if not exists details_en     text[] not null default '{}';

-- Snapshot, like name_fr/name_ar: the confirmation page and the admin order
-- sheet must keep reading correctly after the product is renamed or deleted.
alter table order_items   add column if not exists name_en        text;

alter table media_slides  add column if not exists title_en       text;
alter table media_slides  add column if not exists subtitle_en    text;

alter table site_images   add column if not exists alt_en         text;

alter table articles      add column if not exists title_en       text;
alter table articles      add column if not exists excerpt_en     text;
alter table articles      add column if not exists body_en        text;
alter table articles      add column if not exists tag_en         text;

-- ------------------------------------------------------------- categories
update categories set
  name_en        = 'Espresso, 100 % organic',
  description_en = 'Four intensities, from the boldest to the most aromatic. No sugar, no additives, sealed in pure food-grade aluminium.'
where slug = 'espresso-bio';

update categories set
  name_en        = 'Flavoured capsules',
  description_en = 'The same espresso, four indulgent aromas: hazelnut, vanilla, caramel and chocolate.'
where slug = 'capsules-aromatisees';

-- --------------------------------------------------------------- products
-- The two detail lists are shared by family, so they are set once each rather
-- than repeated on all eight rows.
update products set details_en = array[
  '100 % organic — natural beans, 0 % sugar',
  'Pure food-grade aluminium capsule, 0 % chemicals',
  'Made in Algeria by certified experts',
  'Box of 10 capsules',
  'Nespresso®-compatible'
]
where slug in ('moriva-noir', 'moriva-brun', 'moriva-vert', 'moriva-or');

update products set details_en = array[
  'Flavoured espresso, 0 % added sugar',
  'Pure food-grade aluminium capsule, 0 % chemicals',
  'Made in Algeria by certified experts',
  'Box of 10 capsules',
  'Nespresso®-compatible'
]
where slug in ('moriva-noisette', 'moriva-vanille', 'moriva-caramel', 'moriva-chocolat');

update products p set
  name_en        = s.name_en,
  description_en = s.description_en
from (values
  ('moriva-noir', 'Moriva Noir',
   'Our highest intensity. Robusta-led, thick-bodied, dark crema — coffee for people who like to be woken up.'),
  ('moriva-brun', 'Moriva Brun',
   'One step below the Noir: round, chocolatey, long on the palate. The intensity without the bitterness.'),
  ('moriva-vert', 'Moriva Vert',
   'The exact balance between strength and softness. Arabica and robusta in harmony — the everyday espresso.'),
  ('moriva-or', 'Moriva Or',
   'Our finest quality. Arabica-led, low intensity, aromatic and floral — here it is the flavour that leads.'),
  ('moriva-noisette', 'Moriva Noisette',
   'The Moriva espresso lifted by roasted hazelnut, indulgent without being sweet.'),
  ('moriva-vanille', 'Moriva Vanille',
   'A soft, creamy espresso scented with vanilla — the roundest cup in the range.'),
  ('moriva-caramel', 'Moriva Caramel',
   'Buttered caramel and a tight shot: the sweet-salt finish that goes best with dessert.'),
  ('moriva-chocolat', 'Moriva Chocolat',
   'Deep cocoa and a bold shot — the most powerful of our aromas, almost a mocha.')
) as s(slug, name_en, description_en)
where p.slug = s.slug;

-- ----------------------------------------------------------- image slots
-- Only the seeded slots. A slot the client has since re-uploaded keeps
-- whatever alt text they typed; this fills the English column where the row
-- is still the one 0009 wrote.
update site_images s set alt_en = v.alt_en
from (values
  ('home.gallery.1', 'A Moriva espresso served in a glass'),
  ('home.gallery.2', 'The Moriva range and its capsules'),
  ('home.gallery.3', 'A Moriva box — aluminium capsules'),
  ('about.hero',     'The four Moriva intensities'),
  ('about.origin',   'Coffee beans and Moriva capsules'),
  ('about.roastery', 'The Moriva Brun box'),
  ('about.packaging','The full range on the bench'),
  ('about.sealing',  'A sealed Moriva Vert box'),
  ('about.team',     'The Moriva vans before the round'),
  ('blog.hero',      'Moriva on the shelf'),
  ('contact.side',   'A Moriva delivery van')
) as v(slot, alt_en)
where s.slot = v.slot and s.alt_en is null;

-- ------------------------------------------------------------ hero slides
-- Matched on the French caption rather than on a position: 0009 only seeds
-- the slider when it is empty, and the client re-orders and deletes slides
-- freely, so `sort_order = 2` names nothing stable. A caption they have since
-- rewritten simply does not match, and stays untouched.
update media_slides m set
  title_en    = v.title_en,
  subtitle_en = v.subtitle_en
from (values
  ('Quatre intensités',           'Four intensities',
   '100 % organic, 0 % sugar'),
  ('Une crema dense et dorée',    'A dense, golden crema',
   'The result of a dose weighed to a tenth of a gram'),
  ('Les capsules aromatisées',    'The flavoured capsules',
   'Hazelnut, vanilla, caramel, chocolate'),
  ('Livrées dans les 58 wilayas', 'Delivered to all 58 wilayas',
   'Cash on delivery')
) as v(title_fr, title_en, subtitle_en)
where m.title_fr = v.title_fr and m.title_en is null;

-- ---------------------------------------------------------------- articles
-- Same dollar-quoting as 0009: the prose carries apostrophes, and a blank line
-- is the editor's paragraph break (see src/pages/Article.tsx).
update articles set
  title_en   = 'How a Moriva capsule is born',
  tag_en     = 'Manufacturing',
  excerpt_en = $x$From green bean to sealed lid: the six stages every capsule goes through before it reaches your machine.$x$,
  body_en    = $x$An espresso capsule looks simple. Six grams of coffee, a little aluminium, a lid. In reality, between the green bean and the capsule you slide into your machine there is a whole chain of work — and it is in that chain that the difference is made between a decent coffee and one you want to make again the next morning.

Here, stage by stage, is what happens in our workshop.

1. Choosing the lot

Everything starts with the green bean. We buy by the lot, never as undifferentiated bulk, and we taste before we buy: a sample is roasted, ground and extracted under exactly the conditions the finished capsule will meet. If the cup does not keep its promises, the lot is refused. This is the only stage where saying no is still cheap — after it, it is too late.

2. Roasting

Each Moriva profile has its own heat curve. The Noir, robusta-led, climbs higher and holds longer to build a thick body and a dark crema. The Or, arabica-led, stops earlier: we are after floral aromas, not power. The curve is recorded and repeated batch after batch. That is why a box bought in March tastes like a box bought in November.

3. Resting

Coffee coming out of the roaster degasses: it releases CO₂ for several days. Encapsulating it straight away traps that gas and distorts the extraction. So we let the coffee rest before grinding. The wait is invisible in the finished product, but you can hear it in the cup.

4. Grinding

Grind fineness is specific to each intensity and is checked continuously. Too fine and the water passes too slowly, turning the extraction bitter; too coarse and it runs straight through, leaving the coffee thin and sour. The setting is verified throughout the run, not only at the start.

5. Dosing

Every capsule is weighed. Not estimated, not filled by volume: weighed. From 5.2 g for the Or to 6.0 g for the Noir, with a tolerance of a tenth of a gram. That consistency is what guarantees the third capsule in the box tastes like the first.

6. Sealing

The capsule is lidded under aluminium immediately after dosing. From that moment neither oxygen nor moisture gets in: the aroma is frozen exactly as it is until the machine pierces the lid. Every run then passes a seal test — a badly sealed capsule is a lost capsule, and we would rather lose it here than at your house.

What we do not do

We add no sugar. No synthetic aromas in the organic range. No preservatives. An espresso needs none of that — it needs a good bean, an honest roast and a clean seal. The rest is marketing.$x$
where slug = 'comment-naissent-nos-capsules';

update articles set
  title_en   = 'Why our capsules are pure food-grade aluminium',
  tag_en     = 'Quality',
  excerpt_en = $x$The capsule's material is not a packaging detail: it decides what your coffee is allowed to touch.$x$,
  body_en    = $x$People talk a great deal about the coffee inside the capsule. Far less about the capsule itself. That is a shame, because for the whole of the extraction your coffee is in direct contact with that material — under pressure, above 90 °C.

Our capsules are made of pure food-grade aluminium. That means three concrete things.

A complete barrier

Aluminium is impermeable to oxygen, moisture and light. Plastic is not, even multi-layered: it lets a little oxygen through, and ground coffee starts losing its aroma from its first breath of it. A sealed aluminium capsule freezes the aroma at the day it was sealed. That is the only reason an encapsulated coffee can compete with a freshly ground one.

No transfer of taste

Heated under pressure, a plastic can release compounds — and even when they are harmless, you can hear them in the cup. Food-grade aluminium is neutral: the only taste leaving the capsule is the coffee's. It is also why the big European houses adopted it.

Zero added chemicals

Our capsules are made with certified experts, in food-grade aluminium, with no added chemical treatment. We do not use that as a slogan: it is a production constraint, it costs more, and it is a choice we make line by line.

And recycling?

Aluminium is infinitely recyclable with no loss of quality — unlike plastic, which degrades with every cycle. Empty the capsule of its grounds and the body joins the metal stream. The grounds themselves make an excellent feed for your plants.

The summary fits in one sentence: the capsule must add nothing to the coffee and let it lose nothing. Pure food-grade aluminium is the only material that keeps both promises at once.$x$
where slug = 'aluminium-alimentaire-pur';

update articles set
  title_en   = '100 % organic, 0 % sugar: what it changes in the cup',
  tag_en     = 'Organic',
  excerpt_en = $x$We are the only producer in Algeria making a 100 % natural espresso capsule. Here is what that sentence actually commits us to.$x$,
  body_en    = $x$"Organic", on a bag of coffee, can mean a great deal — or almost nothing. So let us say precisely what it means here.

The bean

The organic Moriva range is made from natural beans, with no added sugar and no synthetic aroma. What you smell when you open the box comes from the coffee and from the roast, not from a bottle.

The capsule

The container is part of the promise. Our capsules are pure food-grade aluminium, with no added chemicals, made with certified experts. A natural coffee inside a container that releases something at 92 °C would not be a natural coffee.

The sugar

Zero. No added sugar, no sweetener. An espresso sweetened at the factory is an espresso whose bitterness can no longer be judged — and bitterness is precisely what roasting is meant to control. If you want it sweet, sweeten it yourself: it is your cup.

What it changes in the taste

Coffee without additives has a narrower, more honest signature. Flaws are not masked, which forces clean work upstream — hence our lot-by-lot selection. In the mouth the attack is sharper, the finish shorter and cleaner, and the aftertaste does not cling to the palate.

The only ones in Algeria

To our knowledge, we are today the only producer in Algeria making a 100 % natural espresso capsule: no sugar, pure food-grade aluminium. It is not a comfortable position — it demands stricter suppliers, more frequent checks and tighter margins. It is also the entire reason Moriva exists.

And the flavoured capsules?

Hazelnut, vanilla, caramel and chocolate form a separate range, made for indulgence. They share the same pure food-grade aluminium capsule and the same manufacturing standard, but the "100 % organic" claim is reserved for the espresso range — that is more honest, and it means you know exactly what you are buying.$x$
where slug = '100-pour-cent-bio-zero-sucre';

update articles set
  title_en   = 'Noir, Brun, Vert or Or: which intensity is yours?',
  tag_en     = 'Guide',
  excerpt_en = $x$Four colours, four balances between robusta and arabica. A short guide to finding yours first time.$x$,
  body_en    = $x$Intensity is not the amount of caffeine, and it is not quality either. It is the balance between robusta and arabica, the length of the roast and the dose. A high intensity gives a powerful coffee; a low one gives an aromatic coffee. Neither is "better" — they answer different cravings.

The Noir — maximum intensity

Robusta-led, the highest dose in the range, dark crema and a thick body. This is the waking-up coffee, the one you drink short and without thinking at six in the morning. If you find most espressos too light, start here.

The Brun — powerful, but round

One step down. The body is still there, cocoa comes forward, bitterness recedes. It is often the best compromise for someone who likes strong coffee but drinks it all day.

The Vert — the balance

Neither too strong nor too soft: arabica and robusta answer each other. This is the intensity that pleases the most people, the one you serve to a guest whose taste you do not know, and the one that best survives being lengthened with water.

The Or — flavour before strength

Arabica-led, the lowest intensity, the lightest dose. A floral cup, almost naturally sweet, with a fine acidity. It is our finest quality and, paradoxically, the least "strong": what we are after here is the aroma.

How to choose in one question

Do you drink your espresso to wake up, or to taste it? To wake up: Noir or Brun. To taste: Vert or Or. And if you are still hesitating, start with the Vert — it is the reference point from which you will know which way to go.$x$
where slug = 'quelle-intensite-choisir';

update articles set
  title_en   = 'From the workshop to your door: all 58 wilayas',
  tag_en     = 'Behind the scenes',
  excerpt_en = $x$Our vans, our lead times, and why you only pay once the box is in your hands.$x$,
  body_en    = $x$A well-made capsule that arrives crushed three weeks later is not a good capsule. Delivery is part of the product — we treat it as such.

Our own fleet

We deliver part of Algiers with our own vans, in Moriva's colours. It is not only a matter of image: when our driver delivers, our team is the one who answers, who takes back a damaged box on the spot, and who brings us back what the customer said. For all 58 wilayas we work with partner carriers, under the same packing instructions.

Cash on delivery

You pay nothing online. You pay when the box is in your hands, at home or at a pickup point. It is the norm in Algeria, and above all it is the only honest way to sell to someone who does not know us yet.

How an order works

You choose your capsules and leave your name, your phone number and your wilaya. Our team calls you back to confirm the address and the slot — that is also the moment when you can still change an intensity or add a box. Then the order goes out.

The packing

Boxes travel flat and wedged, in a carton that will not fold under the weight of another parcel. A capsule whose lid was pierced in transit has lost its freshness: the seal test we run in the workshop would mean nothing if the carton betrayed it afterwards.

A problem?

Call us. A damaged box is replaced. We would far rather redo a delivery than lose a customer who did not dare complain.$x$
where slug = 'de-l-atelier-a-votre-porte';

-- ------------------------------------------------------------- place_order
-- VERBATIM copy of 0008's function with ONE change, marked below: the
-- order_items insert now also snapshots name_en. Postgres cannot patch a
-- single line of a function body, so the whole thing is replaced — diff this
-- against 0008 before editing either.
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
  if v_language not in ('fr', 'ar', 'en') then
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

    -- CHANGED vs 0008: name_en is snapshotted alongside name_fr / name_ar.
    insert into order_items
      (order_id, product_id, name_fr, name_ar, name_en, price, quantity, color, size, image_url)
    values
      (v_order_id, v_product.id, v_product.name_fr, v_product.name_ar, v_product.name_en,
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

-- ------------------------------------------------------ get_order_by_number
-- Same treatment: the confirmation page reads its line names out of this
-- payload, so without name_en an English shopper sees French product names on
-- the one screen that confirms what they just bought.
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
      'name_en', name_en,
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
