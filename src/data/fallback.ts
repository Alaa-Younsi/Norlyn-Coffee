import type { Category, Product } from "@/types/db";

/**
 * Local mirror of the supabase/migrations/0001_init.sql seed — served by the
 * data hooks whenever VITE_SUPABASE_* is absent, so the storefront renders
 * (and the 3D landing can be designed/tested) before the project is wired up.
 * Ordering (checkout/admin) still requires a real Supabase project.
 */

const CATEGORY_ID = "fallback-capsules";
const now = "2026-01-01T00:00:00Z";

export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: CATEGORY_ID,
    slug: "capsules-espresso",
    name_fr: "Capsules Espresso",
    name_ar: "كبسولات إسبريسو",
    description_fr: "Capsules espresso Moriva, compatibles Nespresso.",
    description_ar: "كبسولات إسبريسو موريفا متوافقة مع نسبريسو.",
    image_url: null,
    sort_order: 0,
    created_at: now,
  },
];

function capsule(
  id: string,
  slug: string,
  imageSlug: string,
  fields: Pick<
    Product,
    | "name_fr"
    | "name_ar"
    | "description_fr"
    | "description_ar"
    | "details_fr"
    | "details_ar"
    | "price"
    | "intensity"
    | "dosage"
    | "accent_color"
  >,
): Product {
  return {
    id,
    slug,
    ...fields,
    compare_at_price: null,
    category_id: CATEGORY_ID,
    stock: 100,
    style_code: null,
    colors: [],
    sizes: [],
    video_url: null,
    featured: true,
    status: "active",
    created_at: now,
    updated_at: now,
    product_images: [
      {
        id: `${id}-img`,
        product_id: id,
        url: `/images/capsules/${imageSlug}-lg.webp`,
        alt: fields.name_fr,
        sort_order: 0,
      },
    ],
  };
}

export const FALLBACK_PRODUCTS: Product[] = [
  capsule("fb-espresso-intenso", "moriva-espresso-intenso", "espresso-intenso", {
    name_fr: "Moriva Espresso Intenso",
    name_ar: "موريفا إسبريسو إنتنسو",
    description_fr: "Puissant et corsé, notes de cacao amer et de bois torréfié.",
    description_ar: "قوي وغني، بنكهات الكاكاو المر والخشب المحمص.",
    details_fr: ["Intensité 9/12", "Dosage 5,6 g par capsule", "Boîte de 10 capsules", "Compatible Nespresso®"],
    details_ar: ["شدة 9/12", "جرعة 5.6 غ لكل كبسولة", "علبة من 10 كبسولات", "متوافقة مع نسبريسو®"],
    price: 850,
    intensity: 75,
    dosage: "5,6 g",
    accent_color: "#7B3A2A",
  }),
  capsule("fb-ristretto-noir", "moriva-ristretto-noir", "ristretto-noir", {
    name_fr: "Moriva Ristretto Noir",
    name_ar: "موريفا ريستريتو نوار",
    description_fr: "Ultra-concentré, caractère affirmé et finale longue.",
    description_ar: "مركّز جداً، بطابع قوي ونهاية طويلة.",
    details_fr: ["Intensité 12/12", "Dosage 6,0 g par capsule", "Boîte de 10 capsules", "Compatible Nespresso®"],
    details_ar: ["شدة 12/12", "جرعة 6.0 غ لكل كبسولة", "علبة من 10 كبسولات", "متوافقة مع نسبريسو®"],
    price: 950,
    intensity: 100,
    dosage: "6,0 g",
    accent_color: "#1A1A1A",
  }),
  capsule("fb-lungo-dore", "moriva-lungo-dore", "lungo-dore", {
    name_fr: "Moriva Lungo Doré",
    name_ar: "موريفا لونغو دوريه",
    description_fr: "Doux et équilibré, arômes floraux et miel d'acacia.",
    description_ar: "ناعم ومتوازن، بروائح زهرية وعسل الأكاسيا.",
    details_fr: ["Intensité 6/12", "Dosage 5,2 g par capsule", "Boîte de 10 capsules", "Compatible Nespresso®"],
    details_ar: ["شدة 6/12", "جرعة 5.2 غ لكل كبسولة", "علبة من 10 كبسولات", "متوافقة مع نسبريسو®"],
    price: 800,
    intensity: 50,
    dosage: "5,2 g",
    accent_color: "#C9A84C",
  }),
  capsule("fb-decaf-verde", "moriva-decaf-verde", "decaf-verde", {
    name_fr: "Moriva Decaf Verde",
    name_ar: "موريفا ديكاف فيردي",
    description_fr: "Sans caféine, légèreté garantie et saveur préservée.",
    description_ar: "خالٍ من الكافيين، خفيف مع الحفاظ على النكهة.",
    details_fr: [
      "Intensité 4/12",
      "Dosage 5,4 g par capsule",
      "Sans caféine",
      "Boîte de 10 capsules",
      "Compatible Nespresso®",
    ],
    details_ar: ["شدة 4/12", "جرعة 5.4 غ لكل كبسولة", "خالٍ من الكافيين", "علبة من 10 كبسولات", "متوافقة مع نسبريسو®"],
    price: 880,
    intensity: 33,
    dosage: "5,4 g",
    accent_color: "#2D6A4F",
  }),
];
