import { Camera } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSiteImages } from "@/hooks/useSiteContent";
import { IMAGE_SLOTS } from "@/lib/imageSlots";
import { pickLang } from "@/lib/localized";
import { cn } from "@/lib/utils";

/**
 * A designed hole in the layout. The slot's aspect ratio is reserved whether or
 * not a photo exists, so filling one from /admin/content never reflows the page
 * — and an empty slot reads as an intentional frame, not a broken image.
 */
export function ImageSlot({
  slot,
  className,
  imgClassName,
  ratio,
  priority,
  rounded = "rounded-3xl",
}: {
  slot: string;
  className?: string;
  imgClassName?: string;
  /** overrides the ratio declared in lib/imageSlots.ts */
  ratio?: string;
  priority?: boolean;
  rounded?: string;
}) {
  const { t, lang } = useLanguage();
  const { data: images } = useSiteImages();

  const definition = IMAGE_SLOTS.find((entry) => entry.slot === slot);
  const row = images?.[slot];
  const aspect = ratio ?? definition?.ratio ?? "4/3";
  const alt = pickLang(lang, row?.alt_fr, row?.alt_ar) ?? "";

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-line/70 bg-panel-2/60",
        rounded,
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      {row ? (
        <img
          src={row.url}
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
      {row && (
        <span
          className={cn("pointer-events-none absolute inset-0 border border-brand/20", rounded)}
          aria-hidden
        />
      )}
    </div>
  );
}
