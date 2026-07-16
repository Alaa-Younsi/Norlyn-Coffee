import { useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Input, Select } from "@/components/ui/Field";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useSeo } from "@/hooks/useSeo";

export function Shop() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
  });

  useSeo({
    title: `${t("shop.title")} — Norlyn Coffee`,
    description:
      "Toutes les capsules espresso Moriva par Norlyn Coffee — livraison 58 wilayas, paiement à la livraison.",
  });

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 pb-24 pt-28">
      <h1 className="font-display text-4xl font-semibold sm:text-6xl">{t("shop.title")}</h1>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("shop.search")}
            className="ps-11"
            type="search"
          />
        </div>
        <Select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="sm:w-64"
        >
          <option value="">{t("shop.allCategories")}</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {lang === "ar" ? c.name_ar : c.name_fr}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <p className="mt-16 text-center text-muted">{t("common.loading")}</p>
      ) : !products || products.length === 0 ? (
        <p className="mt-16 text-center text-muted">{t("shop.empty")}</p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
