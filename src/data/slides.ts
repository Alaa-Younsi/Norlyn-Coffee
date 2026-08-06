import { mediaSrc, MEDIA } from "@/lib/media";
import type { MediaSlide } from "@/types/db";

/**
 * Mirror of the hero slides seeded by supabase/migrations/0009 — shown when
 * Supabase isn't configured so the hero is designed against real photography
 * rather than its empty frame. The client re-orders, replaces or deletes them
 * in Admin → Contenu & médias; once they do, the database wins.
 */
const now = "2026-01-01T00:00:00Z";

const slide = (
  index: number,
  url: string,
  title_fr: string,
  title_ar: string,
  subtitle_fr: string,
  subtitle_ar: string,
  link_url: string,
): MediaSlide => ({
  id: `fb-slide-${index}`,
  kind: "image",
  url,
  poster_url: null,
  title_fr,
  title_ar,
  subtitle_fr,
  subtitle_ar,
  link_url,
  placement: "hero",
  sort_order: index,
  active: true,
  created_at: now,
  updated_at: now,
});

export const FALLBACK_HERO_SLIDES: MediaSlide[] = [
  slide(
    0,
    mediaSrc(MEDIA.life.rangeFan),
    "Quatre intensités",
    "أربع درجات قوة",
    "100 % bio, 0 % sucre",
    "100٪ بيو، 0٪ سكر",
    "/shop",
  ),
  slide(
    1,
    mediaSrc(MEDIA.life.espressoGlass),
    "Une crema dense et dorée",
    "كريما ذهبية كثيفة",
    "Le résultat d'un dosage pesé au dixième de gramme",
    "نتيجة جرعة موزونة بعُشر الغرام",
    "/journal/comment-naissent-nos-capsules",
  ),
  slide(
    2,
    mediaSrc(MEDIA.pack.hazelnutDuo),
    "Les capsules aromatisées",
    "الكبسولات بالنكهات",
    "Noisette, vanille, caramel, chocolat",
    "بندق، فانيليا، كراميل، شوكولاتة",
    "/shop",
  ),
  slide(
    3,
    mediaSrc(MEDIA.fleet.vansLoading),
    "Livrées dans les 58 wilayas",
    "توصيل إلى 58 ولاية",
    "Paiement à la livraison",
    "الدفع عند الاستلام",
    "/journal/de-l-atelier-a-votre-porte",
  ),
];
