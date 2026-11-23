import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownUp, Search } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { PageTitle } from "@/components/brand/PageTitle";
import { Reveal } from "@/components/brand/Reveal";
import { Mascot } from "@/components/mascot/Mascot";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useSeo } from "@/hooks/useSeo";
import { useTiltCards } from "@/hooks/useScrollFX";
import { pickLang } from "@/lib/localized";
import { useHeaderStore } from "@/store/header";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/db";
import { PacksStrip } from "@/components/product/PacksStrip";

const EASE = [0.22, 1, 0.36, 1] as const;

type Sort = "featured" | "intensityDesc" | "intensityAsc" | "priceAsc" | "priceDesc";

const SORTS: Array<{ value: Sort; labelKey: TranslationKey }> = [
  { value: "featured", labelKey: "shop.sortFeatured" },
  { value: "intensityDesc", labelKey: "shop.sortIntensityDesc" },
  { value: "intensityAsc", labelKey: "shop.sortIntensityAsc" },
  { value: "priceAsc", labelKey: "shop.sortPriceAsc" },
  { value: "priceDesc", labelKey: "shop.sortPriceDesc" },
];

function sortProducts(products: Product[], sort: Sort): Product[] {
  const list = [...products];
  const intensity = (p: Product) => p.intensity ?? 0;
  switch (sort) {
    case "intensityDesc":
      return list.sort((a, b) => intensity(b) - intensity(a));
    case "intensityAsc":
      return list.sort((a, b) => intensity(a) - intensity(b));
    case "priceAsc":
      return list.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return list.sort((a, b) => b.price - a.price);
    default:
      return list;
  }
}

/**
 * The Boutique as a catalogue, not a template shop page: a large editorial
 * title with the live count, one sticky bar holding everything that narrows
 * the range (category tabs, an underline search, the sort), and a grid whose
 * cards GLIDE to their new places when the selection changes (Framer `layout`)
 * instead of blinking out and back.
 */
export function Shop() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
  });
  const sorted = useMemo(() => sortProducts(products ?? [], sort), [products, sort]);

  // the bar takes the header's place when the header slides away
  const headerHidden = useHeaderStore((state) => state.hidden);
  const gridRef = useRef<HTMLDivElement>(null);
  useTiltCards(gridRef, [sorted.length]);

  useSeo({ title: `${t("shop.title")} — Norlyn Coffee`, description: t("shop.metaDesc") });

  return (
    <main className="relative min-h-screen overflow-x-clip pb-24 pt-32 sm:pt-36">
      <FloatingBeans count={8} seed={11} />

      <div className="relative mx-auto max-w-7xl px-6">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <PageTitle text={t("shop.title")} />
            <Reveal as="p" index={4} className="mt-5 max-w-md font-display text-xl italic text-ink/70">
              {t("shop.subtitle")}
            </Reveal>
          </div>
          {!isLoading && (
            <p className="font-display text-lg text-muted" aria-live="polite">
              <span className="text-ink">{sorted.length}</span> {t("shop.items")}
            </p>
          )}
        </header>
      </div>

      {/* one sticky bar for everything that narrows the range */}
      <div
        className={cn(
          "sticky z-30 mt-12 border-y border-line bg-bg/95 transition-[top] duration-500 ease-[cubic-bezier(.76,0,.24,1)] md:bg-bg/85 md:backdrop-blur-md",
          headerHidden ? "top-0" : "top-[4.5rem]",
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-6 overflow-x-auto px-6" role="tablist" aria-label={t("shop.allCategories")}>
            <div className="flex min-w-max gap-6">
              <CategoryTab active={categoryId === ""} onClick={() => setCategoryId("")}>
                {t("shop.allCategories")}
              </CategoryTab>
              {(categories ?? []).map((category) => (
                <CategoryTab
                  key={category.id}
                  active={categoryId === category.id}
                  onClick={() => setCategoryId(category.id)}
                >
                  {pickLang(lang, category.name_fr, category.name_ar, category.name_en)}
                </CategoryTab>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5">
            <label className="flex flex-1 items-center gap-2.5 border-b border-line pb-1.5 transition-colors focus-within:border-brand lg:w-64 lg:flex-none">
              <Search size={15} className="shrink-0 text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("shop.search")}
                aria-label={t("shop.search")}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
              />
            </label>
            <label className="relative flex shrink-0 items-center gap-2 text-sm text-muted">
              <ArrowDownUp size={15} />
              <span className="sr-only">{t("shop.sort")}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="cursor-pointer appearance-none bg-transparent pe-1 text-ink focus:outline-none"
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {isLoading ? (
          <p className="mt-16 text-center text-muted">{t("common.loading")}</p>
        ) : sorted.length === 0 ? (
          <div className="mt-20 flex flex-col items-center gap-4 text-center">
            {/* the cup looks as stumped as the search did */}
            <Mascot emotion="surprised" palette={["surprised"]} size={96} />
            <p className="font-display text-xl italic text-muted">{t("shop.empty")}</p>
          </div>
        ) : (
          <motion.div
            ref={gridRef}
            layout
            className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {sorted.map((product, i) => (
                // `layout` lets a card glide to its new slot when the filter or
                // the sort changes; the first appearance is a staggered rise
                <motion.div
                  key={product.id}
                  layout
                  // swings up out of the page in 3D, column by column
                  initial={{ y: 70, rotateX: 22, opacity: 0, transformPerspective: 1200 }}
                  animate={{ y: 0, rotateX: 0, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ duration: 0.9, delay: 0.5 + (i % 4) * 0.08 + Math.floor(i / 4) * 0.12, ease: EASE }}
                  className="h-full"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        {/* bundles only on the unfiltered shop — a search is looking for one box */}
        {!search && !categoryId && <PacksStrip />}
      </div>
    </main>
  );
}

function CategoryTab({
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
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer whitespace-nowrap pb-1.5 font-display text-base transition-colors",
        active ? "text-ink" : "text-muted hover:text-ink",
      )}
    >
      {children}
      {active && (
        <motion.span
          layoutId="shop-tab"
          aria-hidden
          className="absolute inset-x-0 -bottom-px h-px bg-brand"
          transition={{ duration: 0.4, ease: EASE }}
        />
      )}
    </button>
  );
}
