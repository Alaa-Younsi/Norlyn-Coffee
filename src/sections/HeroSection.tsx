import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Steam } from "@/components/effects/Steam";
import { HeroFallback } from "@/components/effects/HeroFallback";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { CoffeeBeanIcon } from "@/components/effects/CoffeeBeanIcon";
import { CoffeeRing } from "@/components/effects/CoffeeRing";
import { HeroVideo } from "@/components/effects/HeroVideo";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useParallax } from "@/hooks/useScrollFX";
import { getLenisInstance } from "@/lib/lenis";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Three columns on desktop: copy at the start edge, the 3D cup in the middle
 * (it lives on the fixed canvas BEHIND this section — the middle column is
 * deliberately empty so nothing ever covers it), the brand's video screen at
 * the end edge. On phones the same three blocks stack in that order.
 */
export function HeroSection({ show3D, showArt }: { show3D: boolean; showArt: boolean }) {
  const { t, lang } = useLanguage();
  const copyRef = useRef<HTMLDivElement>(null);
  // the copy drifts up and away as the cup starts its journey — the content
  // answers the object's motion instead of sitting frozen beside it
  useParallax(copyRef, 90);

  const scrollToStory = () => {
    const target = document.getElementById("story");
    if (!target) return;
    const lenis = getLenisInstance();
    if (lenis) lenis.scrollTo(target);
    else target.scrollIntoView({ behavior: "smooth" });
  };

  // Arabic script is ligatured — splitting it into letters would disconnect
  // the glyphs, so the reveal animates the whole word there instead.
  const titleParts = lang === "ar" ? [t("hero.title1")] : t("hero.title1").split("");

  return (
    // Phones get tighter top and bottom padding than the desktop composition.
    // The hero has to fit the CTAs above the fold on a screen whose browser
    // chrome already takes ~110px off the 852px it advertises, and on desktop
    // that pressure simply does not exist.
    <section className="fx-hero-vignette relative min-h-screen overflow-hidden px-6 pb-6 pt-20 sm:pb-12 sm:pt-24 lg:pt-32">
      {/* layered ambience: rotating gold halo, drifting beans, stain rings */}
      <div className="fx-halo h-[80vmin] w-[80vmin]" aria-hidden />
      <FloatingBeans count={12} seed={2} />
      <CoffeeRing className="fx-spin-slow -start-20 top-16 w-64 opacity-15 sm:w-80" />
      <CoffeeRing className="-end-16 bottom-10 w-48 opacity-10 sm:w-64" />
      <div className="bg-noise pointer-events-none absolute inset-0" aria-hidden />

      {/*
        The 3D object is fixed at the viewport's centre, so on a phone whatever
        DOM sits there is covered by it. The copy is therefore split in two:
        the title rides ABOVE the object's band, the subtitle and CTAs below —
        the cup column between them is the reserved gap. On desktop explicit
        row/column placement puts both halves back together in column 1.
      */}
      <div className="relative mx-auto grid max-w-7xl gap-2 sm:gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.75fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-8 lg:gap-y-0">
        {/* ------------------------------------------------- title block */}
        <div ref={copyRef} className="text-start lg:col-start-1 lg:row-start-1 lg:self-end">
          {/* kicker on a single gold rule, anchored to the start edge */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ y: 18 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <CoffeeBeanIcon className="w-3 text-brand/70" />
            <p className="text-xs uppercase tracking-[0.35em] text-brand sm:text-sm">
              {t("hero.kicker")}
            </p>
            {/* plain fade both ways: Tailwind has no logical gradient direction,
                and a physical one would point the wrong way in RTL */}
            <span className="h-px max-w-32 flex-1 bg-brand/35" aria-hidden />
          </motion.div>

          {/* masked letter reveal — each glyph rises out of its own clip box */}
          <h1 className="mt-4 font-display text-6xl leading-[0.95] font-semibold sm:text-7xl lg:text-8xl">
            {titleParts.map((part, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
                <motion.span
                  className="fx-gold-text-deep inline-block"
                  initial={{ y: "112%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.12 + i * 0.055, ease: EASE }}
                >
                  {part}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* the one italic line — the accent cut carries the whole brand voice */}
          <span className="mt-1 inline-block overflow-hidden">
            <motion.p
              className="fx-accent inline-block text-3xl text-ink/85 sm:text-4xl lg:text-[2.6rem]"
              initial={{ y: "115%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
            >
              {t("hero.title2")}
            </motion.p>
          </span>
        </div>

        {/* --------------------------------------------- the cup's column */}
        {/* Intentionally EMPTY: the 3D object is rendered on the fixed canvas
            behind this section and parks here. Only the podium glow and the
            steam belong on top of it. On phones this is the reserved gap
            between the two halves of the copy. */}
        {/* 26vh is measured, not chosen: the cup renders about 222px tall at
            the hero's compact scale, which is 26% of a 852px phone viewport.
            The old 34vh reserved a third of the screen for an object that only
            filled three quarters of it, and the leftover read as a gap between
            the title and the cup — which is exactly what it was. */}
        <div className="relative flex min-h-[26vh] items-center justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-h-[62vh]">
          <div
            className="fx-podium absolute left-1/2 top-[58%] h-36 w-72 -translate-x-1/2 -translate-y-1/2 opacity-60 blur-2xl"
            aria-hidden
          />
          {/* Neither branch while the catalogue is still in flight: the podium
              glow above holds the space, and the column's min-height means
              nothing moves when the winner arrives. See Landing's showHeroArt. */}
          {show3D ? (
            <Steam className="-mt-24" />
          ) : showArt ? (
            <div className="relative">
              <HeroFallback />
              <Steam className="absolute -top-16 start-1/2 -translate-x-1/2" />
            </div>
          ) : null}
        </div>

        {/* ------------------------- second half of the copy (below the cup) */}
        <motion.div
          className="text-start lg:col-start-1 lg:row-start-2 lg:self-start"
          initial={{ y: 26 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
        >
          <p className="max-w-lg text-balance font-display text-lg leading-relaxed text-ink/75 sm:text-xl lg:mt-6 lg:text-[1.45rem] lg:leading-[1.5]">
            {t("hero.subtitle")}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/shop">
              <Button size="lg" className="hover:-translate-y-0.5 transition-transform">
                {t("hero.ctaOrder")}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToStory}
              className="hover:-translate-y-0.5 transition-transform"
            >
              {t("hero.ctaDiscover")}
            </Button>
          </div>

          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-panel/70 px-4 py-1.5 text-xs font-medium text-brand backdrop-blur">
            <PackageCheck size={14} />
            {t("hero.codBadge")}
          </span>
        </motion.div>

        {/* ------------------------------------------------- video screen */}
        <motion.div
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: EASE }}
          className="mx-auto w-full max-w-sm lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:max-w-none"
        >
          <HeroVideo />
        </motion.div>
      </div>

      {/* mouse-shaped scroll cue with a dropping gold dot */}
      <button
        onClick={scrollToStory}
        className="relative mx-auto mt-10 flex flex-col items-center gap-2 text-[11px] uppercase tracking-widest text-muted transition-colors hover:text-brand cursor-pointer lg:mt-6"
      >
        {t("hero.scroll")}
        <span className="flex h-9 w-[22px] justify-center rounded-full border border-brand/50 pt-1.5">
          <span className="fx-scroll-dot h-1.5 w-1.5 rounded-full bg-brand" />
        </span>
      </button>
    </section>
  );
}
