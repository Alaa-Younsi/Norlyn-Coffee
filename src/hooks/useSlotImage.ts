import { useLanguage } from "@/i18n/LanguageProvider";
import { useSiteImages } from "@/hooks/useSiteContent";
import { imageSlot } from "@/lib/imageSlots";
import { dbSrcSet, mediaSrc, mediaSrcSet } from "@/lib/media";
import { pickLang } from "@/lib/localized";

/**
 * What a slot currently shows: the client's upload if there is one, else the
 * photograph its definition ships. Shared by <ImageSlot> and anything that
 * needs the picture without the frame (the sliced gallery reveal).
 */
export function useSlotImage(slot: string): {
  definition: ReturnType<typeof imageSlot>;
  src: string | null;
  srcSet: string | undefined;
  alt: string;
} {
  const { lang } = useLanguage();
  const { data: images } = useSiteImages();
  const definition = imageSlot(slot);
  const row = images?.[slot];
  // an uploaded row brings its own alt; the shipped photo brings the one its
  // definition describes it with
  const alt = row
    ? (pickLang(lang, row.alt_fr, row.alt_ar, row.alt_en) ?? "")
    : (pickLang(lang, definition?.alt_fr, definition?.alt_ar, definition?.alt_en) ?? "");
  const src = row?.url ?? (definition ? mediaSrc(definition.fallback) : null);
  // a Storage upload is a single file with no renditions; the shipped photo has
  // the full sm/md/lg set that lib/media.ts knows how to advertise
  const srcSet = row ? dbSrcSet(row.url) : definition ? mediaSrcSet(definition.fallback) : undefined;
  return { definition, src, srcSet, alt };
}
