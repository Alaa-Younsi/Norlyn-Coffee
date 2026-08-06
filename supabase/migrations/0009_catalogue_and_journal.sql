-- The real Norlyn catalogue, the client's photography, and the launch set of
-- Journal articles.
--
-- 0001 seeded four invented espresso variants as scaffolding. The actual Moriva
-- line is two families of four: the 100 % bio espressos graded by intensity
-- (Noir → Or) and the flavoured capsules (noisette, vanille, caramel, chocolat).
-- This migration replaces the scaffolding with the real thing and points every
-- picture at the optimized WebP shipped in /public/images — no Storage upload
-- needed to launch, and nothing here stops the client from replacing a photo
-- from the admin afterwards.
--
-- Everything inserted here is an ordinary row: products, images, slides and
-- articles all stay editable in the admin.
--
-- Kept in sync with src/data/fallback.ts and src/data/journal.ts (the
-- no-Supabase mirrors) and with scripts/optimize-images.mjs (the paths).

-- ------------------------------------------------------------- categories
-- Updated in place rather than re-created: products already point at this id.
update categories set
  slug            = 'espresso-bio',
  name_fr         = 'Espresso 100 % bio',
  name_ar         = 'إسبريسو 100٪ بيو',
  description_fr  = 'Quatre intensités, du plus corsé au plus aromatique. Sans sucre, sans additifs, en aluminium alimentaire pur.',
  description_ar  = 'أربع درجات قوة، من الأقوى إلى الأكثر عطراً. بدون سكر، بدون إضافات، بألمنيوم غذائي خالص.',
  image_url       = '/images/packs/black-lg.webp',
  sort_order      = 0
where slug = 'capsules-espresso';

insert into categories (slug, name_fr, name_ar, description_fr, description_ar, image_url, sort_order)
values (
  'capsules-aromatisees',
  'Capsules aromatisées',
  'كبسولات بالنكهات',
  'Le même espresso, quatre arômes gourmands : noisette, vanille, caramel et chocolat.',
  'نفس الإسبريسو بأربع نكهات: البندق، الفانيليا، الكراميل والشوكولاتة.',
  '/images/packs/hazelnut-lg.webp',
  1
)
on conflict (slug) do nothing;

-- --------------------------------------------------------------- products
-- The 0001 scaffolding goes. order_items.product_id is ON DELETE SET NULL and
-- every order line snapshots its own name/price/image, so past orders keep
-- reading correctly even after the product they referenced is gone.
delete from products
where slug in (
  'moriva-espresso-intenso',
  'moriva-ristretto-noir',
  'moriva-lungo-dore',
  'moriva-decaf-verde'
);

insert into products
  (slug, name_fr, name_ar, description_fr, description_ar, details_fr, details_ar,
   price, category_id, stock, intensity, dosage, accent_color, featured, status)
select * from (values
  (
    'moriva-noir',
    'Moriva Noir', 'موريفا الأسود',
    'Notre intensité maximale. Robusta dominant, corps épais, crema sombre — le café de ceux qui aiment être réveillés.',
    'أقصى درجات القوة لدينا. روبوستا غالبة، قوام كثيف وكريما داكنة — قهوة من يحبّون الاستيقاظ فعلاً.',
    array['100 % bio — grains naturels, 0 % sucre', 'Capsule en aluminium alimentaire pur, 0 % produit chimique', 'Fabriquée en Algérie par des experts certifiés', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['100٪ بيو — حبوب طبيعية، 0٪ سكر', 'كبسولة من ألمنيوم غذائي خالص، 0٪ مواد كيميائية', 'مصنوعة في الجزائر على يد خبراء معتمدين', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    850::numeric, (select id from categories where slug = 'espresso-bio'), 100,
    100, '6,0 g', '#2A211C', true, 'active'
  ),
  (
    'moriva-brun',
    'Moriva Brun', 'موريفا البني',
    'Un cran en dessous du Noir : rond, chocolaté, long en bouche. L''intensité sans l''amertume.',
    'درجة أقل من الأسود: ناعم، بنكهة الكاكاو ونهاية طويلة. قوة بلا مرارة.',
    array['100 % bio — grains naturels, 0 % sucre', 'Capsule en aluminium alimentaire pur, 0 % produit chimique', 'Fabriquée en Algérie par des experts certifiés', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['100٪ بيو — حبوب طبيعية، 0٪ سكر', 'كبسولة من ألمنيوم غذائي خالص، 0٪ مواد كيميائية', 'مصنوعة في الجزائر على يد خبراء معتمدين', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    820::numeric, (select id from categories where slug = 'espresso-bio'), 100,
    85, '5,6 g', '#7A4A22', true, 'active'
  ),
  (
    'moriva-vert',
    'Moriva Vert', 'موريفا الأخضر',
    'L''équilibre exact entre force et douceur. Arabica et robusta en harmonie — l''espresso de tous les jours.',
    'التوازن التام بين القوة والنعومة. أرابيكا وروبوستا في انسجام — إسبريسو كل يوم.',
    array['100 % bio — grains naturels, 0 % sucre', 'Capsule en aluminium alimentaire pur, 0 % produit chimique', 'Fabriquée en Algérie par des experts certifiés', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['100٪ بيو — حبوب طبيعية، 0٪ سكر', 'كبسولة من ألمنيوم غذائي خالص، 0٪ مواد كيميائية', 'مصنوعة في الجزائر على يد خبراء معتمدين', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    820::numeric, (select id from categories where slug = 'espresso-bio'), 100,
    62, '5,4 g', '#0E7A5F', true, 'active'
  ),
  (
    'moriva-or',
    'Moriva Or', 'موريفا الذهبي',
    'Notre plus haute qualité. Arabica dominant, intensité basse, aromatique et florale — ici, c''est le goût qui commande.',
    'أرقى ما لدينا. أرابيكا غالبة، قوة منخفضة، عطرية وزهرية — هنا الطعم هو سيّد الموقف.',
    array['100 % bio — grains naturels, 0 % sucre', 'Capsule en aluminium alimentaire pur, 0 % produit chimique', 'Fabriquée en Algérie par des experts certifiés', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['100٪ بيو — حبوب طبيعية، 0٪ سكر', 'كبسولة من ألمنيوم غذائي خالص، 0٪ مواد كيميائية', 'مصنوعة في الجزائر على يد خبراء معتمدين', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    950::numeric, (select id from categories where slug = 'espresso-bio'), 100,
    38, '5,2 g', '#B8891F', true, 'active'
  ),
  (
    'moriva-noisette',
    'Moriva Noisette', 'موريفا بالبندق',
    'L''espresso Moriva rehaussé d''un arôme de noisette grillée, gourmand sans être sucré.',
    'إسبريسو موريفا بلمسة من البندق المحمّص، شهيّ دون أن يكون حلواً.',
    array['Espresso aromatisé, 0 % sucre ajouté', 'Capsule en aluminium alimentaire pur, 0 % produit chimique', 'Fabriquée en Algérie par des experts certifiés', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['إسبريسو بنكهة، 0٪ سكر مضاف', 'كبسولة من ألمنيوم غذائي خالص، 0٪ مواد كيميائية', 'مصنوعة في الجزائر على يد خبراء معتمدين', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    900::numeric, (select id from categories where slug = 'capsules-aromatisees'), 100,
    54, '5,5 g', '#A62F51', false, 'active'
  ),
  (
    'moriva-vanille',
    'Moriva Vanille', 'موريفا بالفانيليا',
    'Un espresso doux et crémeux, parfumé à la vanille — le plus rond de la gamme.',
    'إسبريسو ناعم وكريمي بعطر الفانيليا — الأنعم في التشكيلة.',
    array['Espresso aromatisé, 0 % sucre ajouté', 'Capsule en aluminium alimentaire pur, 0 % produit chimique', 'Fabriquée en Algérie par des experts certifiés', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['إسبريسو بنكهة، 0٪ سكر مضاف', 'كبسولة من ألمنيوم غذائي خالص، 0٪ مواد كيميائية', 'مصنوعة في الجزائر على يد خبراء معتمدين', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    900::numeric, (select id from categories where slug = 'capsules-aromatisees'), 100,
    46, '5,5 g', '#5E75A6', false, 'active'
  ),
  (
    'moriva-caramel',
    'Moriva Caramel', 'موريفا بالكراميل',
    'Caramel beurré et café serré : la finale sucrée-salée qui accompagne le mieux un dessert.',
    'كراميل بالزبدة وقهوة مركّزة: نهاية حلوة تليق بالحلويات.',
    array['Espresso aromatisé, 0 % sucre ajouté', 'Capsule en aluminium alimentaire pur, 0 % produit chimique', 'Fabriquée en Algérie par des experts certifiés', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['إسبريسو بنكهة، 0٪ سكر مضاف', 'كبسولة من ألمنيوم غذائي خالص، 0٪ مواد كيميائية', 'مصنوعة في الجزائر على يد خبراء معتمدين', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    900::numeric, (select id from categories where slug = 'capsules-aromatisees'), 100,
    46, '5,5 g', '#A8557E', false, 'active'
  ),
  (
    'moriva-chocolat',
    'Moriva Chocolat', 'موريفا بالشوكولاتة',
    'Cacao intense et café corsé — le plus puissant de nos arômes, presque un moka.',
    'كاكاو غنيّ وقهوة قوية — أقوى نكهاتنا، أقرب إلى الموكا.',
    array['Espresso aromatisé, 0 % sucre ajouté', 'Capsule en aluminium alimentaire pur, 0 % produit chimique', 'Fabriquée en Algérie par des experts certifiés', 'Boîte de 10 capsules', 'Compatible Nespresso®'],
    array['إسبريسو بنكهة، 0٪ سكر مضاف', 'كبسولة من ألمنيوم غذائي خالص، 0٪ مواد كيميائية', 'مصنوعة في الجزائر على يد خبراء معتمدين', 'علبة من 10 كبسولات', 'متوافقة مع نسبريسو®'],
    900::numeric, (select id from categories where slug = 'capsules-aromatisees'), 100,
    62, '5,5 g', '#8E4147', false, 'active'
  )
) as seed
on conflict (slug) do nothing;

-- --------------------------------------------------------- product images
-- Two per product: the cut-out capsule (the card / hero shot) and the sleeve.
insert into product_images (product_id, url, alt, sort_order)
select p.id, i.url, i.alt, i.sort_order
from (values
  ('moriva-noir',      '/images/capsules/black-lg.webp',        'Moriva Noir',      0),
  ('moriva-noir',      '/images/packs/black-lg.webp',           'Moriva Noir — boîte de 10 capsules', 1),
  ('moriva-brun',      '/images/capsules/brown-lg.webp',        'Moriva Brun',      0),
  ('moriva-brun',      '/images/packs/brown-lg.webp',           'Moriva Brun — boîte de 10 capsules', 1),
  ('moriva-vert',      '/images/capsules/green-lg.webp',        'Moriva Vert',      0),
  ('moriva-vert',      '/images/packs/green-lg.webp',           'Moriva Vert — boîte de 10 capsules', 1),
  ('moriva-or',        '/images/capsules/gold-lg.webp',         'Moriva Or',        0),
  ('moriva-or',        '/images/packs/gold-lg.webp',            'Moriva Or — boîte de 10 capsules', 1),
  ('moriva-noisette',  '/images/capsules/hazelnut-lg.webp',     'Moriva Noisette',  0),
  ('moriva-noisette',  '/images/packs/hazelnut-lg.webp',        'Moriva Noisette — boîte de 10 capsules', 1),
  ('moriva-noisette',  '/images/packs/hazelnut-duo-lg.webp',    'Moriva Noisette — capsule et boîte', 2),
  ('moriva-vanille',   '/images/capsules/vanilla-lg.webp',      'Moriva Vanille',   0),
  ('moriva-vanille',   '/images/packs/vanilla-lg.webp',         'Moriva Vanille — boîte de 10 capsules', 1),
  ('moriva-vanille',   '/images/packs/vanilla-duo-lg.webp',     'Moriva Vanille — capsule et boîte', 2),
  ('moriva-caramel',   '/images/capsules/caramel-lg.webp',      'Moriva Caramel',   0),
  ('moriva-caramel',   '/images/packs/caramel-lg.webp',         'Moriva Caramel — boîte de 10 capsules', 1),
  ('moriva-caramel',   '/images/packs/caramel-duo-lg.webp',     'Moriva Caramel — capsule et boîte', 2),
  ('moriva-chocolat',  '/images/capsules/chocolate-lg.webp',    'Moriva Chocolat',  0),
  ('moriva-chocolat',  '/images/packs/chocolate-lg.webp',       'Moriva Chocolat — boîte de 10 capsules', 1),
  ('moriva-chocolat',  '/images/packs/chocolate-duo-lg.webp',   'Moriva Chocolat — capsule et boîte', 2)
) as i(slug, url, alt, sort_order)
join products p on p.slug = i.slug
where not exists (
  select 1 from product_images existing
  where existing.product_id = p.id and existing.url = i.url
);

-- --------------------------------------------------------- named image slots
-- `do nothing` on purpose: a photo the client has already uploaded outranks
-- the seed, and re-running this must never overwrite their choice.
insert into site_images (slot, url, alt_fr, alt_ar) values
  ('home.gallery.1', '/images/life/espresso-glass-lg.webp',
   'Un espresso Moriva servi en verre', 'إسبريسو موريفا في كأس زجاجي'),
  ('home.gallery.2', '/images/life/range-capsules-lg.webp',
   'La gamme Moriva et ses capsules', 'تشكيلة موريفا وكبسولاتها'),
  ('home.gallery.3', '/images/life/aluminium-macro-lg.webp',
   'Boîte Moriva — capsules aluminium', 'علبة موريفا — كبسولات ألمنيوم'),

  ('about.hero', '/images/life/range-fan-lg.webp',
   'Les quatre intensités Moriva', 'درجات القوة الأربع من موريفا'),
  ('about.origin', '/images/life/beans-capsules-lg.webp',
   'Grains de café et capsules Moriva', 'حبوب القهوة وكبسولات موريفا'),
  ('about.roastery', '/images/life/pack-brown-table-lg.webp',
   'Boîte Moriva Brun', 'علبة موريفا البني'),
  ('about.packaging', '/images/life/range-table-lg.webp',
   'La gamme complète sur l''établi', 'التشكيلة الكاملة على الطاولة'),
  ('about.sealing', '/images/life/pack-green-table-lg.webp',
   'Boîte Moriva Vert scellée', 'علبة موريفا الأخضر مختومة'),
  ('about.team', '/images/fleet/vans-yard-lg.webp',
   'Les camionnettes Moriva avant la tournée', 'شاحنات موريفا قبل الجولة'),

  ('blog.hero', '/images/life/retail-facing-lg.webp',
   'Moriva en rayon', 'موريفا في رفوف المتاجر'),

  ('contact.side', '/images/fleet/van-side-lg.webp',
   'Camionnette de livraison Moriva', 'شاحنة توصيل موريفا')
on conflict (slot) do nothing;

-- ------------------------------------------------------------- hero slider
-- Only seeded when the slider is still empty, so a client who has already
-- curated their slides keeps them.
insert into media_slides (kind, url, title_fr, title_ar, subtitle_fr, subtitle_ar, link_url, placement, sort_order, active)
select * from (values
  ('image', '/images/life/range-fan-lg.webp',
   'Quatre intensités', 'أربع درجات قوة',
   '100 % bio, 0 % sucre', '100٪ بيو، 0٪ سكر',
   '/shop', 'hero', 0, true),
  ('image', '/images/life/espresso-glass-lg.webp',
   'Une crema dense et dorée', 'كريما ذهبية كثيفة',
   'Le résultat d''un dosage pesé au dixième de gramme', 'نتيجة جرعة موزونة بعُشر الغرام',
   '/journal/comment-naissent-nos-capsules', 'hero', 1, true),
  ('image', '/images/packs/hazelnut-duo-lg.webp',
   'Les capsules aromatisées', 'الكبسولات بالنكهات',
   'Noisette, vanille, caramel, chocolat', 'بندق، فانيليا، كراميل، شوكولاتة',
   '/shop', 'hero', 2, true),
  ('image', '/images/fleet/vans-loading-lg.webp',
   'Livrées dans les 58 wilayas', 'توصيل إلى 58 ولاية',
   'Paiement à la livraison', 'الدفع عند الاستلام',
   '/journal/de-l-atelier-a-votre-porte', 'hero', 3, true)
) as seed
where not exists (select 1 from media_slides where placement = 'hero');

-- ---------------------------------------------------------------- articles
-- Dollar-quoted bodies: the prose is full of apostrophes and blank lines, and
-- a blank line is the editor's paragraph break (see src/pages/Article.tsx).
insert into articles
  (slug, title_fr, title_ar, excerpt_fr, excerpt_ar, body_fr, body_ar,
   cover_url, tag_fr, tag_ar, author, read_minutes, featured, status, published_at)
values
(
  'comment-naissent-nos-capsules',
  'Comment naît une capsule Moriva',
  'كيف تُولد كبسولة موريفا',
  $x$Du grain vert au opercule scellé : les six étapes que traverse chaque capsule avant d'arriver dans votre machine.$x$,
  $x$من الحبة الخضراء إلى الغطاء المُحكم: ست مراحل تمرّ بها كل كبسولة قبل أن تصل إلى آلتك.$x$,
  $x$Une capsule d'espresso a l'air simple. Six grammes de café, un peu d'aluminium, un opercule. En réalité, entre le grain vert et la capsule que vous glissez dans votre machine, il y a une chaîne complète — et c'est dans cette chaîne que se joue la différence entre un café correct et un café qu'on a envie de refaire le lendemain.

Voici, étape par étape, ce qui se passe dans notre atelier.

1. La sélection du lot

Tout commence par le grain vert. Nous achetons par lot, jamais en vrac indifférencié, et nous goûtons avant d'acheter : un échantillon est torréfié, moulu et extrait dans les conditions exactes qui seront celles de la capsule finale. Si la tasse ne tient pas ses promesses, le lot est refusé. C'est la seule étape où l'on peut encore dire non sans que cela coûte cher — après, il est trop tard.

2. La torréfaction

Chaque profil Moriva a sa propre courbe de chauffe. Le Noir, dominé par le robusta, monte plus haut et plus longtemps pour développer un corps épais et une crema sombre. L'Or, à dominante arabica, s'arrête plus tôt : on cherche les arômes floraux, pas la puissance. La courbe est enregistrée, la même à chaque fournée. C'est ce qui fait qu'une boîte achetée en mars a le même goût qu'une boîte achetée en novembre.

3. Le repos

Un café qui sort du torréfacteur dégaze : il libère du CO₂ pendant plusieurs jours. Encapsuler immédiatement, c'est emprisonner ce gaz et déformer l'extraction. Nous laissons donc le café reposer avant de le moudre. Cette attente ne se voit pas dans le produit fini, mais elle s'entend dans la tasse.

4. La mouture

La finesse de mouture est propre à chaque intensité et se contrôle en continu. Trop fine, l'eau passe trop lentement et l'extraction devient amère ; trop grossière, elle traverse sans rien prendre et le café est acide et court. Le réglage est vérifié tout au long de la production, pas seulement au démarrage.

5. Le dosage

Chaque capsule est pesée. Pas estimée, pas remplie au volume : pesée. De 5,2 g pour l'Or à 6,0 g pour le Noir, avec une tolérance au dixième de gramme. C'est cette régularité qui garantit que la troisième capsule de la boîte a le même goût que la première.

6. Le scellage

La capsule est operculée sous aluminium immédiatement après le dosage. À partir de cet instant, ni oxygène ni humidité n'entrent : l'arôme est figé tel quel jusqu'à ce que la machine perce l'opercule. Chaque série passe ensuite un contrôle d'étanchéité — une capsule mal scellée est une capsule perdue, et nous préférons la perdre chez nous que chez vous.

Ce qu'on ne fait pas

Nous n'ajoutons pas de sucre. Pas d'arômes de synthèse dans la gamme bio. Pas de conservateurs. Un espresso n'a besoin de rien de tout cela — il a besoin d'un bon grain, d'une chauffe juste et d'un scellage propre. Le reste, c'est du marketing.$x$,
  $x$تبدو كبسولة الإسبريسو بسيطة: ستة غرامات من القهوة، قليل من الألمنيوم، وغطاء. لكن بين الحبة الخضراء والكبسولة التي تضعها في آلتك سلسلة كاملة من العمل — وفي هذه السلسلة يكمن الفرق بين قهوة مقبولة وقهوة تشتهي تكرارها في اليوم التالي.

إليك، مرحلة بمرحلة، ما يحدث في ورشتنا.

1. اختيار الدفعة

كل شيء يبدأ من الحبة الخضراء. نشتري بالدفعة، لا بالجملة العشوائية، ونتذوّق قبل الشراء: تُحمّص عيّنة وتُطحن وتُستخلص في الظروف نفسها التي ستكون عليها الكبسولة النهائية. إن لم يقنعنا الفنجان، تُرفض الدفعة. هذه هي المرحلة الوحيدة التي يمكن أن نقول فيها «لا» دون تكلفة كبيرة — بعدها يفوت الأوان.

2. التحميص

لكل نوع من موريفا منحنى حرارة خاص به. الأسود، بغلبة الروبوستا، يرتفع أعلى وأطول ليمنح قواماً كثيفاً وكريما داكنة. الذهبي، بغلبة الأرابيكا، يتوقّف مبكراً: نبحث عن الروائح الزهرية لا عن القوة. المنحنى مسجّل ويتكرّر في كل دفعة، ولهذا فإن علبة اشتُريت في مارس تذوق كعلبة اشتُريت في نوفمبر.

3. الراحة

القهوة الخارجة من المحمّصة تُطلق غاز ثاني أكسيد الكربون لعدة أيام. تعليبها فوراً يعني حبس هذا الغاز وإفساد الاستخلاص. لذلك نترك القهوة ترتاح قبل الطحن. هذه المدة لا تُرى في المنتج النهائي، لكنها تُذاق في الفنجان.

4. الطحن

نعومة الطحن خاصة بكل درجة قوة وتُراقب باستمرار. إن كانت ناعمة أكثر من اللازم مرّ الماء ببطء وصارت القهوة مُرّة؛ وإن كانت خشنة عبر الماء دون أن يأخذ شيئاً فتصبح حامضة وقصيرة. يُراجَع الضبط طوال الإنتاج، لا عند البداية فقط.

5. الجرعة

كل كبسولة تُوزن. لا تُقدّر ولا تُملأ بالحجم: تُوزن. من 5.2 غ للذهبي إلى 6.0 غ للأسود، بهامش عُشر الغرام. هذا الانضباط هو ما يضمن أن الكبسولة الثالثة في العلبة تذوق كالأولى.

6. الختم

تُغلق الكبسولة بغطاء ألمنيوم مباشرة بعد التعبئة. من تلك اللحظة لا يدخل أكسجين ولا رطوبة: تتجمّد النكهة كما هي إلى أن تثقب الآلة الغطاء. ثم تخضع كل دفعة لاختبار إحكام — الكبسولة سيئة الختم كبسولة خاسرة، ونحن نفضّل خسارتها عندنا لا عندك.

ما لا نفعله

لا نضيف سكراً. ولا نكهات صناعية في التشكيلة البيو. ولا مواد حافظة. الإسبريسو لا يحتاج شيئاً من هذا — يحتاج حبة جيدة وتحميصاً صحيحاً وختماً نظيفاً. والباقي تسويق.$x$,
  '/images/life/range-capsules-lg.webp',
  'Fabrication', 'التصنيع', 'Norlyn Coffee', 6, true, 'published', '2026-07-18T09:00:00Z'
),
(
  'aluminium-alimentaire-pur',
  'Pourquoi nos capsules sont en aluminium alimentaire pur',
  'لماذا كبسولاتنا من ألمنيوم غذائي خالص',
  $x$Le matériau de la capsule n'est pas un détail d'emballage : c'est lui qui décide de ce que votre café a le droit de toucher.$x$,
  $x$مادة الكبسولة ليست تفصيلاً في التغليف: هي التي تُحدّد ما الذي يُسمح لقهوتك بملامسته.$x$,
  $x$On parle beaucoup du café à l'intérieur de la capsule. Beaucoup moins de la capsule elle-même. C'est dommage, parce que pendant toute la durée de l'extraction, votre café est en contact direct avec ce matériau — sous pression, à plus de 90 °C.

Nos capsules sont en aluminium alimentaire pur. Cela veut dire trois choses concrètes.

Une barrière totale

L'aluminium est étanche à l'oxygène, à l'humidité et à la lumière. Ce n'est pas le cas du plastique, même multicouche : il laisse passer un peu d'oxygène, et l'arôme d'un café moulu commence à se dégrader dès qu'il en respire. Une capsule aluminium scellée fige l'arôme au jour du scellage. C'est la seule raison pour laquelle un café encapsulé peut rivaliser avec un café fraîchement moulu.

Aucun transfert de goût

Chauffé sous pression, un plastique peut relâcher des composés — et même quand ils sont sans danger, ils s'entendent dans la tasse. L'aluminium de qualité alimentaire, lui, est neutre : le seul goût qui sort de la capsule est celui du café. C'est aussi pour cela que les grandes maisons européennes l'ont adopté.

Zéro produit chimique ajouté

Nos capsules sont fabriquées avec des experts certifiés, dans un aluminium de qualité alimentaire, sans traitement chimique ajouté. Nous ne nous en servons pas comme d'un slogan : c'est une contrainte de production, elle coûte plus cher, et c'est un choix que nous assumons ligne par ligne.

Et le recyclage ?

L'aluminium est recyclable à l'infini, sans perte de qualité — contrairement au plastique, qui se dégrade à chaque cycle. Videz la capsule de son marc, et le corps rejoint la filière métal. Le marc, lui, fait un excellent amendement pour vos plantes.

Le résumé tient en une phrase : la capsule ne doit rien ajouter au café, et ne rien lui laisser perdre. L'aluminium alimentaire pur est le seul matériau qui tient les deux promesses en même temps.$x$,
  $x$يكثر الحديث عن القهوة داخل الكبسولة، ويقلّ عن الكبسولة نفسها. وهذا مؤسف، لأن قهوتك طوال مدة الاستخلاص تلامس هذه المادة مباشرة — تحت ضغط، وبحرارة تتجاوز 90 درجة.

كبسولاتنا من ألمنيوم غذائي خالص. وهذا يعني ثلاثة أمور ملموسة.

حاجز كامل

الألمنيوم لا ينفذ منه الأكسجين ولا الرطوبة ولا الضوء. البلاستيك، حتى متعدّد الطبقات، ليس كذلك: يسمح بمرور قليل من الأكسجين، ونكهة القهوة المطحونة تبدأ بالتلف من أول نفس. الكبسولة المعدنية المختومة تُجمّد النكهة عند يوم الختم. وهذا وحده سبب قدرة قهوة معلّبة على منافسة قهوة طازجة الطحن.

لا انتقال للطعم

البلاستيك المُسخّن تحت الضغط قد يُطلق مركّبات — وحتى حين تكون آمنة، فإنها تُسمع في الفنجان. أما الألمنيوم الغذائي فمحايد: الطعم الوحيد الخارج من الكبسولة هو طعم القهوة. ولهذا اعتمدته كبريات الدور الأوروبية.

صفر مواد كيميائية مضافة

تُصنع كبسولاتنا مع خبراء معتمدين، من ألمنيوم بجودة غذائية، دون معالجة كيميائية مضافة. لا نستعمل ذلك شعاراً: هو قيد إنتاجي، يكلّف أكثر، ونتحمّله بكامل إرادتنا.

وماذا عن إعادة التدوير؟

الألمنيوم قابل لإعادة التدوير إلى ما لا نهاية دون فقدان الجودة — بخلاف البلاستيك الذي يتدهور مع كل دورة. أفرغ الكبسولة من التفل، ويذهب جسمها إلى مسار المعادن. أما التفل فسماد ممتاز لنباتاتك.

الخلاصة في جملة: على الكبسولة ألّا تضيف شيئاً إلى القهوة وألّا تُفقدها شيئاً. والألمنيوم الغذائي الخالص هو المادة الوحيدة التي تفي بالوعدين معاً.$x$,
  '/images/life/aluminium-macro-lg.webp',
  'Qualité', 'الجودة', 'Norlyn Coffee', 5, false, 'published', '2026-06-24T09:00:00Z'
),
(
  '100-pour-cent-bio-zero-sucre',
  '100 % bio, 0 % sucre : ce que ça change dans la tasse',
  '100٪ بيو و0٪ سكر: ما الذي يتغيّر في الفنجان',
  $x$Nous sommes les seuls en Algérie à produire une capsule espresso 100 % naturelle. Voici ce que cette phrase engage vraiment.$x$,
  $x$نحن الوحيدون في الجزائر ننتج كبسولة إسبريسو طبيعية 100٪. وإليك ما تلتزم به هذه الجملة فعلاً.$x$,
  $x$« Bio », sur un paquet de café, peut vouloir dire beaucoup de choses — ou presque rien. Alors disons précisément ce que cela veut dire chez nous.

Le grain

La gamme bio Moriva est produite à partir de grains naturels, sans sucre ajouté et sans arôme de synthèse. Ce que vous sentez en ouvrant la boîte vient du café et de la torréfaction, pas d'un flacon.

La capsule

Le contenant fait partie de la promesse. Nos capsules sont en aluminium alimentaire pur, sans produit chimique ajouté, fabriquées avec des experts certifiés. Un café naturel dans un contenant qui relargue quelque chose à 92 °C ne serait pas un café naturel.

Le sucre

Zéro. Pas de sucre ajouté, pas d'édulcorant. Un espresso sucré à la production est un espresso dont on ne peut plus juger l'amertume — et l'amertume est précisément ce que la torréfaction est censée maîtriser. Si vous voulez sucrer, sucrez vous-même : c'est votre tasse.

Ce que ça change au goût

Un café sans additif a une signature plus étroite et plus honnête. Les défauts ne sont pas masqués, ce qui oblige à travailler proprement en amont — d'où notre sélection lot par lot. En bouche, l'attaque est plus nette, la finale plus courte et plus propre, et l'arrière-goût ne colle pas au palais.

Les seuls en Algérie

À notre connaissance, nous sommes aujourd'hui les seuls en Algérie à produire une capsule espresso 100 % naturelle, sans sucre, en aluminium alimentaire pur. Ce n'est pas une position confortable : elle impose des fournisseurs plus exigeants, des contrôles plus fréquents et des marges plus serrées. C'est aussi la seule raison d'être de Moriva.

Et les capsules aromatisées ?

La noisette, la vanille, le caramel et le chocolat forment une gamme distincte, pensée pour la gourmandise. Elles partagent la même capsule en aluminium alimentaire pur et la même exigence de fabrication, mais la mention 100 % bio est réservée à la gamme espresso — c'est plus honnête, et vous savez ainsi exactement ce que vous achetez.$x$,
  $x$كلمة «بيو» على علبة قهوة قد تعني الكثير — أو لا شيء تقريباً. فلنقل بدقّة ما تعنيه عندنا.

الحبة

تُنتج تشكيلة موريفا البيو من حبوب طبيعية، دون سكر مضاف ودون نكهات صناعية. ما تشمّه عند فتح العلبة يأتي من القهوة ومن التحميص، لا من قارورة.

الكبسولة

الوعاء جزء من الوعد. كبسولاتنا من ألمنيوم غذائي خالص، دون مواد كيميائية مضافة، مصنوعة مع خبراء معتمدين. قهوة طبيعية داخل وعاء يُطلق شيئاً عند 92 درجة ليست قهوة طبيعية.

السكر

صفر. لا سكر مضاف ولا محلّيات. الإسبريسو المُحلّى في المصنع إسبريسو لم يعد بالإمكان الحكم على مرارته — والمرارة تحديداً هي ما يُفترض بالتحميص أن يضبطه. إن أردت التحلية فحلِّ بنفسك: الفنجان فنجانك.

ما الذي يتغيّر في الطعم

القهوة بلا إضافات لها بصمة أضيق وأصدق. العيوب لا تُخفى، وهذا يفرض عملاً نظيفاً في المراحل الأولى — ومن هنا انتقاؤنا دفعةً دفعة. في الفم تكون البداية أوضح، والنهاية أقصر وأنظف، والأثر لا يلتصق بالحنك.

الوحيدون في الجزائر

على حدّ علمنا، نحن اليوم الوحيدون في الجزائر الذين ينتجون كبسولة إسبريسو طبيعية 100٪، بلا سكر، بألمنيوم غذائي خالص. ليس موقعاً مريحاً: يفرض موردين أكثر صرامة، ومراقبة أكثر تواتراً، وهوامش أضيق. وهو أيضاً سبب وجود موريفا كله.

وماذا عن الكبسولات بالنكهات؟

البندق والفانيليا والكراميل والشوكولاتة تشكّل تشكيلة مستقلة موجّهة للذوّاقة. تشترك معها في الكبسولة المصنوعة من ألمنيوم غذائي خالص وفي المعايير نفسها، لكن وصف «100٪ بيو» يبقى حكراً على تشكيلة الإسبريسو — وهذا أصدق، وبه تعرف تماماً ما الذي تشتريه.$x$,
  '/images/life/range-table-lg.webp',
  'Bio', 'بيو', 'Norlyn Coffee', 5, false, 'published', '2026-05-30T09:00:00Z'
),
(
  'quelle-intensite-choisir',
  'Noir, Brun, Vert ou Or : quelle intensité est faite pour vous ?',
  'الأسود، البني، الأخضر أم الذهبي: أي درجة تناسبك؟',
  $x$Quatre couleurs, quatre équilibres entre robusta et arabica. Un guide court pour trouver la vôtre du premier coup.$x$,
  $x$أربعة ألوان، أربعة توازنات بين الروبوستا والأرابيكا. دليل قصير لتجد درجتك من المرة الأولى.$x$,
  $x$L'intensité n'est pas la quantité de caféine, et ce n'est pas non plus la qualité. C'est l'équilibre entre robusta et arabica, la longueur de la torréfaction et le dosage. Une intensité élevée donne un café puissant ; une intensité basse donne un café aromatique. Ni l'un ni l'autre n'est « meilleur » — ils ne répondent pas à la même envie.

Le Noir — l'intensité maximale

Robusta dominant, dosage le plus élevé de la gamme, crema sombre et corps épais. C'est le café du réveil, celui qu'on boit serré et sans y penser à 6 h du matin. Si vous trouvez la plupart des espressos trop légers, commencez ici.

Le Brun — puissant, mais rond

Un cran en dessous. Le corps reste présent, le cacao arrive au premier plan, l'amertume recule. C'est souvent le meilleur compromis pour quelqu'un qui aime le café fort mais le boit toute la journée.

Le Vert — l'équilibre

Ni trop fort ni trop doux : arabica et robusta se répondent. C'est l'intensité qui plaît au plus grand nombre, celle qu'on sert quand on ne connaît pas les goûts de l'invité, et celle qui supporte le mieux d'être allongée.

L'Or — le goût avant la force

Arabica dominant, intensité la plus basse, dosage le plus léger. Une tasse florale, presque sucrée naturellement, avec une acidité fine. C'est notre plus haute qualité et, paradoxalement, la moins « forte » : ici, ce qu'on cherche, c'est l'arôme.

Comment choisir en une question

Buvez-vous votre espresso pour vous réveiller, ou pour le goûter ? Réveil : Noir ou Brun. Goût : Vert ou Or. Et si vous hésitez encore, commencez par le Vert — c'est la référence à partir de laquelle vous saurez dans quelle direction aller.$x$,
  $x$درجة القوة ليست كمية الكافيين، وليست الجودة. هي التوازن بين الروبوستا والأرابيكا، ومدّة التحميص، وحجم الجرعة. القوة العالية تعطي قهوة قوية، والقوة المنخفضة تعطي قهوة عطرية. لا واحدة منهما «أفضل» — ببساطة لا تجيبان على الرغبة نفسها.

الأسود — أقصى قوة

روبوستا غالبة، وأعلى جرعة في التشكيلة، وكريما داكنة وقوام كثيف. إنها قهوة الاستيقاظ، تلك التي تُشرب مركّزة دون تفكير في السادسة صباحاً. إن كنت تجد معظم أنواع الإسبريسو خفيفة، فابدأ من هنا.

البني — قوي لكنه ناعم

درجة أدنى. يبقى القوام حاضراً، ويتقدّم الكاكاو، وتتراجع المرارة. غالباً هو الحلّ الأمثل لمن يحب القهوة القوية لكنه يشربها طوال اليوم.

الأخضر — التوازن

لا قوي أكثر من اللازم ولا ناعم أكثر من اللازم: أرابيكا وروبوستا في حوار. هو الدرجة التي تُرضي أكبر عدد، وتُقدَّم للضيف الذي لا تعرف ذوقه، وتتحمّل التطويل بالماء أكثر من غيرها.

الذهبي — الطعم قبل القوة

أرابيكا غالبة، أدنى درجة قوة، وأخفّ جرعة. فنجان زهري، حلو طبيعياً تقريباً، بحموضة رفيعة. إنه أرقى ما لدينا، وهو في الوقت نفسه الأقل «قوة»: المطلوب هنا هو العطر.

كيف تختار بسؤال واحد

هل تشرب الإسبريسو لتستيقظ أم لتتذوّق؟ للاستيقاظ: الأسود أو البني. للتذوّق: الأخضر أو الذهبي. وإن بقيت متردّداً فابدأ بالأخضر — منه ستعرف في أي اتجاه تمضي.$x$,
  '/images/life/range-fan-lg.webp',
  'Guide', 'دليل', 'Norlyn Coffee', 4, false, 'published', '2026-04-21T09:00:00Z'
),
(
  'de-l-atelier-a-votre-porte',
  'De l''atelier à votre porte : les 58 wilayas',
  'من الورشة إلى بابك: 58 ولاية',
  $x$Nos camionnettes, nos délais, et pourquoi vous ne payez qu'une fois la boîte entre vos mains.$x$,
  $x$شاحناتنا، ومواعيدنا، ولماذا لا تدفع إلا والعلبة بين يديك.$x$,
  $x$Une capsule bien fabriquée qui arrive écrasée trois semaines plus tard n'est pas une bonne capsule. La livraison fait partie du produit — nous la traitons comme telle.

Notre propre flotte

Nous livrons une partie de l'Algérois avec nos propres camionnettes, aux couleurs de Moriva. Ce n'est pas seulement une question d'image : quand c'est notre chauffeur qui livre, c'est notre équipe qui répond, qui reprend une boîte abîmée sur place et qui nous rapporte ce que le client a dit. Pour les 58 wilayas, nous travaillons avec des transporteurs partenaires, avec les mêmes consignes d'emballage.

Le paiement à la livraison

Vous ne payez rien en ligne. Vous payez quand la boîte est entre vos mains, à domicile ou au bureau de livraison. C'est la norme en Algérie, et c'est surtout la seule manière honnête de vendre à quelqu'un qui ne nous connaît pas encore.

Comment se passe une commande

Vous choisissez vos capsules et vous laissez votre nom, votre téléphone et votre wilaya. Notre équipe vous rappelle pour confirmer l'adresse et le créneau — c'est aussi à ce moment-là que vous pouvez encore changer une intensité ou ajouter une boîte. Ensuite, la commande part.

L'emballage

Les boîtes voyagent à plat, calées, dans un carton qui ne se déforme pas sous le poids d'un autre colis. Une capsule dont l'opercule a été percé pendant le transport a perdu sa fraîcheur : le contrôle d'étanchéité que nous faisons à l'atelier n'aurait aucun sens si le carton la trahissait ensuite.

Un problème ?

Appelez-nous. Une boîte abîmée est remplacée. Nous préférons de loin refaire une livraison que perdre un client qui n'a pas osé se plaindre.$x$,
  $x$الكبسولة المُتقَنة التي تصل مهروسة بعد ثلاثة أسابيع ليست كبسولة جيدة. التوصيل جزء من المنتج — ونتعامل معه على هذا الأساس.

أسطولنا الخاص

نوصّل جزءاً من الجزائر العاصمة بشاحناتنا الخاصة، بألوان موريفا. وليست المسألة مسألة صورة فقط: حين يكون السائق سائقنا، يكون الردّ ردّ فريقنا، ويُستبدل الصندوق التالف في المكان، وتصلنا ملاحظة الزبون كما قالها. أما بقية الولايات الـ58 فنعمل فيها مع ناقلين شركاء، بالتعليمات نفسها في التغليف.

الدفع عند الاستلام

لا تدفع شيئاً عبر الإنترنت. تدفع والعلبة بين يديك، في بيتك أو في مكتب التوصيل. هذا هو المعتاد في الجزائر، وهو قبل ذلك الطريقة الصادقة الوحيدة للبيع لمن لا يعرفنا بعد.

كيف يجري الطلب

تختار كبسولاتك وتترك اسمك وهاتفك وولايتك. يتصل بك فريقنا لتأكيد العنوان والموعد — وهي أيضاً اللحظة التي يمكنك فيها تغيير درجة أو إضافة علبة. ثم ينطلق الطلب.

التغليف

تسافر العلب مسطّحة ومثبّتة، داخل كرتون لا ينثني تحت ثقل طرد آخر. الكبسولة التي ثُقب غطاؤها أثناء النقل فقدت طزاجتها: ولا معنى لاختبار الإحكام في الورشة إن خانها الكرتون بعده.

هل من مشكلة؟

اتصل بنا. العلبة التالفة تُستبدل. نفضّل بكثير إعادة توصيل على خسارة زبون لم يجرؤ على الشكوى.$x$,
  '/images/fleet/vans-yard-lg.webp',
  'Coulisses', 'من الكواليس', 'Norlyn Coffee', 4, false, 'published', '2026-03-12T09:00:00Z'
)
on conflict (slug) do nothing;
