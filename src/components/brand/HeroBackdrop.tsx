import { useRef } from "react";
import { GoldDustLogo } from "@/components/brand/GoldDustLogo";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useParallax } from "@/hooks/useScrollFX";

/**
 * The layer BEHIND the 3D canvas on the landing page — the only place DOM can
 * sit under the cup rather than over it (the canvas is fixed at z-10, the
 * scroll stage at z-20; this is z-0).
 *
 * It carries the two things that should be behind the object, like the
 * backdrop of a product shot:
 *  - the Moriva mark, set enormous across the screen and condensing out of
 *    gold dust, with the cup floating in front of its lower half;
 *  - the warm light the cup stands in — a lit backdrop rather than a glow laid
 *    over the espresso (an overlay greys the black, a backdrop doesn't).
 *
 * The mark drifts slower than the page as you scroll away, so the cup visibly
 * leaves it behind.
 */
export function HeroBackdrop() {
  const { t } = useLanguage();
  const markRef = useRef<HTMLDivElement>(null);
  useParallax(markRef, 160);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[100svh] overflow-hidden">
      {/* the light the cup stands in */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[44%] h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--c-gold-hi)/0.16),rgb(var(--c-brand)/0.06)_55%,transparent)]"
      />
      <div aria-hidden className="bg-noise absolute inset-0" />
      {/* the floor the light falls on */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg to-transparent"
      />

      <div ref={markRef} className="absolute inset-x-0 top-[13%] flex justify-center px-4 sm:top-[15%] lg:top-[17%]">
        <h1 className="text-ink">
          <GoldDustLogo title={t("hero.title1")} className="w-[92vw] max-w-[1180px] opacity-95" />
        </h1>
      </div>
    </div>
  );
}
