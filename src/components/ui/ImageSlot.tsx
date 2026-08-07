import { Camera } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSiteImages } from "@/hooks/useSiteContent";
import { imageSlot } from "@/lib/imageSlots";
import { dbSrcSet, mediaSrc, mediaSrcSet } from "@/lib/media";
import { pickLang } from "@/lib/localized";
import { cn } from "@/lib/utils";

/**
 * A managed picture: the design owns the frame, the client owns what is in it.
 *
 * Three states, in order of preference:
 *   1. a `site_images` row — what the client uploaded from /admin/content;
 *   2. the photograph the slot's definition ships (`fallback`), which is why
 *      putting a picture in a slot is never a downgrade — the page looks the
 *      same until someone deliberately changes it;
 *   3. the dashed camera plate, for a slot declared with no photo at all.
 *
 * The aspect ratio is reserved in every one of them, so filling a slot never
 * reflows the page.
 */
export function ImageSlot({
  slot,
  className,
  imgClassName,
  ratio,
  priority,
  sizes = "100vw",
  rounded = "rounded-3xl",
  flat = false,
  fill = false,
}: {
  slot: string;
  className?: string;
  imgClassName?: string;
  /** overrides the ratio declared in lib/imageSlots.ts */
  ratio?: string;
  priority?: boolean;
  /** the CSS width this slot occupies — without it the browser assumes 100vw */
  sizes?: string;
  rounded?: string;
  /** inside a Panel, the frame's own border and rounding would double up */
  flat?: boolean;
  /** fill the positioned parent instead of imposing a ratio box of its own */
  fill?: boolean;
}) {
  const { t, lang } = useLanguage();
  const { data: images } = useSiteImages();

  const definition = imageSlot(slot);
  const row = images?.[slot];
  const aspect = ratio ?? definition?.ratio ?? "4/3";

  // an uploaded row brings its own alt; the shipped photo brings the one its
  // definition describes it with
  const alt = row
    ? (pickLang(lang, row.alt_fr, row.alt_ar) ?? "")
    : (pickLang(lang, definition?.alt_fr, definition?.alt_ar) ?? "");

  const src = row?.url ?? (definition ? mediaSrc(definition.fallback) : null);
  // a Storage upload is a single file with no renditions; the shipped photo has
  // the full sm/md/lg set that lib/media.ts knows how to advertise
  const srcSet = row
    ? dbSrcSet(row.url)
    : definition
      ? mediaSrcSet(definition.fallback)
      : undefined;

  return (
    <div
      className={cn(
        // `fill` REPLACES the positioning rather than adding to it. Listing
        // "relative" and "absolute" together does not resolve by class order —
        // both are the same specificity, so whichever Tailwind emits later in
        // the stylesheet wins, which is `relative`. The box then has no height
        // and the picture disappears behind the scrim.
        fill ? "absolute inset-0 h-full w-full overflow-hidden" : "relative overflow-hidden",
        !flat && "border border-line/70 bg-panel-2/60",
        !flat && rounded,
        className,
      )}
      style={fill ? undefined : { aspectRatio: aspect }}
    >
      {src ? (
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : (
        <div
          className={cn(
            "fx-slot-empty flex h-full w-full flex-col items-center justify-center gap-2.5 border border-dashed border-brand/35",
            rounded,
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand/45 bg-panel/70 text-brand">
            <Camera size={18} strokeWidth={1.6} />
          </span>
          <span className="text-[11px] uppercase tracking-[0.25em] text-brand/75">
            {t("media.placeholder")}
          </span>
        </div>
      )}
      {/* gold hairline frame, the site-wide picture motif */}
      {src && !flat && (
        <span
          className={cn("pointer-events-none absolute inset-0 border border-brand/20", rounded)}
          aria-hidden
        />
      )}
    </div>
  );
}
