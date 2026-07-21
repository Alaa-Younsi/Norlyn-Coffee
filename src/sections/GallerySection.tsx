import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { CoffeeCupArt } from "@/components/effects/CoffeeCup";
import { EspressoPour } from "@/components/effects/EspressoPour";
import { CoffeeBeanIcon } from "@/components/effects/CoffeeBeanIcon";
import { CoffeeRing } from "@/components/effects/CoffeeRing";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useParallaxItems, useRevealOnScroll, useVelocitySkew } from "@/hooks/useScrollFX";

/**
 * The Moriva ritual — three illustrated tiles that will become real
 * photography later (each carries a "photo coming" pill so the placeholders
 * are obvious). Until then: animated SVG coffee art.
 */
export function GallerySection() {
  const { t } = useLanguage();
  const tilesRef = useRef<HTMLDivElement>(null);
  useRevealOnScroll(tilesRef);
  // adjacent tiles drift at different speeds — the flat grid reads as layers
  useParallaxItems(tilesRef);
  useVelocitySkew(tilesRef, 1.8);

  const tiles: Array<{ caption: string; art: ReactNode }> = [
    {
      caption: t("gallery.caption1"),
      art: <CoffeeCupArt className="w-36 sm:w-44" />,
    },
    {
      caption: t("gallery.caption2"),
      art: (
        <div className="pointer-events-none relative flex items-end gap-2" aria-hidden>
          <CoffeeBeanIcon
            className="fx-float w-10 -rotate-[24deg] text-brand/70"
            style={{ "--drift-dur": "5.5s" } as CSSProperties}
          />
          <CoffeeBeanIcon
            className="fx-float w-16 text-brand"
            style={{ "--drift-dur": "6.5s", animationDelay: "0.8s" } as CSSProperties}
          />
          <CoffeeBeanIcon
            className="fx-float w-10 rotate-[28deg] text-brand/70"
            style={{ "--drift-dur": "5s", animationDelay: "1.6s" } as CSSProperties}
          />
        </div>
      ),
    },
    {
      caption: t("gallery.caption3"),
      art: <EspressoPour className="w-32 sm:w-40" />,
    },
  ];

  return (
    <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-16 sm:py-24">
      <FloatingBeans count={7} seed={5} />
      <CoffeeRing className="fx-spin-slow -end-16 top-4 w-56 opacity-15" />

      <div className="relative text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-brand">{t("gallery.kicker")}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold sm:text-5xl">
          {t("gallery.title")}
        </h2>
      </div>

      <div
        ref={tilesRef}
        className="relative mt-12 grid gap-6 sm:grid-cols-3"
        style={{ perspective: "1200px" }}
      >
        {tiles.map((tile, i) => (
          // parallax lives on the wrapper, reveal on the tile — two tweens
          // driving the same element's y would fight each other
          <div key={tile.caption} data-parallax={[-36, 44, -24][i]}>
          <div
            data-reveal
            className="fx-sheen relative flex aspect-[4/5] flex-col items-center justify-center gap-8 overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-panel/80 to-panel-2/55 backdrop-blur-md p-6"
          >
            <span className="absolute end-4 top-4 rounded-full border border-line bg-panel/80 px-3 py-1 text-[10px] uppercase tracking-widest text-muted">
              {t("gallery.placeholder")}
            </span>
            {tile.art}
            <p className="text-balance text-center font-display text-xl text-ink/90 sm:text-2xl">
              {tile.caption}
            </p>
          </div>
          </div>
        ))}
      </div>
    </section>
  );
}
