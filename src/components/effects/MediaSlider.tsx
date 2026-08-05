import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useMediaSlides } from "@/hooks/useSiteContent";
import { useMediaFlags } from "@/hooks/useMediaFlags";
import { pickLang } from "@/lib/localized";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 60;

/**
 * The hero's right-hand column: the client's photos and videos, ordered from
 * /admin/content. Empty is a first-class state — it renders a designed frame,
 * never a broken image.
 */
export function MediaSlider({ className }: { className?: string }) {
  const { t, lang, dir } = useLanguage();
  const { data: slides } = useMediaSlides("hero");
  const { reducedMotion: reduced } = useMediaFlags();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides?.length ?? 0;

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setIndex((prev) => (prev + delta + count) % count);
    },
    [count],
  );

  // derived, not an effect: wraps cleanly if the client deletes a slide while
  // the page is open, without a second render pass
  const safeIndex = count > 0 ? index % count : 0;

  useEffect(() => {
    if (count < 2 || paused || reduced) return;
    const timer = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reduced, go]);

  const active = slides?.[safeIndex];

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* the frame itself is the design: a gold-hairline card floating on the
          cream, tilted just enough to feel hand-placed */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-brand/25 bg-panel-2/70 shadow-[0_40px_90px_-40px_rgb(var(--c-ink)/0.45)]">
        {count === 0 ? (
          <EmptyFrame />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={active?.id ?? safeIndex}
              className="absolute inset-0"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              drag={count > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              style={{ touchAction: "pan-y" }}
              onDragEnd={(_, info) => {
                // physical left-swipe means "next" in both directions
                const offset = dir === "rtl" ? -info.offset.x : info.offset.x;
                if (offset < -SWIPE_THRESHOLD) go(1);
                else if (offset > SWIPE_THRESHOLD) go(-1);
              }}
            >
              {active?.kind === "video" ? (
                <video
                  src={active.url}
                  poster={active.poster_url ?? undefined}
                  className="h-full w-full object-cover"
                  // bytes move only on an actual play
                  preload="none"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={active?.url}
                  alt={pickLang(lang, active?.title_fr, active?.title_ar) ?? ""}
                  className="h-full w-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  draggable={false}
                />
              )}

              {(active?.title_fr || active?.title_ar) && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent p-5 pt-16 text-start">
                  <p className="font-display text-lg text-cream">
                    {pickLang(lang, active.title_fr, active.title_ar)}
                  </p>
                  {(active.subtitle_fr || active.subtitle_ar) && (
                    <p className="mt-0.5 text-sm text-cream/80">
                      {pickLang(lang, active.subtitle_fr, active.subtitle_ar)}
                    </p>
                  )}
                </div>
              )}

              {active?.kind === "video" && (
                <span className="pointer-events-none absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink/50 text-cream backdrop-blur">
                  <Play size={15} fill="currentColor" />
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {count > 1 && (
        <>
          <SliderButton side="start" label={t("hero.mediaPrev")} onClick={() => go(-1)}>
            {dir === "rtl" ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </SliderButton>
          <SliderButton side="end" label={t("hero.mediaNext")} onClick={() => go(1)}>
            {dir === "rtl" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </SliderButton>

          <div className="mt-4 flex items-center justify-center gap-2">
            {(slides ?? []).map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setIndex(i)}
                aria-label={`${t("hero.mediaGoTo")} ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all cursor-pointer",
                  i === safeIndex ? "w-7 bg-brand" : "w-1.5 bg-brand/30 hover:bg-brand/60",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SliderButton({
  side,
  label,
  onClick,
  children,
}: {
  side: "start" | "end";
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand/30 bg-panel/85 text-ink shadow-lg backdrop-blur transition-colors cursor-pointer hover:border-brand hover:text-brand",
        side === "start" ? "-start-4" : "-end-4",
      )}
    >
      {children}
    </button>
  );
}

function EmptyFrame() {
  const { t } = useLanguage();
  return (
    <div className="fx-slot-empty flex h-full w-full flex-col items-center justify-center gap-3 border border-dashed border-brand/35 px-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-brand/45 bg-panel/70 text-brand">
        <Camera size={22} strokeWidth={1.5} />
      </span>
      <p className="font-display text-lg text-ink/80">{t("hero.mediaEmpty")}</p>
      <p className="max-w-[16rem] text-xs text-muted">{t("hero.mediaEmptyHint")}</p>
    </div>
  );
}
