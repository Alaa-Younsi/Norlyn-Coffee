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
import { useLanguage } from "@/i18n/LanguageProvider";
import { useParallax } from "@/hooks/useScrollFX";
import { getLenisInstance } from "@/lib/lenis";

const EASE = [0.22, 1, 0.36, 1] as const;

export function HeroSection({ show3D }: { show3D: boolean }) {
  const { t, lang } = useLanguage();
  const titleBlockRef = useRef<HTMLDivElement>(null);
  // the title drifts up and away as the cup starts its journey — the content
  // answers the object's motion instead of sitting frozen behind it
  useParallax(titleBlockRef, 110);

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
    <section className="fx-hero-vignette relative flex min-h-screen flex-col items-center justify-between overflow-hidden px-6 pb-8 pt-28 text-center">
      {/* layered ambience: rotating gold halo, drifting beans, stain rings */}
      <div className="fx-halo h-[80vmin] w-[80vmin]" aria-hidden />
      <FloatingBeans count={12} seed={2} />
      <CoffeeRing className="fx-spin-slow -start-20 top-16 w-64 opacity-15 sm:w-80" />
      <CoffeeRing className="-end-16 bottom-10 w-48 opacity-10 sm:w-64" />
      <div className="bg-noise pointer-events-none absolute inset-0" aria-hidden />

      <div ref={titleBlockRef} className="relative">
        {/* kicker flanked by fading gold lines */}
        <motion.div
          className="flex items-center justify-center gap-3"
          initial={{ y: 18 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand/60 sm:w-16" aria-hidden />
          <CoffeeBeanIcon className="w-3 text-brand/70" />
          <p className="text-sm uppercase tracking-[0.35em] text-brand">{t("hero.kicker")}</p>
          <CoffeeBeanIcon className="w-3 text-brand/70" />
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand/60 sm:w-16" aria-hidden />
        </motion.div>

        {/* masked letter reveal — each glyph rises out of its own clip box */}
        <h1 className="mt-3 font-display text-7xl leading-none font-semibold sm:text-8xl lg:text-9xl">
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

        <span className="inline-block overflow-hidden">
          <motion.p
            className="mt-2 inline-block font-display text-2xl italic text-ink/75 sm:text-3xl"
            initial={{ y: "115%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
          >
            {t("hero.title2")}
          </motion.p>
        </span>
      </div>

      {/* center stage: the 3D cup lives here (fixed canvas above); a warm
          podium glow grounds it and steam rises off the crema */}
      <div className="relative flex w-full flex-1 items-center justify-center">
        <div
          className="fx-podium absolute left-1/2 top-[62%] h-36 w-80 -translate-x-1/2 -translate-y-1/2 opacity-60 blur-2xl"
          aria-hidden
        />
        {show3D ? (
          <Steam className="-mt-32" />
        ) : (
          <div className="relative">
            <HeroFallback />
            <Steam className="absolute -top-16 start-1/2 -translate-x-1/2" />
          </div>
        )}
      </div>

      <motion.div
        className="relative flex flex-col items-center gap-5"
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
      >
        <p className="max-w-md text-balance text-sm leading-relaxed text-ink/70 sm:text-base">
          {t("hero.subtitle")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
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
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-panel/70 px-4 py-1.5 text-xs font-medium text-brand backdrop-blur">
          <PackageCheck size={14} />
          {t("hero.codBadge")}
        </span>

        {/* mouse-shaped scroll cue with a dropping gold dot */}
        <button
          onClick={scrollToStory}
          className="mt-1 flex flex-col items-center gap-2 text-[11px] uppercase tracking-widest text-muted transition-colors hover:text-brand cursor-pointer"
        >
          {t("hero.scroll")}
          <span className="flex h-9 w-[22px] justify-center rounded-full border border-brand/50 pt-1.5">
            <span className="fx-scroll-dot h-1.5 w-1.5 rounded-full bg-brand" />
          </span>
        </button>
      </motion.div>
    </section>
  );
}
