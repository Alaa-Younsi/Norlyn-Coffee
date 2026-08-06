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
    description_fr:
      "Quatre intensités, du plus corsé au plus aromatique. Sans sucre, sans additifs, en aluminium alimentaire pur.",
    description_ar:
      "أربع درجات قوة، من الأقوى إلى الأكثر عطراً. بدون سكر، بدون إضافات، بألمنيوم غذائي خالص.",
    image_url: mediaSrc(MEDIA.pack.black),
    sort_order: 0,
    created_at: now,
  },
  {
    id: FLAVOURS,
    slug: "capsules-aromatisees",
    name_fr: "Capsules aromatisées",
    name_ar: "كبسولات بالنكهات",
    description_fr:
      "Le même espresso, quatre arômes gourmands : noisette, vanille, caramel et chocolat.",
    description_ar: "نفس الإسبريسو بأربع نكهات: البندق، الفانيليا، الكراميل والشوكولاتة.",
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

interface Seed {
  key: keyof typeof MEDIA.capsule;
  slug: string;
  category: string;
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
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
    description_fr:
      "Notre intensité maximale. Robusta dominant, corps épais, crema sombre — le café de ceux qui aiment être réveillés.",
    description_ar:
      "أقصى درجات القوة لدينا. روبوستا غالبة، قوام كثيف وكريما داكنة — قهوة من يحبّون الاستيقاظ فعلاً.",
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
    description_fr:
      "Un cran en dessous du Noir : rond, chocolaté, long en bouche. L'intensité sans l'amertume.",
    description_ar: "درجة أقل من الأسود: ناعم، بنكهة الكاكاو ونهاية طويلة. قوة بلا مرارة.",
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
    description_fr:
      "L'équilibre exact entre force et douceur. Arabica et robusta en harmonie — l'espresso de tous les jours.",
    description_ar:
      "التوازن التام بين القوة والنعومة. أرابيكا وروبوستا في انسجام — إسبريسو كل يوم.",
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
    description_fr:
      "Notre plus haute qualité. Arabica dominant, intensité basse, aromatique et florale — ici, c'est le goût qui commande.",
    description_ar:
      "أرقى ما لدينا. أرابيكا غالبة، قوة منخفضة، عطرية وزهرية — هنا الطعم هو سيّد الموقف.",
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
    description_fr:
      "L'espresso Moriva rehaussé d'un arôme de noisette grillée, gourmand sans être sucré.",
    description_ar: "إسبريسو موريفا بلمسة من البندق المحمّص، شهيّ دون أن يكون حلواً.",
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
    description_fr: "Un espresso doux et crémeux, parfumé à la vanille — le plus rond de la gamme.",
    description_ar: "إسبريسو ناعم وكريمي بعطر الفانيليا — الأنعم في التشكيلة.",
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
    description_fr:
      "Caramel beurré et café serré : la finale sucrée-salée qui accompagne le mieux un dessert.",
    description_ar: "كراميل بالزبدة وقهوة مركّزة: نهاية حلوة تليق بالحلويات.",
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
    description_fr:
      "Cacao intense et café corsé — le plus puissant de nos arômes, presque un moka.",
    description_ar: "كاكاو غنيّ وقهوة قوية — أقوى نكهاتنا، أقرب إلى الموكا.",
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
    description_fr: seed.description_fr,
    description_ar: seed.description_ar,
    details_fr: bio ? BIO_DETAILS_FR : FLAVOUR_DETAILS_FR,
    details_ar: bio ? BIO_DETAILS_AR : FLAVOUR_DETAILS_AR,
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
