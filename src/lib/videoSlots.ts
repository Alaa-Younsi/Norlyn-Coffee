import { mediaSrc, MEDIA, type Media } from "@/lib/media";

/**
 * Named FILM slots — the video counterpart of `lib/imageSlots.ts`, and the same
 * bargain: the design declares the frame, the client fills it from
 * Admin → Contenu & médias, and a slot that nobody has touched still shows
 * something finished.
 *
 * Three sources answer "what plays here?", checked in this order:
 *
 *   1. a `site_videos` row — what the client uploaded. This is the one they
 *      will actually use, and it needs no deploy.
 *   2. `fallbackSrc` — a file committed to `public/videos/`. Dropping the film
 *      in at that exact path makes it appear on the next build, which is how
 *      the FIRST film usually lands (the client sends a file, we commit it).
 *   3. `fallbackPoster` — a real photograph, shown on its own for as long as
 *      neither of the above exists. A `<video>` pointed at a file that isn't
 *      there is a broken black box; a still of espresso pulling is a finished
 *      page, so "not shot yet" costs the design nothing.
 *
 * Adding a slot needs no migration — `site_videos` is keyed by this string.
 */
export interface VideoSlotDef {
  slot: string;
  label_fr: string;
  label_ar: string;
  label_en: string;
  /** where on the site this film plays, for the admin card */
  hint_fr: string;
  hint_ar: string;
  hint_en: string;
  /** the frame the design reserves — the admin preview matches the storefront */
  ratio: string;
  /** committed drop-in path, used until a row overrides it */
  fallbackSrc: string;
  /** the still behind the film, and the whole screen when there is no film */
  fallbackPoster: Media;
}

/** The hero's video screen, end-side column of the landing page. */
export const HERO_VIDEO_SLOT = "home.hero";
/** The espresso loop beside the buy form on every product page. */
export const PRODUCT_VIDEO_SLOT = "product.loop";

export const VIDEO_SLOTS: VideoSlotDef[] = [
  {
    slot: HERO_VIDEO_SLOT,
    label_fr: "Accueil — film du hero",
    label_ar: "الرئيسية — فيديو الواجهة",
    label_en: "Home — hero film",
    hint_fr: "L'écran vertical à côté du titre, en haut de la page d'accueil.",
    hint_ar: "الشاشة العمودية بجانب العنوان في أعلى الصفحة الرئيسية.",
    hint_en: "The vertical screen beside the title at the top of the home page.",
    ratio: "4/5",
    fallbackSrc: "/videos/hero.mp4",
    fallbackPoster: MEDIA.life.espressoGlass,
  },
  {
    slot: PRODUCT_VIDEO_SLOT,
    label_fr: "Produit — vidéo standard",
    label_ar: "المنتج — الفيديو الموحّد",
    label_en: "Product — standard video",
    hint_fr: "La même boucle sur TOUTES les fiches produit, à côté du formulaire.",
    hint_ar: "نفس المقطع في كل صفحات المنتجات، بجانب نموذج الطلب.",
    hint_en: "The same loop on EVERY product page, beside the order form.",
    ratio: "4/3",
    fallbackSrc: "/videos/espresso.mp4",
    fallbackPoster: MEDIA.life.espressoGlass,
  },
];

export function videoSlot(slot: string): VideoSlotDef | undefined {
  return VIDEO_SLOTS.find((entry) => entry.slot === slot);
}

/** What the definition alone resolves to — the drop-in film and its still. */
export function videoSlotFallback(definition: VideoSlotDef): {
  src: string;
  poster: string;
} {
  return { src: definition.fallbackSrc, poster: mediaSrc(definition.fallbackPoster) };
}
