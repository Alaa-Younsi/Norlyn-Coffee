import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { CoffeeDivider } from "@/components/effects/CoffeeDivider";
import { CoffeeRing } from "@/components/effects/CoffeeRing";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  useDriftIn,
  useFadeUp,
  useParallax,
  useRevealOnScroll,
  useTiltCards,
  useVelocitySkew,
} from "@/hooks/useScrollFX";
import type { Product } from "@/types/db";

export function FeaturedSection({ products }: { products: Product[] }) {
  const { t, dir } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  useRevealOnScroll(gridRef, [products.length]);
  useParallax(headerRef, 48);
  // the machine slides down the end side while this header arrives from start
  useDriftIn(headerRef, "start", 70);
  // fast flicks shear the grid a couple of degrees — scroll with mass
  useVelocitySkew(gridRef);
  useTiltCards(gridRef, [products.length]);
  useFadeUp(sectionRef, [products.length]);

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-7xl overflow-hidden px-6 py-16 sm:py-24"
    >
      <FloatingBeans count={6} seed={6} />
      <CoffeeRing className="fx-spin-slow -start-16 -top-8 w-56 opacity-10" />
      <CoffeeDivider className="mb-12" />
      <div ref={headerRef} className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p data-fade="16" className="text-sm uppercase tracking-[0.3em] text-brand">
            {t("featured.kicker")}
          </p>
          <h2 data-fade className="mt-2 font-display text-3xl font-semibold sm:text-5xl">
            {t("featured.title")}
          </h2>
        </div>
        <Link
          to="/shop"
          className="group inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-gold-hi transition-colors"
        >
          {t("featured.viewAll")}
          <ArrowRight
            size={16}
            className={dir === "rtl" ? "rotate-180 transition-transform group-hover:-translate-x-1" : "transition-transform group-hover:translate-x-1"}
          />
        </Link>
      </div>
      {/* perspective makes the cards' reveal tilt read as depth, not a squash */}
      <div
        ref={gridRef}
        className="relative mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        style={{ perspective: "1200px" }}
      >
        {products.map((product) => (
          <div key={product.id} data-reveal className="h-full">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
