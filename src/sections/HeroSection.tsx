import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Steam } from "@/components/effects/Steam";
import { HeroFallback } from "@/components/effects/HeroFallback";
import { useLanguage } from "@/i18n/LanguageProvider";
import { getLenisInstance } from "@/lib/lenis";

export function HeroSection({ show3D }: { show3D: boolean }) {
  const { t } = useLanguage();

  const scrollToStory = () => {
    const target = document.getElementById("story");
    if (!target) return;
    const lenis = getLenisInstance();
    if (lenis) lenis.scrollTo(target);
    else target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="fx-hero-vignette relative flex min-h-screen flex-col items-center justify-between px-6 pb-10 pt-28 text-center">
      {/* motion = transforms only; opacity stays 1 so content can never be stuck invisible */}
      <motion.div initial={{ y: 26 }} animate={{ y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
        <p className="text-sm uppercase tracking-[0.35em] text-brand">{t("hero.kicker")}</p>
        <h1 className="fx-gold-text mt-3 font-display text-7xl leading-none font-semibold sm:text-8xl lg:text-9xl">
          {t("hero.title1")}
        </h1>
        <p className="mt-2 font-display text-2xl italic text-muted sm:text-3xl">{t("hero.title2")}</p>
      </motion.div>

      {/* center stage: the 3D capsule lives here (fixed canvas above), steam rises from it */}
      <div className="relative flex w-full flex-1 items-center justify-center">
        {show3D ? (
          <Steam className="-mt-40" />
        ) : (
          <div className="relative">
            <HeroFallback />
            <Steam className="absolute -top-16 start-1/2 -translate-x-1/2" />
          </div>
        )}
      </div>

      <motion.div
        className="flex flex-col items-center gap-5"
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="max-w-md text-balance text-sm leading-relaxed text-muted sm:text-base">
          {t("hero.subtitle")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/shop">
            <Button size="lg">{t("hero.ctaOrder")}</Button>
          </Link>
          <Button variant="outline" size="lg" onClick={scrollToStory}>
            {t("hero.ctaDiscover")}
          </Button>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-panel/70 px-4 py-1.5 text-xs font-medium text-brand backdrop-blur">
          <PackageCheck size={14} />
          {t("hero.codBadge")}
        </span>
        <button
          onClick={scrollToStory}
          className="mt-1 flex flex-col items-center gap-1 text-[11px] uppercase tracking-widest text-muted transition-colors hover:text-brand cursor-pointer"
        >
          {t("hero.scroll")}
          <ChevronDown size={16} className="animate-bounce" />
        </button>
      </motion.div>
    </section>
  );
}
