import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Paintbrush, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { PageEditor } from "@/components/admin/pageBuilder/PageEditor";
import { Choice, Toggle } from "@/components/admin/pageBuilder/fields";
import { tri, useTx } from "@/components/admin/pageBuilder/editorI18n";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAdminProductPages, useCatalogue, useDeleteProductPage, useSaveProductPage } from "@/hooks/usePacks";
import { formatPrice } from "@/lib/format";
import { normalizePage, starterProductPage } from "@/lib/pageBuilder/defaults";
import type { PageDoc } from "@/lib/pageBuilder/types";
import type { Product, ProductPage, ProductPageMode } from "@/types/db";
import { cn } from "@/lib/utils";

export function AdminProductPages() {
  const { t } = useLanguage();
  const tx = useTx();
  const { data: products } = useCatalogue(true);
  const { data: pages } = useAdminProductPages();
  const byProduct = new Map((pages ?? []).map((p) => [p.product_id, p]));

  return (
    <div>
      <h1 className="font-display text-3xl">{t("admin.nav.pages")}</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        {tx(
          tri(
            "Donnez à chaque produit une page entièrement personnalisée : couleurs, blocs, animations, vidéos, minuteurs. Elle remplace la page produit habituelle, ou s'ajoute en dessous.",
            "Give any product a fully custom page: colours, blocks, animations, videos, timers. It replaces the usual product page, or is added below it.",
            "امنح أي منتج صفحة مخصصة بالكامل: ألوان، أقسام، حركات، فيديوهات، مؤقتات. تحل محل صفحة المنتج المعتادة أو تضاف أسفلها.",
          ),
        )}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(products ?? []).map((p) => {
          const page = byProduct.get(p.id);
          return (
            <Panel key={p.id} className="group flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    page?.enabled ? "bg-emerald-950 text-emerald-300" : page ? "bg-panel-2 text-muted" : "bg-panel-2/60 text-muted/70",
                  )}
                >
                  {page?.enabled
                    ? page.mode === "replace"
                      ? tx(tri("Page perso active", "Custom page live", "الصفحة المخصصة مفعلة"))
                      : tx(tri("Blocs ajoutés", "Blocks added", "أقسام مضافة"))
                    : page
                      ? tx(tri("Désactivée", "Disabled", "معطلة"))
                      : tx(tri("Page standard", "Standard page", "الصفحة العادية"))}
                </span>
              </div>
              {p.product_images?.[0] && (
                <img src={p.product_images[0].url} alt="" className="mx-auto my-4 h-32 w-32 object-contain transition-transform duration-500 group-hover:scale-110" />
              )}
              <p className="font-display text-lg">{p.name_fr}</p>
              <p className="text-sm text-muted">{formatPrice(Number(p.price))}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <Link to={`/admin/pages/${p.id}`} className="flex-1">
                  <Button size="sm" className="w-full">
                    <Paintbrush size={14} />
                    {page ? tx(tri("Modifier", "Edit", "تعديل")) : tx(tri("Personnaliser", "Customise", "تخصيص"))}
                  </Button>
                </Link>
                <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" className="rounded-full border border-line p-2 text-muted hover:text-ink" aria-label="open">
                  <ExternalLink size={15} />
                </a>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

export function AdminProductPageEditor() {
  const { productId } = useParams();
  const { data: products } = useCatalogue(true);
  const { data: pages, isLoading } = useAdminProductPages();
  const tx = useTx();
  const product = products?.find((p) => p.id === productId);
  if (!products || isLoading) return <p className="text-muted">…</p>;
  if (!product) return <p className="text-muted">{tx(tri("Produit introuvable.", "Product not found.", "المنتج غير موجود."))}</p>;
  const page = pages?.find((p) => p.product_id === product.id) ?? null;
  return <ProductPageForm key={product.id} product={product} initial={page} catalogue={products} />;
}

function ProductPageForm({ product, initial, catalogue }: { product: Product; initial: ProductPage | null; catalogue: Product[] }) {
  const tx = useTx();
  const save = useSaveProductPage();
  const remove = useDeleteProductPage();
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [mode, setMode] = useState<ProductPageMode>(initial?.mode ?? "replace");
  const [doc, setDoc] = useState<PageDoc>(() => (initial ? normalizePage(initial.page) : starterProductPage()));
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <div className="sticky -top-4 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-top-8 sm:-mx-8 sm:px-8">
        <Link to="/admin/pages" className="rounded-full p-2 text-muted hover:text-ink" aria-label="back">
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-display text-2xl">{product.name_fr}</h1>
        <div className="w-56">
          <Toggle label={tx(tri("Page active", "Page live", "الصفحة مفعلة"))} value={enabled} onChange={setEnabled} />
        </div>
        <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-sm text-muted hover:text-ink">
          <ExternalLink size={14} />
          {tx(tri("Voir", "View", "عرض"))}
        </a>
        {initial && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (window.confirm(tx(tri("Revenir à la page produit standard ?", "Go back to the standard product page?", "العودة إلى صفحة المنتج العادية؟")))) {
                remove.mutate(product.id);
              }
            }}
          >
            <RotateCcw size={14} />
            {tx(tri("Page standard", "Standard page", "الصفحة العادية"))}
          </Button>
        )}
        <Button
          size="sm"
          disabled={save.isPending}
          onClick={() => {
            setError(null);
            save.mutate(
              { product_id: product.id, enabled, mode, page: doc },
              { onError: (e) => setError(e instanceof Error ? e.message : String(e)) },
            );
          }}
        >
          <Save size={15} />
          {save.isPending ? "…" : tx(tri("Enregistrer", "Save", "حفظ"))}
        </Button>
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
      </div>

      <div className="mb-5 max-w-xl">
        <Choice
          label={tx(tri("Comment l'afficher", "How it shows", "طريقة العرض"))}
          value={mode}
          options={[
            { value: "replace", label: tx(tri("Remplace la page produit", "Replaces the product page", "تحل محل صفحة المنتج")) },
            { value: "extend", label: tx(tri("S'ajoute sous la page produit", "Added below the product page", "تضاف أسفل صفحة المنتج")) },
          ]}
          onChange={setMode}
        />
      </div>

      <PageEditor doc={doc} onChange={setDoc} source={{ kind: "product", product }} catalogue={catalogue} />
    </div>
  );
}
