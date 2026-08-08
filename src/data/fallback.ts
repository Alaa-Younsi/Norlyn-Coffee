import { mediaSrc, MEDIA } from "@/lib/media";
import type { Category, Product } from "@/types/db";

/**
 * Local mirror of the supabase/migrations/0009 seed — served by the data hooks
 * whenever VITE_SUPABASE_* is absent, so the storefront renders (and the 3D
 * landing can be designed/tested) before the project is wired up. Ordering
 * still requires a real Supabase project.
 *
 * The real Moriva line: two families of four. The bio espressos are graded by
 * intensity (Noir → Or, robusta-heavy down to arabica-heavy); the flavoured
 * capsules are graded by aroma, not strength. Prices here are the seed's
 * placeholders — the client sets the real ones in Admin → Produits.
 */

const BIO = "fallback-espresso-bio";
const FLAVOURS = "fallback-capsules-aromatisees";
const now = "2026-01-01T00:00:00Z";

export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: BIO,
    slug: "espresso-bio",
    name_fr: "Espresso 100 % bio",
    name_ar: "إسبريسو 100٪ بيو",
    name_en: "Espresso, 100 % organic",
    description_fr:
      "Quatre intensités, du plus corsé au plus aromatique. Sans sucre, sans additifs, en aluminium alimentaire pur.",
    description_ar:
      "أربع درجات قوة، من الأقوى إلى الأكثر عطراً. بدون سكر، بدون إضافات، بألمنيوم غذائي خالص.",
    description_en:
      "Four intensities, from the boldest to the most aromatic. No sugar, no additives, sealed in pure food-grade aluminium.",
    image_url: mediaSrc(MEDIA.pack.black),
    sort_order: 0,
    created_at: now,
  },
  {
    id: FLAVOURS,
    slug: "capsules-aromatisees",
    name_fr: "Capsules aromatisées",
    name_ar: "كبسولات بالنكهات",
    name_en: "Flavoured capsules",
    description_fr:
      "Le même espresso, quatre arômes gourmands : noisette, vanille, caramel et chocolat.",
    description_ar: "نفس الإسبريسو بأربع نكهات: البندق، الفانيليا، الكراميل والشوكولاتة.",
    description_en:
      "The same espresso, four indulgent aromas: hazelnut, vanilla, caramel and chocolate.",
    image_url: mediaSrc(MEDIA.pack.hazelnut),
    sort_order: 1,
    created_at: now,
  },
];

const BIO_DETAILS_FR = [
  "100 % bio — grains naturels, 0 % sucre",
  "Capsule en aluminium alimentaire pur, 0 % produit chimique",
  "Fabriquée en Algérie par des experts certifiés",
  "Boîte de 10 capsules",
  "Compatible Nespresso®",
];
const BIO_DETAILS_AR = [
  "100٪ بيو — حبوب طبيعية، 0٪ سكر",
  "كبسولة من ألمنيوم غذائي خالص، 0٪ مواد كيميائية",
  "مصنوعة في الجزائر على يد خبراء معتمدين",
  "علبة من 10 كبسولات",
  "متوافقة مع نسبريسو®",
];
const BIO_DETAILS_EN = [
  "100 % organic — natural beans, 0 % sugar",
  "Pure food-grade aluminium capsule, 0 % chemicals",
  "Made in Algeria by certified experts",
  "Box of 10 capsules",
  "Nespresso®-compatible",
];
const FLAVOUR_DETAILS_FR = [
  "Espresso aromatisé, 0 % sucre ajouté",
  "Capsule en aluminium alimentaire pur, 0 % produit chimique",
  "Fabriquée en Algérie par des experts certifiés",
  "Boîte de 10 capsules",
  "Compatible Nespresso®",
];
const FLAVOUR_DETAILS_AR = [
  "إسبريسو بنكهة، 0٪ سكر مضاف",
  "كبسولة من ألمنيوم غذائي خالص، 0٪ مواد كيميائية",
  "مصنوعة في الجزائر على يد خبراء معتمدين",
  "علبة من 10 كبسولات",
  "متوافقة مع نسبريسو®",
];

const FLAVOUR_DETAILS_EN = [
  "Flavoured espresso, 0 % added sugar",
  "Pure food-grade aluminium capsule, 0 % chemicals",
  "Made in Algeria by certified experts",
  "Box of 10 capsules",
  "Nespresso®-compatible",
];

interface Seed {
  key: keyof typeof MEDIA.capsule;
  slug: string;
  category: string;
  name_fr: string;
  name_ar: string;
  name_en: string;
  description_fr: string;
  description_ar: string;
  description_en: string;
  price: number;
  intensity: number;
  dosage: string;
  accent_color: string;
  pack: keyof typeof MEDIA.pack;
}

const SEEDS: Seed[] = [
  {
    key: "black",
    slug: "moriva-noir",
    category: BIO,
    name_fr: "Moriva Noir",
    name_ar: "موريفا الأسود",
    name_en: "Moriva Noir",
    description_fr:
      "Notre intensité maximale. Robusta dominant, corps épais, crema sombre — le café de ceux qui aiment être réveillés.",
    description_ar:
      "أقصى درجات القوة لدينا. روبوستا غالبة، قوام كثيف وكريما داكنة — قهوة من يحبّون الاستيقاظ فعلاً.",
    description_en:
      "Our highest intensity. Robusta-led, thick-bodied, dark crema — coffee for people who like to be woken up.",
    price: 850,
    intensity: 100,
    dosage: "6,0 g",
    accent_color: "#2A211C",
    pack: "black",
  },
  {
    key: "brown",
    slug: "moriva-brun",
    category: BIO,
    name_fr: "Moriva Brun",
    name_ar: "موريفا البني",
    name_en: "Moriva Brun",
    description_fr:
      "Un cran en dessous du Noir : rond, chocolaté, long en bouche. L'intensité sans l'amertume.",
    description_ar: "درجة أقل من الأسود: ناعم، بنكهة الكاكاو ونهاية طويلة. قوة بلا مرارة.",
    description_en:
      "One step below the Noir: round, chocolatey, long on the palate. The intensity without the bitterness.",
    price: 820,
    intensity: 85,
    dosage: "5,6 g",
    accent_color: "#7A4A22",
    pack: "brown",
  },
  {
    key: "green",
    slug: "moriva-vert",
    category: BIO,
    name_fr: "Moriva Vert",
    name_ar: "موريفا الأخضر",
    name_en: "Moriva Vert",
    description_fr:
      "L'équilibre exact entre force et douceur. Arabica et robusta en harmonie — l'espresso de tous les jours.",
    description_ar:
      "التوازن التام بين القوة والنعومة. أرابيكا وروبوستا في انسجام — إسبريسو كل يوم.",
    description_en:
      "The exact balance between strength and softness. Arabica and robusta in harmony — the everyday espresso.",
    price: 820,
    intensity: 62,
    dosage: "5,4 g",
    accent_color: "#0E7A5F",
    pack: "green",
  },
  {
    key: "gold",
    slug: "moriva-or",
    category: BIO,
    name_fr: "Moriva Or",
    name_ar: "موريفا الذهبي",
    name_en: "Moriva Or",
    description_fr:
      "Notre plus haute qualité. Arabica dominant, intensité basse, aromatique et florale — ici, c'est le goût qui commande.",
    description_ar:
      "أرقى ما لدينا. أرابيكا غالبة، قوة منخفضة، عطرية وزهرية — هنا الطعم هو سيّد الموقف.",
    description_en:
      "Our finest quality. Arabica-led, low intensity, aromatic and floral — here it is the flavour that leads.",
    price: 950,
    intensity: 38,
    dosage: "5,2 g",
    accent_color: "#B8891F",
    pack: "gold",
  },
  {
    key: "hazelnut",
    slug: "moriva-noisette",
    category: FLAVOURS,
    name_fr: "Moriva Noisette",
    name_ar: "موريفا بالبندق",
    name_en: "Moriva Noisette",
    description_fr:
      "L'espresso Moriva rehaussé d'un arôme de noisette grillée, gourmand sans être sucré.",
    description_ar: "إسبريسو موريفا بلمسة من البندق المحمّص، شهيّ دون أن يكون حلواً.",
    description_en:
      "The Moriva espresso lifted by roasted hazelnut, indulgent without being sweet.",
    price: 900,
    intensity: 54,
    dosage: "5,5 g",
    accent_color: "#A62F51",
    pack: "hazelnut",
  },
  {
    key: "vanilla",
    slug: "moriva-vanille",
    category: FLAVOURS,
    name_fr: "Moriva Vanille",
    name_ar: "موريفا بالفانيليا",
    name_en: "Moriva Vanille",
    description_fr: "Un espresso doux et crémeux, parfumé à la vanille — le plus rond de la gamme.",
    description_ar: "إسبريسو ناعم وكريمي بعطر الفانيليا — الأنعم في التشكيلة.",
    description_en:
      "A soft, creamy espresso scented with vanilla — the roundest cup in the range.",
    price: 900,
    intensity: 46,
    dosage: "5,5 g",
    accent_color: "#5E75A6",
    pack: "vanilla",
  },
  {
    key: "caramel",
    slug: "moriva-caramel",
    category: FLAVOURS,
    name_fr: "Moriva Caramel",
    name_ar: "موريفا بالكراميل",
    name_en: "Moriva Caramel",
    description_fr:
      "Caramel beurré et café serré : la finale sucrée-salée qui accompagne le mieux un dessert.",
    description_ar: "كراميل بالزبدة وقهوة مركّزة: نهاية حلوة تليق بالحلويات.",
    description_en:
      "Buttered caramel and a tight shot: the sweet-salt finish that goes best with dessert.",
    price: 900,
    intensity: 46,
    dosage: "5,5 g",
    accent_color: "#A8557E",
    pack: "caramel",
  },
  {
    key: "chocolate",
    slug: "moriva-chocolat",
    category: FLAVOURS,
    name_fr: "Moriva Chocolat",
    name_ar: "موريفا بالشوكولاتة",
    name_en: "Moriva Chocolat",
    description_fr:
      "Cacao intense et café corsé — le plus puissant de nos arômes, presque un moka.",
    description_ar: "كاكاو غنيّ وقهوة قوية — أقوى نكهاتنا، أقرب إلى الموكا.",
    description_en:
      "Deep cocoa and a bold shot — the most powerful of our aromas, almost a mocha.",
    price: 900,
    intensity: 62,
    dosage: "5,5 g",
    accent_color: "#8E4147",
    pack: "chocolate",
  },
];

export const FALLBACK_PRODUCTS: Product[] = SEEDS.map((seed) => {
  const bio = seed.category === BIO;
  const id = `fb-${seed.key}`;
  return {
    id,
    slug: seed.slug,
    name_fr: seed.name_fr,
    name_ar: seed.name_ar,
    name_en: seed.name_en,
    description_fr: seed.description_fr,
    description_ar: seed.description_ar,
    description_en: seed.description_en,
    details_fr: bio ? BIO_DETAILS_FR : FLAVOUR_DETAILS_FR,
    details_ar: bio ? BIO_DETAILS_AR : FLAVOUR_DETAILS_AR,
    details_en: bio ? BIO_DETAILS_EN : FLAVOUR_DETAILS_EN,
    price: seed.price,
    compare_at_price: null,
    category_id: seed.category,
    stock: 100,
    style_code: null,
    intensity: seed.intensity,
    dosage: seed.dosage,
    accent_color: seed.accent_color,
    colors: [],
    sizes: [],
    video_url: null,
    // the landing showcases the four bio intensities; the flavours live in the
    // shop grid, so only the bio family is flagged featured
    featured: bio,
    status: "active",
    created_at: now,
    updated_at: now,
    product_images: [
      {
        id: `${id}-capsule`,
        product_id: id,
        url: mediaSrc(MEDIA.capsule[seed.key]),
        alt: seed.name_fr,
        sort_order: 0,
      },
      {
        id: `${id}-pack`,
        product_id: id,
        url: mediaSrc(MEDIA.pack[seed.pack]),
        alt: `${seed.name_fr} — boîte de 10 capsules`,
        sort_order: 1,
      },
    ],
  };
});
