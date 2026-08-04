/**
 * Named image slots the DESIGN declares and the client fills from
 * /admin/content. Every slot renders a designed placeholder until a row exists
 * in `site_images`, so a missing photo can never break a layout.
 *
 * Adding a slot: add it here, drop an <ImageSlot slot="…" /> in the page. No
 * migration needed — `site_images` is keyed by this string.
 */
export interface ImageSlotDef {
  slot: string;
  label_fr: string;
  label_ar: string;
  /** width/height ratio the design reserves — keeps the placeholder honest */
  ratio: string;
  group: "about" | "contact" | "home" | "blog";
}

export const IMAGE_SLOTS: ImageSlotDef[] = [
  { slot: "home.gallery.1", label_fr: "Accueil — galerie 1", label_ar: "الرئيسية — معرض 1", ratio: "4/5", group: "home" },
  { slot: "home.gallery.2", label_fr: "Accueil — galerie 2", label_ar: "الرئيسية — معرض 2", ratio: "4/5", group: "home" },
  { slot: "home.gallery.3", label_fr: "Accueil — galerie 3", label_ar: "الرئيسية — معرض 3", ratio: "4/5", group: "home" },

  { slot: "about.hero", label_fr: "À propos — image principale", label_ar: "من نحن — الصورة الرئيسية", ratio: "3/4", group: "about" },
  { slot: "about.origin", label_fr: "À propos — origine des grains", label_ar: "من نحن — أصل الحبوب", ratio: "1/1", group: "about" },
  { slot: "about.roastery", label_fr: "À propos — torréfaction", label_ar: "من نحن — التحميص", ratio: "1/1", group: "about" },
  { slot: "about.packaging", label_fr: "À propos — dosage", label_ar: "من نحن — الجرعة", ratio: "1/1", group: "about" },
  { slot: "about.sealing", label_fr: "À propos — scellage", label_ar: "من نحن — الختم", ratio: "1/1", group: "about" },
  { slot: "about.team", label_fr: "À propos — l'équipe", label_ar: "من نحن — الفريق", ratio: "16/9", group: "about" },

  { slot: "blog.hero", label_fr: "Journal — bannière", label_ar: "المجلة — الغلاف", ratio: "16/9", group: "blog" },

  { slot: "contact.side", label_fr: "Contact — visuel", label_ar: "اتصل بنا — الصورة", ratio: "3/4", group: "contact" },
];

export const IMAGE_SLOT_GROUPS: Array<{ key: ImageSlotDef["group"]; label_fr: string; label_ar: string }> = [
  { key: "home", label_fr: "Page d'accueil", label_ar: "الصفحة الرئيسية" },
  { key: "about", label_fr: "À propos", label_ar: "من نحن" },
  { key: "blog", label_fr: "Journal", label_ar: "المجلة" },
  { key: "contact", label_fr: "Contact", label_ar: "اتصل بنا" },
];
