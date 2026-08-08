import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Mascot } from "@/components/mascot/Mascot";
import { CoffeeBeanIcon } from "@/components/effects/CoffeeBeanIcon";
import { CoffeeDivider } from "@/components/effects/CoffeeDivider";
import { CoffeeRing } from "@/components/effects/CoffeeRing";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { ScrollProgressBar } from "@/components/effects/ScrollProgressBar";
import { Steam } from "@/components/effects/Steam";
import { Input } from "@/components/ui/Field";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useSeo } from "@/hooks/useSeo";
import { pickLang } from "@/lib/localized";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Shop() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
  });

  useSeo({ title: `${t("shop.title")} — Norlyn Coffee`, description: t("shop.metaDesc") });

  return (
    <main className="fx-hero-vignette relative mx-auto min-h-screen overflow-x-clip px-6 pb-24 pt-28">
      <ScrollProgressBar />
      {/* coffee ambience behind everything */}
      <FloatingBeans count={10} seed={11} />
      <CoffeeRing className="fx-spin-slow -start-24 top-24 w-72 opacity-10" />
      <CoffeeRing className="-end-20 top-[60%] w-56 opacity-10" />

      <div className="relative mx-auto max-w-7xl">
        {/* decorated header, steam rising behind the title */}
        <header className="relative text-center">
          <Steam className="absolute -top-16 start-1/2 -translate-x-1/2 opacity-60" />
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand/60 sm:w-16" aria-hidden />
            <CoffeeBeanIcon className="w-3 text-brand/70" />
            <p className="text-sm uppercase tracking-[0.3em] text-brand">{t("shop.kicker")}</p>
            <CoffeeBeanIcon className="w-3 text-brand/70" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand/60 sm:w-16" aria-hidden />
          </div>
          <motion.h1
            className="fx-gold-text-deep mt-3 font-display text-5xl font-semibold sm:text-7xl"
            initial={{ y: 26 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            {t("shop.title")}
          </motion.h1>
          <p className="mt-3 text-sm text-ink/70 sm:text-base">{t("shop.subtitle")}</p>
          <CoffeeDivider className="mt-6" />
        </header>

        {/* search + category chips */}
        <div className="mt-10 flex flex-col gap-4">
          <div className="relative mx-auto w-full max-w-xl">
            <Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("shop.search")}
              className="ps-11"
              type="search"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <CategoryChip active={categoryId === ""} onClick={() => setCategoryId("")}>
              {t("shop.allCategories")}
            </CategoryChip>
            {(categories ?? []).map((category) => (
              <CategoryChip
                key={category.id}
                active={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
              >
                {pickLang(lang, category.name_fr, category.name_ar, category.name_en)}
              </CategoryChip>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="mt-16 text-center text-muted">{t("common.loading")}</p>
        ) : !products || products.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            {/* the cup looks as stumped as the search did — a shrug lands
                better than a bean floating over an apology */}
            <Mascot emotion="surprised" palette={["surprised"]} size={96} />
            <p className="text-muted">{t("shop.empty")}</p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, i) => (
              // transform-only entrance, staggered by column
              <motion.div
                key={product.id}
                initial={{ y: 48 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: (i % 4) * 0.08, ease: EASE }}
                className="h-full"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "fx-sheen cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-300",
        active
          ? "border-brand bg-brand text-cream shadow-lg shadow-brand/25"
          : "border-line bg-panel/70 text-muted hover:border-brand/50 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
