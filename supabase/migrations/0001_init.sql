-- Norlyn Coffee / Moriva — core schema (DZ COD store pattern)

create extension if not exists "pgcrypto";

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_fr text not null,
  name_ar text not null,
  description_fr text,
  description_ar text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ products
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_fr text not null,
  name_ar text not null,
  description_fr text,
  description_ar text,
  details_fr text[] not null default '{}',
  details_ar text[] not null default '{}',
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  category_id uuid references categories(id) on delete set null,
  stock int not null default 0 check (stock >= 0),
  style_code text,
  intensity int check (intensity between 0 and 100),
  dosage text,
  accent_color text,
  colors jsonb not null default '[]',
  sizes jsonb not null default '[]',
  video_url text,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('active','draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- ------------------------------------------------------------ product_images
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0
);

create index product_images_product_idx on product_images (product_id, sort_order);

-- -------------------------------------------------------------------- orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  wilaya text not null,
  city text not null,
  -- address/notes stay nullable so removing them from the form is form-only
  address text,
  notes text,
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null,
  total numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  language text not null default 'fr',
  delivery_type text not null default 'home' check (delivery_type in ('home','office')),
  created_at timestamptz not null default now()
);

create index orders_phone_created_idx on orders (customer_phone, created_at desc);
create index orders_status_created_idx on orders (status, created_at desc);

-- --------------------------------------------------------------- order_items
-- prices/names snapshotted at purchase time, never re-joined live
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name_fr text not null,
  name_ar text not null,
  price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  color text,
  size text,
  image_url text
);

create index order_items_order_idx on order_items (order_id);

-- ------------------------------------------------------------ store_settings
-- free_ship_threshold NULL = no free-shipping offer (an offer the client opts
-- into — never a scaffold default).
create table store_settings (
  id int primary key default 1 check (id = 1),
  shipping_fee numeric(10,2) not null default 500,
  free_ship_threshold numeric(10,2) default null
);

insert into store_settings (id) values (1);

-- ----------------------------------------------------------- delivery_prices
create table delivery_prices (
  id uuid primary key default gen_random_uuid(),
  wilaya text not null unique,
  home_price numeric(10,2) not null default 600,
  office_price numeric(10,2) not null default 400,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger delivery_prices_updated_at
  before update on delivery_prices
  for each row execute function update_updated_at();

insert into delivery_prices (wilaya) values
  ('Adrar'), ('Chlef'), ('Laghouat'), ('Oum El Bouaghi'), ('Batna'),
  ('Béjaïa'), ('Biskra'), ('Béchar'), ('Blida'), ('Bouira'),
  ('Tamanrasset'), ('Tébessa'), ('Tlemcen'), ('Tiaret'), ('Tizi Ouzou'),
  ('Alger'), ('Djelfa'), ('Jijel'), ('Sétif'), ('Saïda'),
  ('Skikda'), ('Sidi Bel Abbès'), ('Annaba'), ('Guelma'), ('Constantine'),
  ('Médéa'), ('Mostaganem'), ('M''Sila'), ('Mascara'), ('Ouargla'),
  ('Oran'), ('El Bayadh'), ('Illizi'), ('Bordj Bou Arreridj'), ('Boumerdès'),
  ('El Tarf'), ('Tindouf'), ('Tissemsilt'), ('El Oued'), ('Khenchela'),
  ('Souk Ahras'), ('Tipaza'), ('Mila'), ('Aïn Defla'), ('Naâma'),
  ('Aïn Témouchent'), ('Ghardaïa'), ('Relizane'), ('Timimoun'),
  ('Bordj Badji Mokhtar'), ('Ouled Djellal'), ('Béni Abbès'), ('In Salah'),
  ('In Guezzam'), ('Touggourt'), ('Djanet'), ('El M''Ghair'), ('El Meniaa');

-- ------------------------------------------------------------ client_reviews
create table client_reviews (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  stars int not null check (stars between 1 and 5),
  review_text text not null,
  image_url text,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ seed data
insert into categories (slug, name_fr, name_ar, description_fr, description_ar, sort_order)
values (
  'capsules-espresso',
  'Capsules Espresso',
  'كبسولات إسبريسو',
  'Capsules espresso Moriva, compatibles Nespresso.',
  'كبسولات إسبريسو موريفا متوافقة مع نسبريسو.',
  0
);

insert into products
  (slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
   price, category_id, stock, intensity, dosage, accent_color, featured, status)
select * from (values
  (
    'moriva-espresso-intenso',
    'Moriva Espresso Intenso', 'موريفا إسبريسو إنتنسو',
    'Puissant et corsé, notes de cacao amer et de bois torréfié.',
    'قوي وغني، بنكهات الكاكاو المر والخشب المحمص.',
    array['Intensité 9/12', 'Dosage 5,6 g par capsule', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['شدة 9/12', 'جرعة 5.6 غ لكل كبسولة', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    850::numeric, (select id from categories where slug = 'capsules-espresso'), 100,
    75, '5,6 g', '#7B3A2A', true, 'active'
  ),
  (
    'moriva-ristretto-noir',
    'Moriva Ristretto Noir', 'موريفا ريستريتو نوار',
    'Ultra-concentré, caractère affirmé et finale longue.',
    'مركّز جداً، بطابع قوي ونهاية طويلة.',
    array['Intensité 12/12', 'Dosage 6,0 g par capsule', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['شدة 12/12', 'جرعة 6.0 غ لكل كبسولة', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    950::numeric, (select id from categories where slug = 'capsules-espresso'), 100,
    100, '6,0 g', '#1A1A1A', true, 'active'
  ),
  (
    'moriva-lungo-dore',
    'Moriva Lungo Doré', 'موريفا لونغو دوريه',
    'Doux et équilibré, arômes floraux et miel d''acacia.',
    'ناعم ومتوازن، بروائح زهرية وعسل الأكاسيا.',
    array['Intensité 6/12', 'Dosage 5,2 g par capsule', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['شدة 6/12', 'جرعة 5.2 غ لكل كبسولة', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    800::numeric, (select id from categories where slug = 'capsules-espresso'), 100,
    50, '5,2 g', '#C9A84C', true, 'active'
  ),
  (
    'moriva-decaf-verde',
    'Moriva Decaf Verde', 'موريفا ديكاف فيردي',
    'Sans caféine, légèreté garantie et saveur préservée.',
    'خالٍ من الكافيين، خفيف مع الحفاظ على النكهة.',
    array['Intensité 4/12', 'Dosage 5,4 g par capsule', 'Sans caféine', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['شدة 4/12', 'جرعة 5.4 غ لكل كبسولة', 'خالٍ من الكافيين', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    880::numeric, (select id from categories where slug = 'capsules-espresso'), 100,
    33, '5,4 g', '#2D6A4F', true, 'active'
  )
) as seed;
