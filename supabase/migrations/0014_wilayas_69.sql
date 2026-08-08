-- ============================================================================
-- Algeria's administrative map changed underneath this store.
--
-- Loi 26-06 (signed 4 April 2026) raised the country from 58 wilayas to 69,
-- promoting eleven existing districts to wilayas of their own and numbering
-- them 59–69. `delivery_prices` was seeded with the 58 from Loi 19-12, so
-- until this migration a customer in — say — Bou Saâda had no row to pick and
-- literally could not complete a checkout.
--
-- WHY THE PRICES ARE COPIED RATHER THAN DEFAULTED
--
-- Every one of these eleven was carved out of a wilaya the client has already
-- been shipping to and has already priced by hand. A new row at the table's
-- 600/400 default would silently undo that work: Aflou is the same lorry, the
-- same distance and the same partner carrier it was last month, when it was
-- billed as Laghouat. So each new wilaya inherits the CURRENT price of the
-- wilaya it was split from, including whether that wilaya is active — the
-- client's tuning survives the redistricting, and anything they want different
-- is one edit in Admin → Frais de livraison.
--
-- Idempotent: `on conflict (wilaya) do nothing`, so re-running it (or running
-- it against a database where someone already added a few by hand) is safe.
-- ============================================================================

insert into delivery_prices (wilaya, home_price, office_price, active)
select
  new_wilaya.name,
  -- the coalesces cover a database whose parent row was renamed or deleted:
  -- fall back to the column defaults rather than inserting nulls into a
  -- not-null column and failing the whole migration
  coalesce(parent.home_price, 600),
  coalesce(parent.office_price, 400),
  coalesce(parent.active, true)
from (values
  -- code, new wilaya, the wilaya it was split from
  (59, 'Aflou',                 'Laghouat'),
  (60, 'Barika',                'Batna'),
  (61, 'El Kantara',            'Biskra'),
  (62, 'Bir El Ater',           'Tébessa'),
  (63, 'El Aricha',             'Tlemcen'),
  (64, 'Ksar Chellala',         'Tiaret'),
  (65, 'Aïn Oussera',           'Djelfa'),
  (66, 'Messaad',               'Djelfa'),
  (67, 'Ksar El Boukhari',      'Médéa'),
  (68, 'Bou Saâda',             'M''Sila'),
  (69, 'El Abiodh Sidi Cheikh', 'El Bayadh')
) as new_wilaya(code, name, split_from)
left join delivery_prices parent on parent.wilaya = new_wilaya.split_from
on conflict (wilaya) do nothing;

-- ============================================================================
-- The published copy that counts to 58.
--
-- `src/data/slides.ts` and `src/data/journal.ts` carry the same sentences, but
-- those are only the FALLBACKS used before the tables are seeded — the live
-- store reads its slides and articles from the database, where migrations 0009
-- and 0012 wrote them. Fixing the source files alone would leave every
-- deployed site still promising 58 wilayas on the hero slider and in the
-- delivery article.
--
-- Targeted `replace` on the exact phrases rather than a rewrite of each row:
-- the client is free to have edited any of this copy from Admin → Contenu, and
-- a wholesale UPDATE would throw their words away to fix a number. Rows they
-- have reworded simply do not match, and are left alone.
-- ============================================================================

-- No coalesce on the *_en columns: `replace(null, …)` is already null in
-- Postgres, which is exactly what a store that has never been switched to
-- English should keep. Wrapping them in coalesce(…, '') would quietly turn
-- "no English translation" into "an English translation that is blank", and
-- pickLang treats those two very differently — one falls back to French, the
-- other renders an empty heading.
update media_slides set
  title_fr = replace(title_fr, '58 wilayas', '69 wilayas'),
  title_ar = replace(title_ar, '58 ولاية',   '69 ولاية'),
  title_en = replace(title_en, '58 wilayas', '69 wilayas')
where title_fr like '%58 wilayas%'
   or title_ar like '%58 ولاية%'
   or title_en like '%58 wilayas%';

update articles set
  title_fr   = replace(title_fr,   '58 wilayas', '69 wilayas'),
  title_ar   = replace(title_ar,   '58 ولاية',   '69 ولاية'),
  title_en   = replace(title_en,   '58 wilayas', '69 wilayas'),
  body_fr    = replace(body_fr,    '58 wilayas', '69 wilayas'),
  -- the Arabic body writes it as "الولايات الـ58", not as a bare number
  body_ar    = replace(replace(body_ar, '58 ولاية', '69 ولاية'), 'الـ58', 'الـ69'),
  body_en    = replace(body_en,    '58 wilayas', '69 wilayas'),
  excerpt_fr = replace(excerpt_fr, '58 wilayas', '69 wilayas'),
  excerpt_ar = replace(excerpt_ar, '58 ولاية',   '69 ولاية'),
  excerpt_en = replace(excerpt_en, '58 wilayas', '69 wilayas')
where slug = 'de-l-atelier-a-votre-porte';
