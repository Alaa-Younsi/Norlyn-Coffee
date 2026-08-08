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
 * `alt_fr`/`alt_ar`/`alt_en` describe that shipped photo. A row in
 * `site_images` brings its own alt text and replaces all three.
 */
export interface ImageSlotDef {
  slot: string;
  label_fr: string;
  label_ar: string;
  label_en: string;
  /** width/height ratio the design reserves — keeps the placeholder honest */
  ratio: string;
  group: "about" | "contact" | "home" | "blog";
  /** the photograph shipped in this slot, shown until a row overrides it */
  fallback: Media;
  alt_fr: string;
  alt_ar: string;
  alt_en: string;
}

export const IMAGE_SLOTS: ImageSlotDef[] = [
  /* ------------------------------------------------------------ home page */
  {
    slot: "home.gallery.1",
    label_fr: "Accueil — galerie 1",
    label_ar: "الرئيسية — معرض 1",
    label_en: "Home — gallery 1",
    ratio: "4/5",
    group: "home",
    fallback: MEDIA.life.espressoGlass,
    alt_fr: "Un espresso Moriva servi en verre",
    alt_ar: "إسبريسو موريفا في كأس زجاجي",
    alt_en: "A Moriva espresso served in a glass",
  },
  {
    slot: "home.gallery.2",
    label_fr: "Accueil — galerie 2",
    label_ar: "الرئيسية — معرض 2",
    label_en: "Home — gallery 2",
    ratio: "4/5",
    group: "home",
    fallback: MEDIA.life.rangeCapsules,
    alt_fr: "La gamme Moriva et ses capsules",
    alt_ar: "تشكيلة موريفا وكبسولاتها",
    alt_en: "The Moriva range and its capsules",
  },
  {
    slot: "home.gallery.3",
    label_fr: "Accueil — galerie 3",
    label_ar: "الرئيسية — معرض 3",
    label_en: "Home — gallery 3",
    ratio: "4/5",
    group: "home",
    fallback: MEDIA.life.aluminiumMacro,
    alt_fr: "Boîte Moriva — capsules aluminium",
    alt_ar: "علبة موريفا — كبسولات ألمنيوم",
    alt_en: "A Moriva box — aluminium capsules",
  },

  /* --------------------------------------------------------- about page */
  {
    slot: "about.hero",
    label_fr: "À propos — image principale",
    label_ar: "من نحن — الصورة الرئيسية",
    label_en: "About — main image",
    ratio: "3/4",
    group: "about",
    fallback: MEDIA.life.rangeFan,
    alt_fr: "Les quatre intensités Moriva",
    alt_ar: "درجات القوة الأربع من موريفا",
    alt_en: "The four Moriva intensities",
  },
  {
    slot: "about.promise",
    label_fr: "À propos — la promesse bio (grande bande)",
    label_ar: "من نحن — وعد البيو (الشريط الكبير)",
    label_en: "About — the organic promise (wide band)",
    ratio: "4/3",
    group: "about",
    fallback: MEDIA.life.aluminiumMacro,
    alt_fr: "Boîte Moriva — capsules en aluminium",
    alt_ar: "علبة موريفا — كبسولات ألمنيوم",
    alt_en: "A Moriva box — aluminium capsules",
  },
  {
    slot: "about.story.1",
    label_fr: "À propos — notre histoire, grande photo",
    label_ar: "من نحن — قصتنا، الصورة الكبيرة",
    label_en: "About — our story, large photo",
    ratio: "3/4",
    group: "about",
    fallback: MEDIA.life.packBlackTable,
    alt_fr: "Une boîte Moriva de 10 capsules",
    alt_ar: "علبة موريفا من 10 كبسولات",
    alt_en: "A Moriva box of 10 capsules",
  },
  {
    slot: "about.story.2",
    label_fr: "À propos — notre histoire, petite photo 1",
    label_ar: "من نحن — قصتنا، صورة صغيرة 1",
    label_en: "About — our story, small photo 1",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.rangeTable,
    alt_fr: "La gamme Moriva au complet",
    alt_ar: "تشكيلة موريفا كاملة",
    alt_en: "The full Moriva range",
  },
  {
    slot: "about.story.3",
    label_fr: "À propos — notre histoire, petite photo 2",
    label_ar: "من نحن — قصتنا، صورة صغيرة 2",
    label_en: "About — our story, small photo 2",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.espressoGlass,
    alt_fr: "Un espresso Moriva servi en verre",
    alt_ar: "إسبريسو موريفا في كأس زجاجي",
    alt_en: "A Moriva espresso served in a glass",
  },
  {
    slot: "about.origin",
    label_fr: "À propos — origine des grains",
    label_ar: "من نحن — أصل الحبوب",
    label_en: "About — bean origin",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.beansCapsules,
    alt_fr: "Grains de café et capsules Moriva",
    alt_ar: "حبوب القهوة وكبسولات موريفا",
    alt_en: "Coffee beans and Moriva capsules",
  },
  {
    slot: "about.roastery",
    label_fr: "À propos — torréfaction",
    label_ar: "من نحن — التحميص",
    label_en: "About — roasting",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.packBrownTable,
    alt_fr: "Boîte Moriva Brun",
    alt_ar: "علبة موريفا البني",
    alt_en: "The Moriva Brun box",
  },
  {
    slot: "about.packaging",
    label_fr: "À propos — dosage",
    label_ar: "من نحن — الجرعة",
    label_en: "About — dosing",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.rangeTable,
    alt_fr: "La gamme complète sur l'établi",
    alt_ar: "التشكيلة الكاملة على الطاولة",
    alt_en: "The full range on the bench",
  },
  {
    slot: "about.sealing",
    label_fr: "À propos — scellage",
    label_ar: "من نحن — الختم",
    label_en: "About — sealing",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.life.packGreenTable,
    alt_fr: "Boîte Moriva Vert scellée",
    alt_ar: "علبة موريفا الأخضر مختومة",
    alt_en: "A sealed Moriva Vert box",
  },
  {
    slot: "about.fleet.1",
    label_fr: "À propos — camionnette, grande photo",
    label_ar: "من نحن — الشاحنة، الصورة الكبيرة",
    label_en: "About — van, large photo",
    ratio: "3/2",
    group: "about",
    fallback: MEDIA.fleet.vanSide,
    alt_fr: "Camionnette de livraison Moriva",
    alt_ar: "شاحنة توصيل موريفا",
    alt_en: "A Moriva delivery van",
  },
  {
    slot: "about.fleet.2",
    label_fr: "À propos — camionnette, petite photo 1",
    label_ar: "من نحن — الشاحنة، صورة صغيرة 1",
    label_en: "About — van, small photo 1",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.fleet.vansYard,
    alt_fr: "Les camionnettes Moriva avant la tournée",
    alt_ar: "شاحنات موريفا قبل الجولة",
    alt_en: "The Moriva vans before the round",
  },
  {
    slot: "about.fleet.3",
    label_fr: "À propos — camionnette, petite photo 2",
    label_ar: "من نحن — الشاحنة، صورة صغيرة 2",
    label_en: "About — van, small photo 2",
    ratio: "1/1",
    group: "about",
    fallback: MEDIA.fleet.vanRear,
    alt_fr: "Camionnette Moriva vue de l'arrière",
    alt_ar: "شاحنة موريفا من الخلف",
    alt_en: "A Moriva van seen from the rear",
  },
  {
    slot: "about.retail",
    label_fr: "À propos — en rayon",
    label_ar: "من نحن — في الرفوف",
    label_en: "About — on the shelf",
    ratio: "16/10",
    group: "about",
    fallback: MEDIA.life.retailAisle,
    alt_fr: "Les boîtes Moriva en rayon",
    alt_ar: "علب موريفا على الرفوف",
    alt_en: "Moriva boxes on the shelf",
  },
  {
    slot: "about.machines",
    label_fr: "À propos — machines à espresso",
    label_ar: "من نحن — آلات الإسبريسو",
    label_en: "About — espresso machines",
    ratio: "16/10",
    group: "about",
    fallback: MEDIA.machine.branded,
    alt_fr: "Machine à espresso Norlyn aux couleurs Moriva",
    alt_ar: "آلة إسبريسو نورلين بألوان موريفا",
    alt_en: "A Norlyn espresso machine in Moriva colours",
  },
  {
    slot: "about.team",
    label_fr: "À propos — l'équipe",
    label_ar: "من نحن — الفريق",
    label_en: "About — the team",
    ratio: "16/9",
    group: "about",
    fallback: MEDIA.fleet.vansYard,
    alt_fr: "Les camionnettes Moriva avant la tournée",
    alt_ar: "شاحنات موريفا قبل الجولة",
    alt_en: "The Moriva vans before the round",
  },

  /* --------------------------------------------------------------- blog */
  // shown when the Journal has no articles yet, and as the lead article's
  // cover when that article was published without one
  {
    slot: "blog.hero",
    label_fr: "Journal — visuel de secours",
    label_ar: "المجلة — صورة احتياطية",
    label_en: "Journal — fallback visual",
    ratio: "16/9",
    group: "blog",
    fallback: MEDIA.life.retailFacing,
    alt_fr: "Moriva en rayon",
    alt_ar: "موريفا في رفوف المتاجر",
    alt_en: "Moriva on the shelf",
  },

  /* ------------------------------------------------------------ contact */
  {
    slot: "contact.side",
    label_fr: "Contact — visuel",
    label_ar: "اتصل بنا — الصورة",
    label_en: "Contact — visual",
    ratio: "4/3",
    group: "contact",
    fallback: MEDIA.fleet.vanSide,
    alt_fr: "Camionnette de livraison Moriva",
    alt_ar: "شاحنة توصيل موريفا",
    alt_en: "A Moriva delivery van",
  },
];

/** the definition behind a slot key, for the components that render one */
export function imageSlot(slot: string): ImageSlotDef | undefined {
  return IMAGE_SLOTS.find((entry) => entry.slot === slot);
}

export const IMAGE_SLOT_GROUPS: Array<{
  key: ImageSlotDef["group"];
  label_fr: string;
  label_ar: string;
  label_en: string;
}> = [
  { key: "home", label_fr: "Page d'accueil", label_ar: "الصفحة الرئيسية", label_en: "Home page" },
  { key: "about", label_fr: "À propos", label_ar: "من نحن", label_en: "About" },
  { key: "blog", label_fr: "Journal", label_ar: "المجلة", label_en: "Journal" },
  { key: "contact", label_fr: "Contact", label_ar: "اتصل بنا", label_en: "Contact" },
];
