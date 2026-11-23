/**
 * Writes supabase/migrations/0022_demo_packs_pages.sql — three demo packs and
 * two personalised product pages, built with the SAME createBlock() defaults
 * the admin editor uses, so the seed can never drift from the page format.
 *
 *   bun scripts/gen-pack-demos.ts
 */
import { writeFileSync } from "node:fs";
import { createBlock, DEFAULT_THEME, THEME_PRESETS } from "../src/lib/pageBuilder/defaults";
import type { Block, BlockDataMap, BlockType, L10n, PageDoc, Theme } from "../src/lib/pageBuilder/types";

const t = (fr: string, ar: string, en: string): L10n => ({ fr, ar, en });
const img = (url: string) => ({ kind: "image" as const, url });
const vid = (url: string, poster: string) => ({ kind: "video" as const, url, poster });

function block<K extends BlockType>(type: K, data: Partial<BlockDataMap[K]>, base: Partial<Block> = {}): Block {
  const b = createBlock(type);
  return { ...b, ...base, data: { ...b.data, ...data } } as Block;
}
const theme = (patch: Partial<Theme>): Theme => ({ ...DEFAULT_THEME, ...patch });

// ------------------------------------------------------------ 1. découverte
const decouverte: PageDoc = {
  version: 1,
  theme: theme({ preset: "noir-gold", ...THEME_PRESETS["noir-gold"], bgFx: "aurora", anim: "blur", radius: 28 }),
  blocks: [
    block("hero", {
      layout: "cover",
      media: [img("/images/life/range-fan-lg.webp"), img("/images/life/range-capsules-lg.webp"), img("/images/life/box-open-lg.webp")],
      mediaFx: "kenburns",
      eyebrow: t("Coffret découverte", "علبة الاكتشاف", "Discovery box"),
      title: t("Les 8 saveurs Moriva", "نكهات موريفا الثماني", "All 8 Moriva flavours"),
      subtitle: t(
        "Quatre intensités, quatre arômes — une boîte de chaque, pour trouver la vôtre.",
        "أربع درجات قوة وأربع نكهات — علبة من كل واحدة لتجد قهوتك.",
        "Four intensities, four aromas — one box of each, to find yours.",
      ),
      badge: t("−18 %", "−18٪", "−18%"),
      titleFx: "kinetic",
      cta: t("Je prends le coffret", "أريد العلبة", "I'll take the box"),
      cta2: t("Voir le contenu", "شاهد المحتوى", "See what's inside"),
      cta2Target: "price",
    }, { align: "start" }),
    block("marquee", {
      items: [t("8 saveurs", "8 نكهات", "8 flavours"), t("80 capsules", "80 كبسولة", "80 capsules"), t("Livraison offerte", "توصيل مجاني", "Free delivery"), t("100 % bio", "100% عضوي", "100% organic")],
      style: "solid",
      size: "md",
      separator: "star",
      skew: true,
    }, { tone: "accent" }),
    block("countdown", {
      mode: "evergreen",
      hours: 48,
      style: "flip",
      title: t("Prix de lancement — encore", "سعر الإطلاق — متبقٍ", "Launch price — still"),
    }, { tone: "surface" }),
    block("contents", {
      title: t("Une boîte de chaque", "علبة من كل نكهة", "One box of each"),
      subtitle: t("80 capsules en tout, compatibles Nespresso®.", "80 كبسولة، متوافقة مع Nespresso®.", "80 capsules in all, Nespresso® compatible."),
      style: "orbit",
    }, { align: "center" }),
    block("price", { style: "card", title: t("Le coffret complet", "العلبة الكاملة", "The full box") }, { align: "center" }),
    block("features", {
      title: t("Pourquoi ce coffret", "لماذا هذه العلبة", "Why this box"),
      style: "bento",
      columns: 4,
      items: [
        { icon: "gift", title: t("Le cadeau parfait", "الهدية المثالية", "The perfect gift"), text: t("Une boîte élégante, prête à offrir.", "علبة أنيقة جاهزة للإهداء.", "An elegant box, ready to give.") },
        { icon: "coffee", title: t("Trouvez votre intensité", "اكتشف قوتك المفضلة", "Find your intensity"), text: t("Du Vert doux au Noir corsé.", "من الأخضر الخفيف إلى الأسود القوي.", "From the gentle Green to the bold Black.") },
        { icon: "truck", title: t("Livraison offerte", "توصيل مجاني", "Free delivery"), text: t("Dans les 69 wilayas.", "إلى 69 ولاية.", "To all 69 wilayas.") },
        { icon: "leaf", title: t("100 % bio", "100% عضوي", "100% organic"), text: t("0 % sucre, 0 % chimie.", "0% سكر، 0% مواد كيميائية.", "0% sugar, 0% chemicals.") },
      ],
    }),
    block("gallery", {
      title: t("Ouvrez la boîte", "افتح العلبة", "Open the box"),
      layout: "stack",
      items: [img("/images/life/box-closed-lg.webp"), img("/images/life/box-open-lg.webp"), img("/images/life/range-table-lg.webp"), img("/images/life/beans-capsules-lg.webp"), img("/images/life/espresso-glass-lg.webp")],
    }, { align: "center" }),
    block("testimonials", {
      title: t("Ils l'ont offert", "أهدوها", "They gave it"),
      style: "spotlight",
      items: [
        { name: "Sarah M., Oran", rating: 5, text: t("Offert à mon père — il a enfin trouvé son café : le Brun.", "أهديتها لأبي — وجد قهوته أخيراً: البني.", "Gave it to my dad — he finally found his coffee: the Brown.") },
        { name: "Nassim T., Alger", rating: 5, text: t("La meilleure façon de goûter toute la gamme.", "أفضل طريقة لتذوق المجموعة كاملة.", "The best way to taste the whole range.") },
        { name: "Lina K., Sétif", rating: 5, text: t("Le Caramel et la Noisette… un rêve.", "الكراميل والبندق… حلم.", "The Caramel and the Hazelnut… a dream.") },
      ],
    }, { align: "center" }),
    block("faq", {
      items: [
        { q: t("Les capsules sont-elles compatibles ?", "هل الكبسولات متوافقة؟", "Are the capsules compatible?"), a: t("Oui, avec toutes les machines Nespresso® Original.", "نعم، مع كل آلات Nespresso® Original.", "Yes, with every Nespresso® Original machine.") },
        { q: t("La livraison est vraiment offerte ?", "هل التوصيل مجاني فعلاً؟", "Is delivery really free?"), a: t("Oui, partout en Algérie, pour toute commande de ce coffret.", "نعم، في كل الجزائر مع هذه العلبة.", "Yes, anywhere in Algeria, with this box.") },
        { q: t("Je paie quand ?", "متى أدفع؟", "When do I pay?"), a: t("À la livraison, en espèces.", "عند الاستلام نقداً.", "On delivery, in cash.") },
      ],
    }),
    block("checkout", { title: t("Coffret Découverte", "علبة الاكتشاف", "Discovery box") }, { tone: "gradient" }),
  ],
};

// ----------------------------------------------------------------- 2. duo
const duo: PageDoc = {
  version: 1,
  theme: theme({ preset: "caramel", ...THEME_PRESETS.caramel, bgFx: "orbs", font: "serif", anim: "tilt", speed: "calm", radius: 36 }),
  blocks: [
    block("hero", {
      layout: "split",
      media: [vid("/videos/espresso.mp4", "/images/life/espresso-glass-lg.webp")],
      mediaFx: "tilt",
      eyebrow: t("Le duo des intenses", "ثنائي القوة", "The intense duo"),
      title: t("Noir & Brun, en duo", "الأسود والبني معاً", "Black & Brown, together"),
      subtitle: t("2 Noir + 2 Brun : de quoi tenir le mois, à prix fixe.", "2 أسود + 2 بني: ما يكفي الشهر بسعر ثابت.", "2 Black + 2 Brown: a month's worth, at one fixed price."),
      titleFx: "gradient",
      badge: t("Prix fixe", "سعر ثابت", "Fixed price"),
    }),
    block("stats", {
      style: "rings",
      items: [
        { value: 40, label: t("capsules", "كبسولة", "capsules") },
        { value: 13, label: t("intensité max", "أقصى قوة", "max intensity") },
        { value: 0, suffix: " %", label: t("sucre", "سكر", "sugar") },
      ],
    }),
    block("story", {
      media: img("/images/life/pour-machine-lg.webp"),
      mediaFx: "parallax",
      eyebrow: t("Pour les matins sérieux", "للصباحات الجادة", "For serious mornings"),
      title: t("Le Noir réveille, le Brun réconforte", "الأسود يوقظ والبني يريح", "Black wakes you, Brown comforts"),
      text: t(
        "Le Noir, robusta dominant, frappe fort et vite.\n\nLe Brun, un cran en dessous : rond, chocolaté, long en bouche. Deux humeurs, un seul carton.",
        "الأسود، روبوستا غالب، قوي وسريع.\n\nالبني، أخف بقليل: مستدير، بطعم الشوكولاتة. مزاجان في علبة واحدة.",
        "Black, robusta-led, hits hard and fast.\n\nBrown, one notch below: round, chocolatey, long. Two moods, one carton.",
      ),
      quote: t("« L'intensité sans l'amertume. »", "«قوة بلا مرارة.»", "“Intensity without bitterness.”"),
    }),
    block("video", {
      title: t("Le rituel", "الطقس", "The ritual"),
      media: vid("/videos/product-2.mp4", "/images/life/follow-poster-lg.webp"),
      frame: "phone",
    }, { align: "center" }),
    block("price", { style: "ticket", title: t("Le duo, prix fixe", "الثنائي بسعر ثابت", "The duo, fixed price") }, { align: "center" }),
    block("cta", {
      title: t("Deux intensités. Un prix.", "قوتان. سعر واحد.", "Two intensities. One price."),
      text: t("Commandez en 30 secondes.", "اطلب في 30 ثانية.", "Order in 30 seconds."),
      style: "glow",
    }),
    block("checkout", { style: "card", title: t("Je commande le duo", "أطلب الثنائي", "Order the duo") }),
  ],
};

// ------------------------------------------------------------ 3. gourmand
const gourmand: PageDoc = {
  version: 1,
  theme: theme({ preset: "crema", ...THEME_PRESETS.crema, bgFx: "beans", font: "sans", anim: "slide-start", speed: "snappy", radius: 20, grain: false }),
  blocks: [
    block("hero", {
      layout: "stacked",
      media: [img("/images/life/beans-capsules-lg.webp")],
      mediaFx: "parallax",
      eyebrow: t("Les 4 arômes", "النكهات الأربع", "The 4 aromas"),
      title: t("Le pack gourmand", "الباقة الشهية", "The gourmet pack"),
      subtitle: t("Vanille, Caramel, Chocolat, Noisette — deux boîtes de chaque.", "فانيليا، كراميل، شوكولاتة، بندق — علبتان من كل نكهة.", "Vanilla, Caramel, Chocolate, Hazelnut — two boxes of each."),
      titleFx: "typewriter",
    }, { align: "center" }),
    block("countdown", {
      mode: "daily",
      style: "ring",
      title: t("L'offre du jour se termine dans", "ينتهي عرض اليوم خلال", "Today's offer ends in"),
    }, { align: "center" }),
    block("contents", { title: t("8 boîtes, 4 plaisirs", "8 علب، 4 متع", "8 boxes, 4 treats"), style: "grid" }),
    block("gallery", {
      layout: "mosaic",
      items: [img("/images/life/range-capsules-lg.webp"), img("/images/life/espresso-glass-lg.webp"), img("/images/life/box-open-lg.webp"), img("/images/life/range-table-lg.webp"), img("/images/life/aluminium-macro-lg.webp")],
      hover: "lift",
    }),
    block("features", {
      title: t("Gourmand, sans sucre", "شهي بدون سكر", "Indulgent, sugar-free"),
      style: "icons",
      items: [
        { icon: "heart", title: t("Arômes naturels", "نكهات طبيعية", "Natural aromas"), text: t("Rien d'artificiel.", "لا شيء صناعي.", "Nothing artificial.") },
        { icon: "droplet", title: t("0 % sucre", "0% سكر", "0% sugar"), text: t("Le goût, pas les calories.", "الطعم بدون سعرات.", "The taste, not the calories.") },
        { icon: "recycle", title: t("Aluminium pur", "ألمنيوم نقي", "Pure aluminium"), text: t("Recyclable à l'infini.", "قابل للتدوير بلا حدود.", "Endlessly recyclable.") },
      ],
    }, { align: "center" }),
    block("price", { style: "banner", title: t("Prix spécial gourmand", "سعر خاص", "Gourmet special price") }),
    block("testimonials", {
      title: t("Les gourmands ont parlé", "قال عشاق النكهة", "The sweet tooths have spoken"),
      style: "marquee",
      items: [
        { name: "Meriem", rating: 5, text: t("La Noisette le matin, le Caramel l'après-midi.", "البندق صباحاً والكراميل مساءً.", "Hazelnut mornings, Caramel afternoons.") },
        { name: "Karim", rating: 5, text: t("Le Chocolat est incroyable avec du lait.", "الشوكولاتة رائعة مع الحليب.", "The Chocolate is unreal with milk.") },
        { name: "Amel", rating: 4, text: t("Parfait pour les invités.", "مثالية للضيوف.", "Perfect for guests.") },
        { name: "Yanis", rating: 5, text: t("Je recommande déjà.", "أعيد الطلب بالفعل.", "Already reordering.") },
      ],
    }),
    block("divider", { style: "wave", size: "md" }),
    block("checkout", { title: t("Pack gourmand", "الباقة الشهية", "Gourmet pack") }),
  ],
};

// ------------------------------------------------------- product: Noir
const noir: PageDoc = {
  version: 1,
  theme: theme({ preset: "custom", bg: "#07070a", surface: "#131318", text: "#f4f1ea", muted: "#9c978d", accent: "#d9b36a", accent2: "#f1dca8", bgFx: "spotlight", anim: "rise", radius: 22 }),
  blocks: [
    block("hero", {
      layout: "cover",
      media: [img("/images/life/pack-black-table-lg.webp")],
      mediaFx: "kenburns",
      eyebrow: t("Intensité 13", "القوة 13", "Intensity 13"),
      title: t("Moriva Noir", "موريفا الأسود", "Moriva Black"),
      subtitle: t("Le plus intense de la maison. Robusta dominant, crema épaisse, zéro compromis.", "الأقوى في الدار. روبوستا غالب وكريما كثيفة.", "The house's most intense. Robusta-led, thick crema, zero compromise."),
      titleFx: "shimmer",
    }),
    block("marquee", { items: [t("Intense", "قوي", "Intense"), t("Corsé", "مركّز", "Bold"), t("Crema épaisse", "كريما كثيفة", "Thick crema")], style: "outline", size: "lg" }),
    block("stats", {
      items: [
        { value: 13, label: t("intensité", "القوة", "intensity") },
        { value: 10, label: t("capsules", "كبسولات", "capsules") },
        { value: 6, suffix: " g", label: t("par capsule", "لكل كبسولة", "per capsule") },
      ],
      style: "plain",
    }),
    block("story", {
      media: img("/images/life/espresso-glass-lg.webp"),
      side: "end",
      eyebrow: t("Le caractère", "الطابع", "The character"),
      title: t("Pour ceux qui le veulent fort", "لمن يحبها قوية", "For those who like it strong"),
      text: t("Torréfaction longue, mouture fine, extraction courte. Le Noir se boit serré, idéalement le matin.", "تحميص طويل وطحن ناعم واستخلاص قصير.", "Long roast, fine grind, short extraction. Best drunk short, ideally in the morning."),
    }),
    block("image", { media: img("/images/life/aluminium-macro-lg.webp"), fx: "parallax", height: "half" }, { width: "wide" }),
    block("features", {
      title: t("Ce qu'il y a dedans", "ما بداخله", "What's inside"),
      items: [
        { icon: "flame", title: t("Torréfaction longue", "تحميص طويل", "Long roast"), text: t("Notes cacao, finale boisée.", "نكهة كاكاو ولمسة خشبية.", "Cocoa notes, woody finish.") },
        { icon: "shield", title: t("Aluminium pur", "ألمنيوم نقي", "Pure aluminium"), text: t("L'arôme reste scellé.", "النكهة محفوظة.", "The aroma stays sealed.") },
        { icon: "leaf", title: t("100 % bio", "100% عضوي", "100% organic"), text: t("0 % sucre.", "0% سكر.", "0% sugar.") },
      ],
    }),
    block("price", { style: "card", title: t("Une boîte de 10", "علبة من 10", "A box of 10") }, { align: "center" }),
    block("checkout", { title: t("Moriva Noir", "موريفا الأسود", "Moriva Black") }),
  ],
};

// --------------------------------------------- product: Or (extends page)
const or: PageDoc = {
  version: 1,
  theme: theme({ bgFx: "rings", anim: "zoom" }),
  blocks: [
    block("marquee", { items: [t("Pur arabica", "أرابيكا خالصة", "Pure arabica"), t("Doux", "ناعم", "Smooth"), t("Équilibré", "متوازن", "Balanced")], style: "accent", size: "md", reverse: true }),
    block("gallery", {
      title: t("L'Or, en images", "الذهبي بالصور", "The Gold, in pictures"),
      layout: "carousel",
      items: [img("/images/life/range-fan-lg.webp"), img("/images/life/espresso-glass-lg.webp"), img("/images/life/box-open-lg.webp"), img("/images/life/beans-capsules-lg.webp")],
    }),
    block("cta", { title: t("L'Or vous attend", "الذهبي بانتظارك", "The Gold is waiting"), button: t("Commander l'Or", "اطلب الذهبي", "Order the Gold"), target: "cart", style: "glow" }),
  ],
};

// ------------------------------------------------------------------- SQL
const lit = (v: unknown) => `$pb$${JSON.stringify(v)}$pb$::jsonb`;
const items = (rows: [string, number, number?][]) =>
  `(select coalesce(jsonb_agg(jsonb_build_object('product_id', p.id, 'quantity', v.q, 'price', v.price) order by v.o), '[]'::jsonb)
     from (values ${rows.map(([slug, q, price], o) => `('${slug}', ${q}, ${price ?? "null"}::numeric, ${o})`).join(", ")}) as v(slug, q, price, o)
     join products p on p.slug = v.slug)`;

const pack = (o: {
  slug: string;
  names: [string, string, string];
  taglines: [string, string, string];
  cover: string;
  rows: [string, number, number?][];
  pricing: object;
  page: PageDoc;
  sort: number;
  endsSql?: string;
}) => `insert into packs (slug, status, name_fr, name_ar, name_en, tagline_fr, tagline_ar, tagline_en, cover_url, items, pricing, ends_at, featured, sort_order, page)
values ('${o.slug}', 'published', $n$${o.names[0]}$n$, $n$${o.names[1]}$n$, $n$${o.names[2]}$n$,
  $n$${o.taglines[0]}$n$, $n$${o.taglines[1]}$n$, $n$${o.taglines[2]}$n$, '${o.cover}',
  ${items(o.rows)}, ${lit(o.pricing)}, ${o.endsSql ?? "null"}, true, ${o.sort}, ${lit(o.page)})
on conflict (slug) do nothing;`;

const productPage = (slug: string, mode: "replace" | "extend", page: PageDoc) =>
  `insert into product_pages (product_id, enabled, mode, page)
select id, true, '${mode}', ${lit(page)} from products where slug = '${slug}'
on conflict (product_id) do nothing;`;

const sql = `-- GENERATED by scripts/gen-pack-demos.ts — edit that file and re-run it, not this one.
--
-- Demo content for 0021: three published packs and two personalised product
-- pages, each showing a different side of the page builder (themes, layouts,
-- timers, videos, pricing modes). Idempotent and non-destructive: an existing
-- pack slug or product page is left exactly as the client edited it.
-- Requires 0021_packs_and_pages.sql.

${pack({
  slug: "coffret-decouverte",
  names: ["Coffret Découverte", "علبة الاكتشاف", "Discovery Box"],
  taglines: ["Les 8 saveurs, une boîte de chaque", "النكهات الثماني، علبة من كل واحدة", "All 8 flavours, one box of each"],
  cover: "/images/life/range-fan-lg.webp",
  rows: [["moriva-noir", 1], ["moriva-brun", 1], ["moriva-vert", 1], ["moriva-or", 1], ["moriva-vanille", 1], ["moriva-caramel", 1], ["moriva-chocolat", 1], ["moriva-noisette", 1]],
  pricing: { mode: "percent", value: 18, step: 10, ending: 90, floor: 0, compare: "auto", tiers: [{ qty: 2, percent: 5 }, { qty: 3, percent: 10 }], free_shipping: true },
  page: decouverte,
  sort: 1,
})}

${pack({
  slug: "duo-intense",
  names: ["Duo Intense", "ثنائي القوة", "Intense Duo"],
  taglines: ["2 Noir + 2 Brun, à prix fixe", "2 أسود + 2 بني بسعر ثابت", "2 Black + 2 Brown, one fixed price"],
  cover: "/images/life/pack-black-table-lg.webp",
  rows: [["moriva-noir", 2], ["moriva-brun", 2]],
  pricing: { mode: "fixed", value: 1490, step: 1, ending: null, floor: 0, compare: "auto", tiers: [{ qty: 2, percent: 8 }], free_shipping: false },
  page: duo,
  sort: 2,
})}

${pack({
  slug: "pack-gourmand",
  names: ["Pack Gourmand", "الباقة الشهية", "Gourmet Pack"],
  taglines: ["Les 4 arômes, deux boîtes de chaque", "النكهات الأربع، علبتان من كل نكهة", "The 4 aromas, two boxes of each"],
  cover: "/images/life/beans-capsules-lg.webp",
  rows: [["moriva-vanille", 2, 380], ["moriva-caramel", 2, 380], ["moriva-chocolat", 2, 380], ["moriva-noisette", 2, 380]],
  pricing: { mode: "amount", value: 200, step: 1, ending: 90, floor: 2000, compare: "auto", tiers: [], free_shipping: true },
  page: gourmand,
  sort: 3,
  endsSql: "now() + interval '30 days'",
})}

${productPage("moriva-noir", "replace", noir)}

${productPage("moriva-or", "extend", or)}
`;

writeFileSync(new URL("../supabase/migrations/0022_demo_packs_pages.sql", import.meta.url), sql);
process.stdout.write(`wrote 0022_demo_packs_pages.sql (${sql.length} chars)
`);
