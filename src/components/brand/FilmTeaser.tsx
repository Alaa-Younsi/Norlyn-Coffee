import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";
import { HeroVideo } from "@/components/effects/HeroVideo";
import { useLanguage } from "@/i18n/LanguageProvider";
import { lockScroll, unlockScroll } from "@/lib/lenis";

/**
 * The brand film as a small framed teaser — a moving postage-stamp of the
 * loop with "Le film" beside it — that opens full screen on click. It used to
 * be a big card competing with the cup for the hero; now the cup owns the
 * hero and the film is one deliberate click away.
 */
export function FilmTeaser() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  // On touch screens the thumbnail is a still play-plate: a second video
  // decoding next to the 3D cup is what a phone cannot spare while scrolling.
  // The film itself still plays full screen when opened.
  const [liveThumb] = useState(() => window.matchMedia("(pointer: fine)").matches);

  useEffect(() => {
    if (!open) return;
    lockScroll();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex cursor-pointer items-center gap-4 text-start"
        aria-haspopup="dialog"
      >
        <span className="relative block w-16 shrink-0 overflow-hidden rounded-xl sm:w-[4.5rem]">
          {liveThumb ? (
            <HeroVideo className="pointer-events-none [&_.fx-screen-glow]:hidden" />
          ) : (
            <span aria-hidden className="block aspect-[4/5] rounded-xl border border-brand/30 bg-[radial-gradient(circle_at_50%_40%,rgb(var(--c-brand)/0.35),rgb(var(--c-panel-2)))]" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-shade/30 transition-colors group-hover:bg-shade/10">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-on-shade/90 text-shade transition-transform duration-500 group-hover:scale-110">
              <Play size={13} className="ms-0.5 fill-current" />
            </span>
          </span>
        </span>
        <span>
          <span className="block font-display text-lg italic leading-tight text-ink">{t("hero.film")}</span>
          <span className="mt-0.5 block text-xs text-muted">{t("hero.filmHint")}</span>
        </span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t("hero.film")}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-shade/92 p-6 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                className="w-[min(88vw,calc(82vh*0.8))]"
                initial={{ scale: 0.92, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
              >
                <HeroVideo />
              </motion.div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute end-6 top-6 cursor-pointer rounded-full border border-on-shade/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-on-shade"
              >
                {t("nav.close")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
