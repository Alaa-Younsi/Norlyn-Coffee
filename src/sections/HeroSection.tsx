import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Steam } from "@/components/effects/Steam";
import { HeroFallback } from "@/components/effects/HeroFallback";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { FilmTeaser } from "@/components/brand/FilmTeaser";
import { KineticLine } from "@/components/brand/KineticLine";
import { RotatingBadge } from "@/components/brand/RotatingBadge";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useParallax } from "@/hooks/useScrollFX";
import { getLenisInstance } from "@/lib/lenis";
import { useSplashStore } from "@/store/splash";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The hero as a product shot, in three planes:
 *
 *   back   — HeroBackdrop (rendered by Landing, under the canvas): the Moriva
 *            mark enormous across the screen, condensing out of gold dust, and
 *            the warm light the cup stands in;
 *   middle — the 3D cup on the fixed canvas, floating in front of the mark;
 *   front  — this section: nothing over the cup but its steam, and a quiet
 *            band of copy along the bottom edge, set like the caption of a
 *            photograph — tagline on one side, the offer on the other, the
 *            scroll seal between them.
 *
 * Everything waits for the splash to lift, then arrives after the dust has
 * settled into the mark.
 */
export function HeroSection({ show3D, showArt }: { show3D: boolean; showArt: boolean }) {
  const { t } = useLanguage();
  const bandRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  useMagnetic(ctaRef, 0.3);
  // the caption band lifts away as the cup starts its journey
  useParallax(bandRef, 70);
  const splashOpen = useSplashStore((state) => state.open);
  const play = !splashOpen;

  const scrollToStory = () => {
    const target = document.getElementById("story");
    if (!target) return;
    const lenis = getLenisInstance();
    if (lenis) lenis.scrollTo(target);
    else target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-6 pb-8 pt-28 sm:pb-12"
    >
      <FloatingBeans count={6} seed={2} />

      {/* only the steam sits on top of the cup */}
      <div className="pointer-events-none absolute inset-x-0 top-[30%] flex justify-center sm:top-[28%]">
        {show3D ? (
          <Steam />
        ) : showArt ? (
          <div className="relative mt-16">
            <HeroFallback />
            <Steam className="absolute -top-16 start-1/2 -translate-x-1/2" />
          </div>
        ) : null}
      </div>

      <div
        ref={bandRef}
        className="relative mx-auto grid w-full max-w-7xl items-end gap-7 border-t border-line/60 pt-7 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-12 lg:pt-9"
      >
        {/* start: the tagline, glyph by glyph, then its gold swash */}
        <p className="relative max-w-md font-display text-[1.9rem] leading-[1.05] italic tracking-[-0.01em] text-ink sm:text-[2.4rem] lg:text-[2.9rem]">
          <KineticLine text={t("hero.title2")} play={play} delay={1.6} />
          <svg
            viewBox="0 0 320 24"
            preserveAspectRatio="none"
            aria-hidden
            className="pointer-events-none absolute -bottom-4 start-0 h-4 w-[min(100%,20rem)] text-brand rtl:-scale-x-100"
          >
            <motion.path
              d="M2 15 C 60 4, 120 22, 180 12 S 270 4, 318 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={play ? { pathLength: 1 } : undefined}
              transition={{ duration: 1.1, delay: 2.6, ease: [0.65, 0, 0.35, 1] }}
            />
          </svg>
        </p>

        {/* centre: the scroll seal, right under the cup */}
        <motion.div
          className="hidden justify-center lg:flex"
          initial={{ y: 30, rotate: -40 }}
          animate={play ? { y: 0, rotate: 0 } : undefined}
          transition={{ duration: 1.1, delay: 2.2, ease: EASE }}
        >
          <RotatingBadge label={t("hero.badge")} onClick={scrollToStory} />
        </motion.div>

        {/* end: the offer, the order button and the film */}
        <motion.div
          className="lg:justify-self-end"
          initial={{ y: 24, filter: "blur(4px)" }}
          animate={play ? { y: 0, filter: "blur(0px)" } : undefined}
          transition={{ duration: 0.9, delay: 2.4, ease: EASE }}
        >
          <p className="max-w-sm text-pretty text-[0.95rem] leading-[1.7] text-ink/70 max-sm:mx-auto max-sm:text-center">
            {t("hero.subtitle")}
          </p>
          {/* phones stack the two: centred, the order button run out wide */}
          <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-5 max-sm:flex-col max-sm:items-center">
            {/* magnetic: the wrapper leans toward the cursor, the button keeps its own hover */}
            <div ref={ctaRef} className="inline-block max-sm:w-full max-sm:max-w-[22rem]">
              <Link to="/shop" className="group block">
                <Button size="lg" className="gap-3 ps-8 pe-3 max-sm:w-full max-sm:justify-between">
                  {t("hero.ctaOrder")}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 transition-transform duration-500 group-hover:-rotate-45 rtl:group-hover:rotate-45">
                    <ArrowRight size={17} strokeWidth={1.8} className="rtl:-scale-x-100" />
                  </span>
                </Button>
              </Link>
            </div>
            <FilmTeaser />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
