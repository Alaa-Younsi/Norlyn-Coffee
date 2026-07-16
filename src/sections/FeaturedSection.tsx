import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { Product } from "@/types/db";

export function FeaturedSection({ products }: { products: Product[] }) {
  const { t, dir } = useLanguage();
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand">{t("featured.kicker")}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-5xl">
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
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
