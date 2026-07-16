import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/db";

export function AdminProducts() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{t("admin.nav.products")}</h1>
        <Link to="/admin/products/new">
          <Button size="sm">
            <Plus size={15} />
            {t("admin.products.new")}
          </Button>
        </Link>
      </div>

      <Panel className="mt-6 overflow-x-auto">
        <table className="min-w-[640px] w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <th className="px-5 py-3 text-start">{t("admin.products.name")}</th>
              <th className="px-5 py-3 text-start">{t("admin.products.price")}</th>
              <th className="px-5 py-3 text-start">{t("admin.products.stock")}</th>
              <th className="px-5 py-3 text-start">{t("admin.products.status")}</th>
              <th className="px-5 py-3 text-end" />
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((product) => (
              <tr key={product.id} className="border-b border-line/60 last:border-0 hover:bg-panel-2/50">
                <td className="flex items-center gap-3 px-5 py-3">
                  {product.product_images?.[0] && (
                    <img
                      src={product.product_images[0].url}
                      alt=""
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-10 rounded-lg object-contain"
                    />
                  )}
                  <span className="font-medium">{product.name_fr}</span>
                  {product.featured && (
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                      ★
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">{formatPrice(Number(product.price))}</td>
                <td className={cn("px-5 py-3", product.stock <= 0 && "font-semibold text-red-600")}>
                  {product.stock}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      product.status === "active"
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-panel-2 text-muted",
                    )}
                  >
                    {product.status === "active" ? t("admin.products.active") : t("admin.products.draft")}
                  </span>
                </td>
                <td className="px-5 py-3 text-end">
                  <div className="inline-flex gap-1">
                    <Link
                      to={`/admin/products/${product.id}`}
                      className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-ink"
                      aria-label={t("common.edit")}
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => {
                        if (window.confirm(t("admin.products.deleteConfirm"))) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                      className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-red-600 cursor-pointer"
                      aria-label={t("common.delete")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
