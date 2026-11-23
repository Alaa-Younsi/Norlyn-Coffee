import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, Copy, ExternalLink, Gift, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { tri, useTx } from "@/components/admin/pageBuilder/editorI18n";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAdminPacks, useCatalogue, useDeletePack, useSavePack } from "@/hooks/usePacks";
import { formatPrice } from "@/lib/format";
import { packQuote } from "@/lib/packPricing";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/pageBuilder/defaults";

export function AdminPacks() {
  const { t } = useLanguage();
  const tx = useTx();
  const navigate = useNavigate();
  const { data: packs, isLoading, error } = useAdminPacks();
  const { data: catalogue } = useCatalogue(true);
  const save = useSavePack();
  const remove = useDeletePack();
  const [now] = useState(() => Date.now());

  const priceOf = useMemo(() => {
    const map = new Map((catalogue ?? []).map((p) => [p.id, p]));
    return (id: string) => {
      const p = map.get(id);
      return p && p.status === "active" ? Number(p.price) : undefined;
    };
  }, [catalogue]);

  const duplicate = (id: string) => {
    const source = packs?.find((p) => p.id === id);
    if (!source) return;
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = source;
    void _id;
    void _c;
    void _u;
    save.mutate(
      { ...rest, slug: `${source.slug}-copie-${newId().slice(0, 4)}`, status: "draft", name_fr: `${source.name_fr} (copie)` },
      { onSuccess: (pack) => navigate(`/admin/packs/${pack.id}`) },
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{t("admin.nav.packs")}</h1>
          <p className="mt-1 text-sm text-muted">
            {tx(
              tri(
                "Composez des packs de plusieurs produits, fixez vos règles de prix, et donnez à chacun sa propre page de vente.",
                "Bundle several products, set your own pricing rules, and give each pack its own sales page.",
                "اجمع عدة منتجات في باقة، حدد قواعد السعر، وامنح كل باقة صفحة بيع خاصة.",
              ),
            )}
          </p>
        </div>
        <Link to="/admin/packs/new">
          <Button size="sm">
            <Plus size={15} />
            {tx(tri("Nouveau pack", "New pack", "باقة جديدة"))}
          </Button>
        </Link>
      </div>

      {error && (
        <Panel className="mt-6 p-6 text-sm text-red-400">
          {tx(
            tri(
              "Impossible de charger les packs. La migration 0021_packs_and_pages.sql a-t-elle été exécutée ?",
              "Couldn't load packs. Has migration 0021_packs_and_pages.sql been run?",
              "تعذر تحميل الباقات. هل تم تنفيذ الترحيل 0021_packs_and_pages.sql؟",
            ),
          )}
        </Panel>
      )}

      {!isLoading && !error && (packs ?? []).length === 0 && (
        <Panel className="mt-6 flex flex-col items-center gap-4 p-12 text-center">
          <Gift size={36} className="text-brand" />
          <p className="font-display text-2xl">{tx(tri("Aucun pack pour l'instant", "No packs yet", "لا توجد باقات بعد"))}</p>
          <Link to="/admin/packs/new">
            <Button>{tx(tri("Créer le premier pack", "Create the first pack", "أنشئ أول باقة"))}</Button>
          </Link>
        </Panel>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {(packs ?? []).map((pack) => {
          const quote = packQuote(pack.items ?? [], pack.pricing, priceOf);
          const ended = pack.ends_at && new Date(pack.ends_at).getTime() < now;
          const count = (pack.items ?? []).reduce((n, i) => n + i.quantity, 0);
          return (
            <Panel key={pack.id} className="group overflow-hidden">
              <div className="relative aspect-[16/9] overflow-hidden bg-panel-2">
                {pack.cover_url && (
                  <img src={pack.cover_url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                <div className="absolute start-3 top-3 flex gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      pack.status === "published" ? "bg-emerald-950 text-emerald-300" : "bg-panel text-muted",
                    )}
                  >
                    {pack.status === "published" ? tx(tri("En ligne", "Live", "منشور")) : tx(tri("Brouillon", "Draft", "مسودة"))}
                  </span>
                  {ended && (
                    <span className="rounded-full bg-red-950 px-2.5 py-1 text-[11px] font-semibold text-red-300">
                      {tx(tri("Terminé", "Ended", "منتهٍ"))}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <p className="font-display text-xl">{pack.name_fr}</p>
                <p className="mt-0.5 text-xs text-muted">
                  /pack/{pack.slug} · {count} {t("pb.items")}
                </p>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-display text-2xl text-brand">{quote ? formatPrice(quote.unit) : "—"}</span>
                  {quote?.compare && <span className="text-sm text-muted line-through">{formatPrice(quote.compare)}</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                  {pack.pricing?.free_shipping && (
                    <span className="inline-flex items-center gap-1">
                      <Truck size={12} /> {t("checkout.shippingFree")}
                    </span>
                  )}
                  {pack.ends_at && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock size={12} /> {new Date(pack.ends_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <Link to={`/admin/packs/${pack.id}`} className="flex-1">
                    <Button size="sm" className="w-full">
                      <Pencil size={14} />
                      {tx(tri("Modifier", "Edit", "تعديل"))}
                    </Button>
                  </Link>
                  <a href={`/pack/${pack.slug}`} target="_blank" rel="noreferrer" className="rounded-full border border-line p-2 text-muted hover:text-ink" aria-label="open">
                    <ExternalLink size={15} />
                  </a>
                  <button type="button" onClick={() => duplicate(pack.id)} className="cursor-pointer rounded-full border border-line p-2 text-muted hover:text-ink" aria-label="duplicate">
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(tx(tri(`Supprimer « ${pack.name_fr} » ?`, `Delete “${pack.name_fr}”?`, `حذف «${pack.name_fr}»؟`)))) {
                        remove.mutate(pack.id);
                      }
                    }}
                    className="cursor-pointer rounded-full border border-line p-2 text-muted hover:text-red-400"
                    aria-label="delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
