import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { RevealHeading } from "@/components/brand/RevealHeading";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useFadeUp, useRevealOnScroll, useTiltCards } from "@/hooks/useScrollFX";
import type { Product } from "@/types/db";

/**
 * The shop window. The espresso machine is brewing behind this grid in the
 * 3D layer, so the cards carry no boxes of their own — each capsule sits on a
 * plinth of its own colour and the machine reads through the gaps.
 */
export function FeaturedSection({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  useRevealOnScroll(gridRef, [products.length]);
  useTiltCards(gridRef, [products.length]);
  useFadeUp(sectionRef, [products.length]);

  return (
    <section ref={sectionRef} className="relative mx-auto max-w-7xl overflow-clip px-6 py-24 sm:py-32">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <RevealHeading className="max-w-2xl font-display text-[2.6rem] leading-[1.02] font-medium tracking-[-0.02em] sm:text-6xl lg:text-7xl">
          {t("featured.title")}
        </RevealHeading>
        <Link
          data-fade="16"
          to="/shop"
          className="group inline-flex items-center gap-3 border-b border-ink/25 pb-1.5 text-sm font-medium uppercase tracking-[0.2em] text-ink transition-colors hover:border-brand"
        >
          {t("featured.viewAll")}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
        </Link>
      </div>
      <div
        ref={gridRef}
        className="relative mt-14 grid grid-cols-1 gap-x-6 gap-y-12 [perspective:1200px] sm:grid-cols-2 lg:grid-cols-4"
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
