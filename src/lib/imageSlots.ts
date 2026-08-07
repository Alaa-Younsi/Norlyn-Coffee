import { MEDIA, type Media } from "@/lib/media";

/**
 * Named image slots the DESIGN declares and the client fills from
 * /admin/content. `site_images` is keyed by the `slot` string, so adding one
 * needs no migration: add it here, drop an <ImageSlot slot="…" /> in the page.
 *
 * Every slot names the photograph that SHIPS in it (`fallback`). That is what
 * makes this list safe to grow: a new slot renders its designed photo from the
 * first deploy, and the admin's upload is an override rather than a
 * prerequisite. Without it, converting a hardcoded picture into a slot would
 * blank it until someone happened to fill it — which is why most of the About
 * page was hardcoded and unmanageable in the first place.
 *
 * `alt_fr`/`alt_ar` describe that shipped photo. A row in `site_images` brings
 * its own alt text and replaces both.
 */
export interface ImageSlotDef {
  slot: string;
  label_fr: string;
  label_ar: string;
  /** width/height ratio the design reserves — keeps the placeholder honest */
  ratio: string;
  group: "about" | "contact" | "home" | "blog";
  /** the photograph shipped in this slot, shown until a row overrides it */
  fallback: Media;
  alt_fr: string;
  alt_ar: string;
}

export const IMAGE_SLOTS: ImageSlotDef[] = [
  /* ------------------------------------------------------------ home page */
  {
    slot: "home.gallery.1",
    label_fr: "Accueil — galerie 1",
    label_ar: "الرئيسية — معرض 1",
    ratio: "4/5",
    group: "home",
    fallback: MEDIA.life.espressoGlass,
    alt_fr: "Un espresso Moriva servi en verre",
    alt_ar: "إسبريسو موريفا في كأس زجاجي",
  },
  {
    slot: "home.gallery.2",
    label_fr: "Accueil — galerie 2",
    label_ar: "الرئيسية — معرض 2",
    ratio: "4/5",
    group: "home",
    fallback: MEDIA.life.rangeCapsules,
    alt_fr: "La gamme Moriva et ses capsules",
    alt_ar: "تشكيلة موريفا وكبسولاتها",
  },
  {
    slot: "home.gallery.3",
    label_fr: "Accueil — galerie 3",
    label_ar: "الرئيسية — معرض 3",
    ratio: "4/5",
    group: "home",
    fallback: MEDIA.life.aluminiumMacro,
    alt_fr: "Boîte Moriva — capsules aluminium",
    alt_ar: "علبة موريفا — كبسولات ألمنيوم",
  },

  /* --------------------------------------------------------- about page */
  {
    slot: "about.hero",
    label_fr: "À propos — image principale",
    label_ar: "من نحن — الصورة الرئيسية",
    ratio: "3/4",
    group: "about",
    fallback: MEDIA.life.rangeFan,
    alt_fr: "Les quatre intensités Moriva",
    alt_ar: "درجات القوة الأربع من موريفا",
  },
  {
    slot: "about.promise",
    label_fr: "À propos — la promesse bio (grande bande)",
    label_ar: "من نحن — وعد البيو (الشريط الكبير)",
    ratio: "4/3",
    group: "about",
    fallback: MEDIA.life.aluminiumMacro,
    alt_fr: "Boîte Moriva — capsules en aluminium",
    alt_ar: "علبة موريفا — كبسولات ألمنيوم",
  },
  {
    slot: "about.story.1",
    label_fr: "À propos — notre histoire, grande photo",
    label_ar: "من نحن — قصتنا، الصورة الكبيرة",
    ratio: "3/4",
    group: "about",
    fallback: MEDIA.life.packBlackTable,
    alt_fr: "Une boîte Moriva de 10 capsules",
    alt_ar: "علبة موريفا من 10 كبسولات",
  },
  {
    slot: "about.story.2",
    label_fr: "À propos — notre histoire, petite photo 1",
    label_ar: "من نحن — قصتنا، صورة صغيرة 1",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.rangeTable,
    alt_fr: "La gamme Moriva au complet",
    alt_ar: "تشكيلة موريفا كاملة",
  },
  {
    slot: "about.story.3",
    label_fr: "À propos — notre histoire, petite photo 2",
    label_ar: "من نحن — قصتنا، صورة صغيرة 2",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.espressoGlass,
    alt_fr: "Un espresso Moriva servi en verre",
    alt_ar: "إسبريسو موريفا في كأس زجاجي",
  },
  {
    slot: "about.origin",
    label_fr: "À propos — origine des grains",
    label_ar: "من نحن — أصل الحبوب",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.beansCapsules,
    alt_fr: "Grains de café et capsules Moriva",
    alt_ar: "حبوب القهوة وكبسولات موريفا",
  },
  {
    slot: "about.roastery",
    label_fr: "À propos — torréfaction",
    label_ar: "من نحن — التحميص",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.packBrownTable,
    alt_fr: "Boîte Moriva Brun",
    alt_ar: "علبة موريفا البني",
  },
  {
    slot: "about.packaging",
    label_fr: "À propos — dosage",
    label_ar: "من نحن — الجرعة",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.rangeTable,
    alt_fr: "La gamme complète sur l'établi",
    alt_ar: "التشكيلة الكاملة على الطاولة",
  },
  {
    slot: "about.sealing",
    label_fr: "À propos — scellage",
    label_ar: "من نحن — الختم",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.packGreenTable,
    alt_fr: "Boîte Moriva Vert scellée",
    alt_ar: "علبة موريفا الأخضر مختومة",
  },
  {
    slot: "about.fleet.1",
    label_fr: "À propos — camionnette, grande photo",
    label_ar: "من نحن — الشاحنة، الصورة الكبيرة",
    ratio: "3/2",
    group: "about",
    fallback: MEDIA.fleet.vanSide,
    alt_fr: "Camionnette de livraison Moriva",
    alt_ar: "شاحنة توصيل موريفا",
  },
  {
    slot: "about.fleet.2",
    label_fr: "À propos — camionnette, petite photo 1",
    label_ar: "من نحن — الشاحنة، صورة صغيرة 1",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.fleet.vansYard,
    alt_fr: "Les camionnettes Moriva avant la tournée",
    alt_ar: "شاحنات موريفا قبل الجولة",
  },
  {
    slot: "about.fleet.3",
    label_fr: "À propos — camionnette, petite photo 2",
    label_ar: "من نحن — الشاحنة، صورة صغيرة 2",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.fleet.vanRear,
    alt_fr: "Camionnette Moriva vue de l'arrière",
    alt_ar: "شاحنة موريفا من الخلف",
  },
  {
    slot: "about.retail",
    label_fr: "À propos — en rayon",
    label_ar: "من نحن — في الرفوف",
    ratio: "16/10",
    group: "about",
    fallback: MEDIA.life.retailAisle,
    alt_fr: "Les boîtes Moriva en rayon",
    alt_ar: "علب موريفا على الرفوف",
  },
  {
    slot: "about.machines",
    label_fr: "À propos — machines à espresso",
    label_ar: "من نحن — آلات الإسبريسو",
    ratio: "16/10",
    group: "about",
    fallback: MEDIA.machine.branded,
    alt_fr: "Machine à espresso Norlyn aux couleurs Moriva",
    alt_ar: "آلة إسبريسو نورلين بألوان موريفا",
  },
  {
    slot: "about.team",
    label_fr: "À propos — l'équipe",
    label_ar: "من نحن — الفريق",
    ratio: "16/9",
    group: "about",
    fallback: MEDIA.fleet.vansYard,
    alt_fr: "Les camionnettes Moriva avant la tournée",
    alt_ar: "شاحنات موريفا قبل الجولة",
  },

  /* --------------------------------------------------------------- blog */
  // shown when the Journal has no articles yet, and as the lead article's
  // cover when that article was published without one
  {
    slot: "blog.hero",
    label_fr: "Journal — visuel de secours",
    label_ar: "المجلة — صورة احتياطية",
    ratio: "16/9",
    group: "blog",
    fallback: MEDIA.life.retailFacing,
    alt_fr: "Moriva en rayon",
    alt_ar: "موريفا في رفوف المتاجر",
  },

  /* ------------------------------------------------------------ contact */
  {
    slot: "contact.side",
    label_fr: "Contact — visuel",
    label_ar: "اتصل بنا — الصورة",
    ratio: "4/3",
    group: "contact",
    fallback: MEDIA.fleet.vanSide,
    alt_fr: "Camionnette de livraison Moriva",
    alt_ar: "شاحنة توصيل موريفا",
  },
];

/** the definition behind a slot key, for the components that render one */
export function imageSlot(slot: string): ImageSlotDef | undefined {
  return IMAGE_SLOTS.find((entry) => entry.slot === slot);
}

export const IMAGE_SLOT_GROUPS: Array<{ key: ImageSlotDef["group"]; label_fr: string; label_ar: string }> = [
  { key: "home", label_fr: "Page d'accueil", label_ar: "الصفحة الرئيسية" },
  { key: "about", label_fr: "À propos", label_ar: "من نحن" },
  { key: "blog", label_fr: "Journal", label_ar: "المجلة" },
  { key: "contact", label_fr: "Contact", label_ar: "اتصل بنا" },
];
