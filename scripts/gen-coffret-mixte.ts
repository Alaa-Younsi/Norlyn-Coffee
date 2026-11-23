/**
 * Writes supabase/migrations/0023_coffret_mixte.sql — the Coffret Mixte
 * Intensités, its three offers (3 / 4 / 5 coffrets) and its sales page, plus
 * the `packs_only` rule that keeps it from being ordered on its own.
 *
 * The page is built with the SAME createBlock() defaults the admin editor
 * uses, so it opens in "Pages produit" exactly like a page made by hand.
 *
 *   bun scripts/gen-coffret-mixte.ts
 */
import { writeFileSync } from "node:fs";
import { createBlock, DEFAULT_THEME, THEME_PRESETS } from "../src/lib/pageBuilder/defaults";
import type { Block, BlockDataMap, BlockType, L10n, PageDoc } from "../src/lib/pageBuilder/types";

const t = (fr: string, ar: string, en: string): L10n => ({ fr, ar, en });
const img = (url: string) => ({ kind: "image" as const, url });
const none: L10n = { fr: "", ar: "", en: "" };

function block<K extends BlockType>(type: K, data: Partial<BlockDataMap[K]>, base: Partial<Block> = {}): Block {
  const b = createBlock(type);
  return { ...b, ...base, data: { ...b.data, ...data } } as Block;
}

const COVER = "/images/life/coffret-mixte-lg.webp";
const SLUG = "coffret-mixte-intensites";
const OFFERS = ["coffret-mixte-x3", "coffret-mixte-x4", "coffret-mixte-x5"] as const;

// ------------------------------------------------------------------- page
const page: PageDoc = {
  version: 1,
  theme: {
    ...DEFAULT_THEME,
    preset: "noir-gold",
    ...THEME_PRESETS["noir-gold"],
    bgFx: "orbs",
    anim: "fade-up",
    radius: 26,
    stickyBar: true,
  },
  blocks: [
    block(
      "hero",
      {
        layout: "split",
        media: [img(COVER)],
        mediaFx: "tilt",
        eyebrow: t("Coffret Mixte Intensités", "علبة الشدّات المشكّلة", "Mixed Intensities Box"),
        title: t("Les 4 intensités, un seul coffret", "الشدّات الأربع في علبة واحدة", "All 4 intensities, one box"),
        subtitle: t(
          "20 capsules : 5 Vert, 5 Or, 5 Brun et 5 Noir. De la douceur à la puissance, au fil de vos envies.",
          "20 كبسولة: 5 أخضر، 5 ذهبي، 5 بني و5 أسود. من النعومة إلى القوة حسب مزاجك.",
          "20 capsules: 5 Green, 5 Gold, 5 Brown and 5 Black. From smooth to bold, whenever you like.",
        ),
        badge: t("Livraison offerte", "توصيل مجاني", "Free delivery"),
        titleFx: "shimmer",
        showPrice: false,
        cta: t("Choisir mon offre", "اختر عرضي", "Choose my offer"),
        ctaTarget: "offers",
        cta2: none,
      },
      { align: "start" },
    ),
    block(
      "marquee",
      {
        items: [
          t("20 capsules", "20 كبسولة", "20 capsules"),
          t("4 intensités", "4 شدّات", "4 intensities"),
          t("Dosage 6 g", "جرعة 6 غ", "6 g dose"),
          t("100 % bio", "100٪ بيو", "100% organic"),
          t("Livraison offerte", "توصيل مجاني", "Free delivery"),
        ],
        style: "solid",
        size: "md",
        separator: "bean",
        skew: true,
      },
      { tone: "accent" },
    ),
    block(
      "offers",
      {
        eyebrow: t("Nos offres", "عروضنا", "Our offers"),
        title: t("Choisissez votre coffret", "اختر علبتك", "Choose your box"),
        subtitle: t(
          "À partir de 3 coffrets — livraison offerte partout en Algérie, paiement à la réception.",
          "ابتداءً من 3 علب — توصيل مجاني لكل الولايات والدفع عند الاستلام.",
          "From 3 boxes — free delivery anywhere in Algeria, pay on arrival.",
        ),
        items: [
          { slug: OFFERS[0], badge: none, note: t("L'essentiel pour commencer", "الأساسي للبداية", "The essentials to start"), highlight: false },
          { slug: OFFERS[1], badge: t("Le plus populaire", "الأكثر طلباً", "Most popular"), note: t("60 capsules à partager… ou pas", "60 كبسولة للمشاركة… أو لا", "60 capsules to share… or not"), highlight: true },
          { slug: OFFERS[2], badge: t("Meilleure offre", "أفضل عرض", "Best deal"), note: t("Le meilleur prix par coffret", "أفضل سعر للعلبة", "The best price per box"), highlight: false },
        ],
        preselect: OFFERS[1],
        style: "cards",
        unitLabel: t("coffret", "علبة", "box"),
        showPerUnit: true,
        savings: "first",
        cta: t("Commander cette offre", "اطلب هذا العرض", "Order this offer"),
        ctaTarget: "checkout",
      },
      { tone: "gradient", width: "wide" },
    ),
    block(
      "features",
      {
        title: t("Ce qu'il y a dans le coffret", "ماذا يوجد في العلبة", "What's in the box"),
        subtitle: t("5 capsules de chaque intensité, toutes dosées à 6 g.", "5 كبسولات من كل شدّة، كلها بجرعة 6 غ.", "5 capsules of each intensity, every one dosed at 6 g."),
        style: "cards",
        columns: 4,
        items: [
          { icon: "leaf", title: t("5 × Vert — 8", "5 × أخضر — 8", "5 × Green — 8"), text: t("L'équilibre exact entre force et douceur.", "التوازن التام بين القوة والنعومة.", "The exact balance of strength and smoothness.") },
          { icon: "award", title: t("5 × Or — 10", "5 × ذهبي — 10", "5 × Gold — 10"), text: t("Arabica dominant, aromatique et floral.", "أرابيكا غالبة، عطري وزهري.", "Arabica-led, aromatic and floral.") },
          { icon: "coffee", title: t("5 × Brun — 11", "5 × بني — 11", "5 × Brown — 11"), text: t("Rond, chocolaté, long en bouche.", "ناعم بنكهة الكاكاو ونهاية طويلة.", "Round, chocolatey, long finish.") },
          { icon: "flame", title: t("5 × Noir — 13", "5 × أسود — 13", "5 × Black — 13"), text: t("Notre intensité maximale, crema sombre.", "أقصى شدّة لدينا، كريما داكنة.", "Our boldest, with a dark crema.") },
        ],
      },
    ),
    block(
      "stats",
      {
        title: none,
        style: "rings",
        items: [
          { value: 20, label: t("capsules par coffret", "كبسولة في العلبة", "capsules per box") },
          { value: 4, label: t("intensités", "شدّات", "intensities") },
          { value: 6, suffix: " g", label: t("de café par capsule", "من القهوة في كل كبسولة", "of coffee per capsule") },
          { value: 0, suffix: " %", label: t("sucre", "سكر", "sugar") },
        ],
      },
      { tone: "surface", pad: "md" },
    ),
    block("features", {
      title: t("La qualité Moriva", "جودة موريفا", "Moriva quality"),
      style: "list",
      columns: 2,
      items: [
        { icon: "leaf", title: t("100 % bio", "100٪ بيو", "100% organic"), text: t("Grains naturels, 0 % sucre.", "حبوب طبيعية، 0٪ سكر.", "Natural beans, 0% sugar.") },
        { icon: "shield", title: t("Aluminium alimentaire pur", "ألمنيوم غذائي خالص", "Pure food-grade aluminium"), text: t("0 % produit chimique.", "0٪ مواد كيميائية.", "0% chemicals.") },
        { icon: "award", title: t("Fabriqué en Algérie", "صُنع في الجزائر", "Made in Algeria"), text: t("Par des experts certifiés.", "على يد خبراء معتمدين.", "By certified experts.") },
        { icon: "coffee", title: t("Compatible Nespresso®", "متوافقة مع نسبريسو®", "Nespresso®-compatible"), text: t("Dans votre machine habituelle.", "في آلتك المعتادة.", "In the machine you already have.") },
      ],
    }),
    block(
      "gallery",
      {
        title: t("Ouvrez le coffret", "افتح العلبة", "Open the box"),
        layout: "mosaic",
        hover: "zoom",
        items: [img(COVER), img("/images/life/range-capsules-lg.webp"), img("/images/life/espresso-glass-lg.webp")],
      },
      { width: "wide" },
    ),
    block("faq", {
      title: t("Questions fréquentes", "أسئلة شائعة", "Questions"),
      items: [
        {
          q: t("Que contient un coffret ?", "ماذا تحتوي العلبة؟", "What's in one box?"),
          a: t(
            "20 capsules : 5 Vert (intensité 8), 5 Or (10), 5 Brun (11) et 5 Noir (13), toutes dosées à 6 g.",
            "20 كبسولة: 5 أخضر (شدّة 8)، 5 ذهبي (10)، 5 بني (11) و5 أسود (13)، كلها بجرعة 6 غ.",
            "20 capsules: 5 Green (intensity 8), 5 Gold (10), 5 Brown (11) and 5 Black (13), all dosed at 6 g.",
          ),
        },
        {
          q: t("Puis-je commander un seul coffret ?", "هل يمكنني طلب علبة واحدة؟", "Can I order a single box?"),
          a: t(
            "Le coffret se commande à partir de 3 : choisissez l'offre 3, 4 ou 5 coffrets ci-dessus.",
            "تُطلب العلبة ابتداءً من 3: اختر عرض 3 أو 4 أو 5 علب أعلاه.",
            "The box is sold from 3: pick the 3, 4 or 5-box offer above.",
          ),
        },
        {
          q: t("La livraison est-elle payante ?", "هل التوصيل مدفوع؟", "Is delivery charged?"),
          a: t("Non, elle est offerte sur les trois offres.", "لا، التوصيل مجاني في العروض الثلاثة.", "No, it's free on all three offers."),
        },
        {
          q: t("Comment je paie ?", "كيف أدفع؟", "How do I pay?"),
          a: t("À la livraison, en espèces.", "عند الاستلام، نقداً.", "On delivery, in cash."),
        },
      ],
    }),
    block("checkout", {
      title: t("Votre commande", "طلبك", "Your order"),
      subtitle: t("Livraison offerte — payez à la réception.", "توصيل مجاني — ادفع عند الاستلام.", "Free delivery — pay on arrival."),
      style: "split",
      showSummary: true,
    }),
  ],
};

// ------------------------------------------------------------------- SQL
const lit = (v: unknown) => `$pb$${JSON.stringify(v)}$pb$::jsonb`;
const arr = (xs: string[]) => `array[${xs.map((x) => `$n$${x}$n$`).join(", ")}]`;

const offer = (slug: string, n: number, price: number, names: [string, string, string], taglines: [string, string, string], sort: number) =>
  `insert into packs (slug, status, name_fr, name_ar, name_en, tagline_fr, tagline_ar, tagline_en, cover_url, items, pricing, max_per_order, featured, sort_order, page)
select '${slug}', 'published', $n$${names[0]}$n$, $n$${names[1]}$n$, $n$${names[2]}$n$,
  $n$${taglines[0]}$n$, $n$${taglines[1]}$n$, $n$${taglines[2]}$n$, '${COVER}',
  jsonb_build_array(jsonb_build_object('product_id', p.id, 'quantity', ${n}, 'price', null)),
  ${lit({ mode: "fixed", value: price, step: 1, ending: null, floor: 0, compare: "none", tiers: [], free_shipping: true })},
  10, false, ${sort}, ${lit(page)}
from products p where p.slug = '${SLUG}'
on conflict (slug) do nothing;`;

const sql = `-- GENERATED by scripts/gen-coffret-mixte.ts — edit that file and re-run it, not this one.
--
-- The Coffret Mixte Intensités: 20 capsules, 5 of each bio espresso
-- (Vert 8 · Or 10 · Brun 11 · Noir 13), dosed at 6 g. It is sold from 3
-- coffrets only, through three offers — 3 = 3 300 DA, 4 = 4 150 DA,
-- 5 = 5 000 DA, delivery free on all three.
--
-- "From 3 only" is enforced by the database, not the page: a product flagged
-- packs_only can never be an order line of its own (the trigger below), only a
-- component of a pack — and place_order prices those packs server-side.
--
-- Idempotent and non-destructive: an existing product / pack / page with the
-- same slug is left exactly as the client edited it.
-- Requires 0021_packs_and_pages.sql.

-- ------------------------------------------------------------ packs_only
alter table products add column if not exists packs_only boolean not null default false;

create or replace function order_items_packs_only_guard()
returns trigger
language plpgsql
as $$
begin
  if new.product_id is not null
     and exists (select 1 from products where id = new.product_id and packs_only) then
    raise exception 'ERR_PRODUCT_UNAVAILABLE: packs only';
  end if;
  return new;
end;
$$;

drop trigger if exists order_items_packs_only on order_items;
create trigger order_items_packs_only
  before insert on order_items
  for each row execute function order_items_packs_only_guard();

-- --------------------------------------------------------------- product
insert into products
  (slug, name_fr, name_ar, name_en, description_fr, description_ar, description_en,
   details_fr, details_ar, details_en,
   price, category_id, stock, intensity, dosage, accent_color, featured, status, packs_only)
values (
  '${SLUG}',
  $n$Coffret Mixte Intensités$n$, $n$علبة الشدّات المشكّلة$n$, $n$Mixed Intensities Box$n$,
  $n$Les quatre intensités Moriva réunies dans un coffret noir et or : 5 Vert, 5 Or, 5 Brun et 5 Noir. Vingt capsules pour passer de la douceur à la puissance, au fil de vos envies.$n$,
  $n$شدّات موريفا الأربع في علبة سوداء وذهبية: 5 أخضر، 5 ذهبي، 5 بني و5 أسود. عشرون كبسولة لتنتقل من النعومة إلى القوة حسب مزاجك.$n$,
  $n$All four Moriva intensities in one black-and-gold box: 5 Green, 5 Gold, 5 Brown and 5 Black. Twenty capsules to go from smooth to bold, whenever you like.$n$,
  ${arr([
    "100 % bio — grains naturels, 0 % sucre",
    "Capsule en aluminium alimentaire pur, 0 % produit chimique",
    "Fabriquée en Algérie par des experts certifiés",
    "Coffret de 20 capsules — 5 de chaque intensité (Vert, Or, Brun, Noir)",
    "Compatible Nespresso®",
  ])},
  ${arr([
    "100٪ بيو — حبوب طبيعية، 0٪ سكر",
    "كبسولة من ألمنيوم غذائي خالص، 0٪ مواد كيميائية",
    "مصنوعة في الجزائر على يد خبراء معتمدين",
    "علبة من 20 كبسولة — 5 من كل شدّة (أخضر، ذهبي، بني، أسود)",
    "متوافقة مع نسبريسو®",
  ])},
  ${arr([
    "100 % organic — natural beans, 0 % sugar",
    "Pure food-grade aluminium capsule, 0 % chemicals",
    "Made in Algeria by certified experts",
    "Box of 20 capsules — 5 of each intensity (Green, Gold, Brown, Black)",
    "Nespresso®-compatible",
  ])},
  1005, (select id from categories where slug = 'espresso-bio'), 100,
  null, '6,0 g', '#B8891F', true, 'active', true
)
on conflict (slug) do nothing;

insert into product_images (product_id, url, alt, sort_order)
select p.id, '${COVER}', $n$Coffret Mixte Intensités Moriva$n$, 0
from products p
where p.slug = '${SLUG}'
  and not exists (select 1 from product_images i where i.product_id = p.id);

-- ---------------------------------------------------------------- offers
${offer(OFFERS[0], 3, 3300, ["Coffret Mixte — 3 coffrets", "العلبة المشكّلة — 3 علب", "Mixed Box — 3 boxes"], ["60 capsules, livraison offerte", "60 كبسولة، توصيل مجاني", "60 capsules, free delivery"], 10)}

${offer(OFFERS[1], 4, 4150, ["Coffret Mixte — 4 coffrets", "العلبة المشكّلة — 4 علب", "Mixed Box — 4 boxes"], ["80 capsules, livraison offerte", "80 كبسولة، توصيل مجاني", "80 capsules, free delivery"], 11)}

${offer(OFFERS[2], 5, 5000, ["Coffret Mixte — 5 coffrets", "العلبة المشكّلة — 5 علب", "Mixed Box — 5 boxes"], ["100 capsules, livraison offerte", "100 كبسولة، توصيل مجاني", "100 capsules, free delivery"], 12)}

-- ------------------------------------------------------------ sales page
insert into product_pages (product_id, enabled, mode, page)
select id, true, 'replace', ${lit(page)} from products where slug = '${SLUG}'
on conflict (product_id) do nothing;
`;

writeFileSync(new URL("../supabase/migrations/0023_coffret_mixte.sql", import.meta.url), sql);
process.stdout.write(`wrote 0023_coffret_mixte.sql (${sql.length} chars)\n`);
