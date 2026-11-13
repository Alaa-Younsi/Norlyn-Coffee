import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { dbSize, dbSrcSet } from "@/lib/media";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  key: string;
  url: string;
  alt?: string | null;
}

/** how far a finger has to travel before a drag counts as a swipe, in px */
const SWIPE_THRESHOLD = 60;
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The product's pictures, swipeable (the dz-cod-store Gallery pattern).
 *
 * Stateless: the page owns `activeIndex`, so the stage, the thumbnails and
 * anything else that wants to know which shot is showing read one value.
 *
 * - drag the picture sideways (touch or mouse) to go to the next / previous
 *   one; `touch-action: pan-y` keeps a vertical drag scrolling the page;
 * - the direction flips in RTL, where "next" sits to the left;
 * - arrows on pointer-fine screens, dots on phones, thumbnails under both;
 * - reduced motion: a plain swap, no slide.
 *
 * `stage` renders inside the frame (the pool of light, the steam) so the
 * picture can slide across it without the frame moving.
 */
export function Gallery({
  images,
  activeIndex,
  onActiveChange,
  name,
  stage,
  className,
}: {
  images: GalleryImage[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
  name: string;
  stage?: ReactNode;
  className?: string;
}) {
  const { lang } = useLanguage();
  const reduced = useReducedMotion();
  const rtl = lang === "ar";
  const count = images.length;
  const current = images[Math.min(activeIndex, count - 1)];
  const many = count > 1;

  const go = (step: number) => {
    if (!many) return;
    onActiveChange((activeIndex + step + count) % count);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const dx = info.offset.x;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    // a leftward drag pulls the next picture in — mirrored in RTL
    const forward = rtl ? dx > 0 : dx < 0;
    go(forward ? 1 : -1);
  };

  // which way the outgoing shot leaves, for the slide
  const shift = reduced ? 0 : 60;

  return (
    <div className={className}>
      <div
        data-tilt="5"
        className="group/gal relative aspect-square overflow-hidden rounded-[2.25rem] bg-panel-2/50 lg:aspect-auto lg:h-[calc(100svh-12.5rem)]"
        role="region"
        aria-roledescription="carousel"
        aria-label={name}
      >
        {stage}
        {current && (
          <motion.div
            className={cn("absolute inset-0 touch-pan-y", many && "cursor-grab active:cursor-grabbing")}
            drag={many ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            dragSnapToOrigin
            onDragEnd={onDragEnd}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={current.key}
                initial={{ x: shift, scale: 0.96, opacity: 0 }}
                animate={{ x: 0, scale: 1, opacity: 1 }}
                exit={{ x: -shift, scale: 0.96, opacity: 0 }}
                transition={{ duration: reduced ? 0.15 : 0.45, ease: EASE }}
                src={current.url}
                srcSet={dbSrcSet(current.url)}
                sizes="(min-width: 1024px) 50vw, 90vw"
                alt={current.alt ?? name}
                width={1000}
                height={1000}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable={false}
                // every product shot is re-framed at build time to the same
                // margin (scripts/optimize-images.mjs) — no CSS re-scaling
                className="fx-float pointer-events-none absolute inset-[6%] h-[88%] w-[88%] select-none object-contain drop-shadow-[0_35px_35px_rgb(0_0_0/0.4)]"
              />
            </AnimatePresence>
          </motion.div>
        )}

        {many && (
          <>
            {/* arrows: mouse screens only, shown on hover */}
            {(["prev", "next"] as const).map((which) => (
              <button
                key={which}
                type="button"
                onClick={() => go(which === "next" ? 1 : -1)}
                aria-label={`${name} — ${which === "next" ? "→" : "←"}`}
                className={cn(
                  "absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-bg/70 text-ink opacity-0 backdrop-blur transition-opacity duration-300 group-hover/gal:opacity-100 focus-visible:opacity-100 [@media(pointer:fine)]:flex",
                  which === "prev" ? "start-4" : "end-4",
                )}
              >
                {which === "prev" ? (
                  <ChevronLeft size={18} className="rtl:rotate-180" />
                ) : (
                  <ChevronRight size={18} className="rtl:rotate-180" />
                )}
              </button>
            ))}
            {/* dots: where you are, and a hint that there is more */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-hidden>
              {images.map((img, i) => (
                <span
                  key={img.key}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    i === activeIndex ? "w-6 bg-gold-hi" : "w-1.5 bg-ink/25",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {many && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
          {images.map((img, i) => (
            <button
              key={img.key}
              type="button"
              onClick={() => onActiveChange(i)}
              aria-label={`${name} — ${i + 1}`}
              aria-current={i === activeIndex ? "true" : undefined}
              className={cn(
                "h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-2xl border bg-panel-2/40 p-1.5 transition-colors",
                i === activeIndex ? "border-brand" : "border-line hover:border-ink/30",
              )}
            >
              <img
                src={dbSize(img.url, "sm")}
                alt=""
                width={80}
                height={80}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
