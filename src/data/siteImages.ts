import { mediaSrc, MEDIA } from "@/lib/media";
import type { SiteImage } from "@/types/db";

/**
 * Mirror of the `site_images` rows seeded by supabase/migrations/0009, so the
 * named slots are filled with real photography when Supabase isn't configured.
 * The client replaces any of them from Admin → Contenu & médias; a database
 * row always wins over this file.
 */
const now = "2026-01-01T00:00:00Z";

const image = (slot: string, url: string, alt_fr: string, alt_ar: string): SiteImage => ({
  slot,
  url,
  alt_fr,
  alt_ar,
  updated_at: now,
});

export const FALLBACK_SITE_IMAGES: Record<string, SiteImage> = Object.fromEntries(
  [
    image(
      "home.gallery.1",
      mediaSrc(MEDIA.life.espressoGlass),
      "Un espresso Moriva servi en verre",
      "إسبريسو موريفا في كأس زجاجي",
    ),
    image(
      "home.gallery.2",
      mediaSrc(MEDIA.life.rangeCapsules),
      "La gamme Moriva et ses capsules",
      "تشكيلة موريفا وكبسولاتها",
    ),
    image(
      "home.gallery.3",
      mediaSrc(MEDIA.life.aluminiumMacro),
      "Boîte Moriva — capsules aluminium",
      "علبة موريفا — كبسولات ألمنيوم",
    ),
    image(
      "about.hero",
      mediaSrc(MEDIA.life.rangeFan),
      "Les quatre intensités Moriva",
      "درجات القوة الأربع من موريفا",
    ),
    image(
      "about.origin",
      mediaSrc(MEDIA.life.beansCapsules),
      "Grains de café et capsules Moriva",
      "حبوب القهوة وكبسولات موريفا",
    ),
    image(
      "about.roastery",
      mediaSrc(MEDIA.life.packBrownTable),
      "Boîte Moriva Brun",
      "علبة موريفا البني",
    ),
    image(
      "about.packaging",
      mediaSrc(MEDIA.life.rangeTable),
      "La gamme complète sur l'établi",
      "التشكيلة الكاملة على الطاولة",
    ),
    image(
      "about.sealing",
      mediaSrc(MEDIA.life.packGreenTable),
      "Boîte Moriva Vert scellée",
      "علبة موريفا الأخضر مختومة",
    ),
    image(
      "about.team",
      mediaSrc(MEDIA.fleet.vansYard),
      "Les camionnettes Moriva avant la tournée",
      "شاحنات موريفا قبل الجولة",
    ),
    image("blog.hero", mediaSrc(MEDIA.life.retailFacing), "Moriva en rayon", "موريفا في رفوف المتاجر"),
    image(
      "contact.side",
      mediaSrc(MEDIA.fleet.vanSide),
      "Camionnette de livraison Moriva",
      "شاحنة توصيل موريفا",
    ),
  ].map((row) => [row.slot, row]),
);
