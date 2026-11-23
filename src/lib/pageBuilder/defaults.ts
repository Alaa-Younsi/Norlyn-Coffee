import type {
  Block,
  BlockDataMap,
  BlockType,
  L10n,
  Media,
  PageDoc,
  Theme,
  ThemePresetKey,
} from "./types";
import { ANIMS, BLOCK_TYPES } from "./types";

type Palette = Pick<Theme, "bg" | "surface" | "text" | "muted" | "accent" | "accent2">;

/** Colour presets — "custom" keeps whatever the editor picked. */
export const THEME_PRESETS: Record<Exclude<ThemePresetKey, "custom">, Palette> = {
  espresso: { bg: "#110c09", surface: "#1c140f", text: "#f5ede2", muted: "#ac9a87", accent: "#cda452", accent2: "#eacb8c" },
  crema: { bg: "#f3ece2", surface: "#fffaf3", text: "#2b1d16", muted: "#7a6556", accent: "#a97c37", accent2: "#d89a4e" },
  "noir-gold": { bg: "#070707", surface: "#141414", text: "#f7f3ea", muted: "#9a948a", accent: "#e8c580", accent2: "#a97c37" },
  midnight: { bg: "#0b1020", surface: "#141b31", text: "#eef1fb", muted: "#9aa3c0", accent: "#8fb3ff", accent2: "#e8c580" },
  pistachio: { bg: "#0f1610", surface: "#18221a", text: "#eef3e8", muted: "#a2b09b", accent: "#9fca6d", accent2: "#e8c580" },
  caramel: { bg: "#1a0f08", surface: "#28170d", text: "#fbefe3", muted: "#c3a38a", accent: "#e08a3c", accent2: "#f3c58e" },
};

export const DEFAULT_THEME: Theme = {
  preset: "espresso",
  ...THEME_PRESETS.espresso,
  font: "display",
  radius: 24,
  grain: true,
  glow: true,
  bgFx: "beans",
  anim: "fade-up",
  speed: "normal",
  stagger: true,
  scrollProgress: true,
  cursorGlow: true,
  stickyBar: true,
};

const t = (fr: string, ar = "", en = ""): L10n => ({ fr, ar, en });
const img = (url: string): Media => ({ kind: "image", url });

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** What a freshly added block contains — never empty, so it previews well. */
export function defaultData<K extends BlockType>(type: K): BlockDataMap[K] {
  const map: { [P in BlockType]: BlockDataMap[P] } = {
    hero: {
      layout: "split",
      media: [img("/images/life/range-table-lg.webp")],
      mediaFx: "float",
      eyebrow: t("Offre spéciale", "عرض خاص", "Special offer"),
      title: t("Votre titre ici", "عنوانك هنا", "Your headline here"),
      subtitle: t("Une phrase qui donne envie.", "جملة تثير الرغبة.", "One line that makes them want it."),
      badge: t("", "", ""),
      cta: t("Commander maintenant", "اطلب الآن", "Order now"),
      ctaTarget: "checkout",
      cta2: t("", "", ""),
      cta2Target: "price",
      titleFx: "kinetic",
      showPrice: true,
    },
    countdown: {
      mode: "evergreen",
      until: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 16),
      hours: 24,
      style: "flip",
      title: t("L'offre se termine dans", "ينتهي العرض خلال", "The offer ends in"),
      subtitle: t("", "", ""),
      expired: t("L'offre est terminée.", "انتهى العرض.", "This offer has ended."),
      hideWhenExpired: false,
    },
    gallery: {
      title: t("", "", ""),
      layout: "mosaic",
      items: [
        img("/images/life/box-open-lg.webp"),
        img("/images/life/espresso-glass-lg.webp"),
        img("/images/life/beans-capsules-lg.webp"),
        img("/images/life/range-fan-lg.webp"),
      ],
      hover: "zoom",
      columns: 3,
      aspect: "auto",
    },
    video: {
      title: t("", "", ""),
      media: { kind: "video", url: "/videos/espresso.mp4", poster: "/images/life/espresso-glass-lg.webp" },
      frame: "rounded",
      autoplay: true,
      loop: true,
      controls: false,
      caption: t("", "", ""),
    },
    features: {
      title: t("Pourquoi vous allez l'adorer", "لماذا ستحبه", "Why you'll love it"),
      subtitle: t("", "", ""),
      items: [
        { icon: "leaf", title: t("100 % bio", "100% عضوي", "100% organic"), text: t("Grains naturels, 0 % sucre.", "حبوب طبيعية، 0% سكر.", "Natural beans, 0% sugar.") },
        { icon: "shield", title: t("Aluminium pur", "ألمنيوم نقي", "Pure aluminium"), text: t("Aucun produit chimique.", "بدون مواد كيميائية.", "No chemicals.") },
        { icon: "truck", title: t("69 wilayas", "69 ولاية", "69 wilayas"), text: t("Payé à la livraison.", "الدفع عند الاستلام.", "Cash on delivery.") },
      ],
      style: "cards",
      columns: 3,
    },
    story: {
      media: img("/images/life/pour-machine-lg.webp"),
      mediaFx: "parallax",
      side: "start",
      eyebrow: t("L'histoire", "القصة", "The story"),
      title: t("Un titre pour votre histoire", "عنوان لقصتك", "A headline for your story"),
      text: t("Racontez ce qui rend cette offre unique.", "احكِ ما يجعل هذا العرض مميزاً.", "Tell what makes this offer unique."),
      quote: t("", "", ""),
    },
    contents: {
      title: t("Dans la boîte", "داخل العلبة", "In the box"),
      subtitle: t("", "", ""),
      style: "grid",
      showPrices: true,
    },
    price: {
      title: t("Votre prix", "سعرك", "Your price"),
      style: "card",
      showBreakdown: true,
      showTiers: true,
      showSavings: true,
      showQuantity: true,
      cta: t("Je commande", "أطلب", "I'm ordering"),
      ctaTarget: "checkout",
      note: t("Paiement à la livraison — 69 wilayas", "الدفع عند الاستلام — 69 ولاية", "Cash on delivery — 69 wilayas"),
    },
    stats: {
      title: t("", "", ""),
      items: [
        { value: 69, label: t("wilayas livrées", "ولاية", "wilayas served") },
        { value: 100, suffix: " %", label: t("bio", "عضوي", "organic") },
        { value: 10, label: t("capsules par boîte", "كبسولات في العلبة", "capsules per box") },
      ],
      style: "cards",
    },
    testimonials: {
      title: t("Ils en parlent", "قالوا عنه", "What they say"),
      items: [
        { name: "Amina B.", rating: 5, text: t("Le café Moriva a changé mes matins !", "قهوة موريفا غيرت صباحاتي!", "Moriva changed my mornings!") },
        { name: "Yacine K.", rating: 5, text: t("Intense et sans amertume.", "قوية وبدون مرارة.", "Intense, never bitter.") },
      ],
      style: "cards",
    },
    faq: {
      title: t("Questions fréquentes", "أسئلة شائعة", "FAQ"),
      items: [
        {
          q: t("Comment je paie ?", "كيف أدفع؟", "How do I pay?"),
          a: t("En espèces, à la livraison.", "نقداً عند الاستلام.", "Cash, on delivery."),
        },
        {
          q: t("En combien de temps je suis livré ?", "متى يصلني الطلب؟", "How fast is delivery?"),
          a: t("24 à 72 h selon la wilaya.", "من 24 إلى 72 ساعة حسب الولاية.", "24 to 72 h depending on the wilaya."),
        },
      ],
      style: "accordion",
    },
    marquee: {
      items: [t("100 % bio", "100% عضوي", "100% organic"), t("Payé à la livraison", "الدفع عند الاستلام", "Cash on delivery"), t("69 wilayas", "69 ولاية", "69 wilayas")],
      speed: 28,
      reverse: false,
      style: "outline",
      size: "lg",
      separator: "bean",
      skew: false,
    },
    text: {
      eyebrow: t("", "", ""),
      title: t("Un titre", "عنوان", "A heading"),
      body: t("Votre texte. Une ligne vide sépare les paragraphes.", "نصك هنا.", "Your text. A blank line starts a new paragraph."),
      size: "md",
    },
    cta: {
      title: t("Prêt à goûter ?", "مستعد للتذوق؟", "Ready to taste it?"),
      text: t("Commandez en 30 secondes, payez à la livraison.", "اطلب في 30 ثانية وادفع عند الاستلام.", "Order in 30 seconds, pay on delivery."),
      button: t("Commander", "اطلب", "Order"),
      target: "checkout",
      style: "glow",
    },
    checkout: {
      title: t("Commandez maintenant", "اطلب الآن", "Order now"),
      subtitle: t("Livraison partout en Algérie — payez à la réception.", "توصيل لكل الولايات — ادفع عند الاستلام.", "Delivery all over Algeria — pay on arrival."),
      style: "split",
      showSummary: true,
    },
    offers: {
      eyebrow: t("Nos offres", "عروضنا", "Our offers"),
      title: t("Choisissez votre offre", "اختر عرضك", "Choose your offer"),
      subtitle: t("Plus vous prenez, moins vous payez — livraison offerte.", "كلما أخذت أكثر دفعت أقل — التوصيل مجاني.", "The more you take, the less you pay — free delivery."),
      items: [],
      preselect: "",
      style: "cards",
      unitLabel: t("unité", "وحدة", "unit"),
      showPerUnit: true,
      savings: "first",
      cta: t("Commander cette offre", "اطلب هذا العرض", "Order this offer"),
      ctaTarget: "checkout",
    },
    divider: { style: "beans", size: "md" },
    image: {
      media: img("/images/life/range-capsules-lg.webp"),
      caption: t("", "", ""),
      fx: "parallax",
      rounded: true,
      height: "auto",
    },
  };
  return structuredClone(map[type]) as BlockDataMap[K];
}

export function createBlock<K extends BlockType>(type: K): Block {
  return {
    id: newId(),
    type,
    visible: true,
    anim: "inherit",
    delay: 0,
    tone: type === "marquee" ? "accent" : "none",
    pad: type === "divider" || type === "marquee" ? "sm" : "lg",
    width: type === "hero" || type === "marquee" ? "full" : "normal",
    align: type === "hero" || type === "cta" || type === "countdown" || type === "offers" ? "center" : "start",
    hideOn: "none",
    data: defaultData(type),
  } as Block;
}

// ------------------------------------------------------------- normalising
const HEX = /^#[0-9a-f]{3,8}$/i;
type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

/** A URL the page may load: same-origin path or https only (no javascript:, data:). */
export function safeUrl(url: unknown): string {
  return typeof url === "string" && /^(https:\/\/|\/)/.test(url.trim()) ? url.trim() : "";
}

function mergeData<T>(defaults: T, raw: unknown): T {
  if (!isObj(raw)) return defaults;
  const out = { ...(defaults as Json) };
  for (const [key, value] of Object.entries(raw)) {
    // optional fields absent from the defaults (toneImage, a CTA's media…)
    if (!(key in out)) {
      if (typeof value === "string" || isObj(value)) out[key] = value;
      continue;
    }
    const def = out[key];
    if (Array.isArray(def)) {
      if (Array.isArray(value)) out[key] = value;
    } else if (isObj(def)) {
      if (isObj(value)) out[key] = { ...def, ...value };
    } else if (typeof def === typeof value) {
      out[key] = value;
    }
  }
  return out as T;
}

export function normalizeTheme(raw: unknown): Theme {
  const theme = mergeData(DEFAULT_THEME, raw);
  for (const key of ["bg", "surface", "text", "muted", "accent", "accent2"] as const) {
    if (!HEX.test(theme[key])) theme[key] = DEFAULT_THEME[key];
  }
  theme.radius = Math.max(0, Math.min(48, Number(theme.radius) || 0));
  if (!ANIMS.includes(theme.anim)) theme.anim = DEFAULT_THEME.anim;
  return theme;
}

export function normalizePage(raw: unknown): PageDoc {
  const doc = isObj(raw) ? raw : {};
  const blocks: Block[] = [];
  if (Array.isArray(doc.blocks)) {
    for (const entry of doc.blocks) {
      if (!isObj(entry) || !BLOCK_TYPES.includes(entry.type as BlockType)) continue;
      const base = createBlock(entry.type as BlockType);
      const merged = mergeData(base, entry) as Block;
      merged.data = mergeData(defaultData(merged.type), entry.data) as never;
      merged.delay = Math.max(0, Math.min(2, Number(merged.delay) || 0));
      if (typeof merged.id !== "string" || !merged.id) merged.id = newId();
      blocks.push(merged);
    }
  }
  return { version: 1, theme: normalizeTheme(doc.theme), blocks };
}

/** Starter document for a new pack page. */
export function starterPackPage(): PageDoc {
  return {
    version: 1,
    theme: { ...DEFAULT_THEME },
    blocks: [
      createBlock("hero"),
      createBlock("countdown"),
      createBlock("contents"),
      createBlock("price"),
      createBlock("features"),
      createBlock("faq"),
      createBlock("checkout"),
    ],
  };
}

/** Starter document for a product's personalised page. */
export function starterProductPage(): PageDoc {
  return {
    version: 1,
    theme: { ...DEFAULT_THEME },
    blocks: [
      createBlock("hero"),
      createBlock("marquee"),
      createBlock("features"),
      createBlock("gallery"),
      createBlock("story"),
      createBlock("price"),
      createBlock("checkout"),
    ],
  };
}

export function pick(text: L10n | undefined, lang: "fr" | "ar" | "en"): string {
  if (!text) return "";
  return (text[lang] ?? "").trim() || (text.fr ?? "").trim();
}
