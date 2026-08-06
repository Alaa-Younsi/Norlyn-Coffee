import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mascot } from "@/components/mascot/Mascot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ScrollTrigger } from "@/lib/gsap";
import { isMascotEmotion, REACTION_PALETTE, type MascotEmotion } from "@/lib/mascot";
import { useMascotStore } from "@/store/mascot";

/**
 * The mascot as a reaction track for the page.
 *
 * Two things drive its face, in priority order:
 *
 *  1. **A reaction** — something you just did (added a capsule, flipped the
 *     theme, tripped a form). `store/mascot.ts` holds it for a beat.
 *  2. **The section you are reading** — sections opt in with
 *     `data-mascot="<emotion>"`, the same declarative pattern as `data-reveal`
 *     / `data-parallax` / `data-act`.
 *
 * A reaction also forces the cup on screen, so an action taken above the first
 * tagged section still gets an answer.
 *
 * The cup itself is tappable and winks back; everything around it stays
 * `pointer-events-none` so the corner it sits in can never swallow a tap meant
 * for a CTA underneath.
 */
export function ScrollMascot({
  palette,
  /** bump when async content changes the page height (products landing, etc.) */
  refreshKey,
}: {
  palette: MascotEmotion[];
  refreshKey?: unknown;
}) {
  const { t } = useLanguage();
  const [emotion, setEmotion] = useState<MascotEmotion>(palette[0]);
  const [inRun, setInRun] = useState(false);
  const reaction = useMascotStore((state) => state.reaction);
  const react = useMascotStore((state) => state.react);

  // the reaction faces have to be mounted before they are needed, or the first
  // one of each kind cross-dissolves into a box that is still downloading
  const frames = useMemo(() => {
    const merged = new Set<MascotEmotion>([...palette, ...REACTION_PALETTE]);
    return Array.from(merged);
  }, [palette]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-mascot]"));
    if (sections.length === 0) return;

    const triggers = sections.map((section, index) => {
      const next = section.dataset.mascot;
      const face: MascotEmotion = isMascotEmotion(next) ? next : palette[0];
      const show = () => {
        setEmotion(face);
        setInRun(true);
      };
      return ScrollTrigger.create({
        trigger: section,
        // the section has to actually be the thing you are reading before the
        // cup answers it — a top-of-viewport line would react a screen early
        start: "top 65%",
        end: "bottom 35%",
        onEnter: show,
        onEnterBack: show,
        // withdraw at the two ends of the run, never in the gaps between
        onLeave: index === sections.length - 1 ? () => setInRun(false) : undefined,
        onLeaveBack: index === 0 ? () => setInRun(false) : undefined,
      });
    });

    return () => triggers.forEach((trigger) => trigger.kill());
  }, [palette, refreshKey]);

  const visible = inRun || reaction !== null;

  return (
    // end side, not start: body copy is set from the start edge on every page,
    // and a cup parked on top of a paragraph is a bug, not a mascot
    <div className="pointer-events-none fixed bottom-4 end-4 z-30 sm:bottom-6 sm:end-6">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* the gold puddle the cup stands in — ties it to the site's podium
                motif instead of leaving a sticker floating on the glass */}
            <span className="fx-podium absolute inset-x-1 bottom-0 h-5 blur-md" aria-hidden />
            <button
              type="button"
              onClick={() => react("wink")}
              aria-label={t("mascot.poke")}
              title={t("mascot.poke")}
              // the ONLY interactive pixel in this fixed layer
              className="pointer-events-auto block rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <Mascot
                emotion={reaction ?? emotion}
                palette={frames}
                size={96}
                sizeClassName="h-16 w-16 sm:h-24 sm:w-24"
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
