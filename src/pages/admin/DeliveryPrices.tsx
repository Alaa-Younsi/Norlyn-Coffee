import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Field";
import { useDeliveryPrices } from "@/hooks/useDeliveryPrices";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { DeliveryPrice } from "@/types/db";

export function AdminDeliveryPrices() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: prices } = useDeliveryPrices(false);

  const saveMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("delivery_prices").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["delivery-prices"] }),
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">{t("admin.nav.delivery")}</h1>
      <Panel className="mt-6 overflow-x-auto">
        <table className="min-w-[560px] w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <th className="px-5 py-3 text-start">{t("admin.delivery.wilaya")}</th>
              <th className="w-36 px-5 py-3 text-start">{t("admin.delivery.home")}</th>
              <th className="w-36 px-5 py-3 text-start">{t("admin.delivery.office")}</th>
              <th className="w-24 px-5 py-3 text-start">{t("admin.delivery.active")}</th>
            </tr>
          </thead>
          <tbody>
            {(prices ?? []).map((price) => (
              <PriceRow
                key={price.id}
                price={price}
                onSave={(id, patch) => saveMutation.mutate({ id, patch })}
              />
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function PriceRow({
  price,
  onSave,
}: {
  price: DeliveryPrice;
  onSave: (id: string, patch: Record<string, unknown>) => void;
}) {
  const { t } = useLanguage();
  const [home, setHome] = useState(() => String(price.home_price));
  const [office, setOffice] = useState(() => String(price.office_price));

  const commit = () => {
    const homeNum = Number(home);
    const officeNum = Number(office);
    if (!Number.isFinite(homeNum) || !Number.isFinite(officeNum) || homeNum < 0 || officeNum < 0) {
      return;
    }
    if (homeNum === Number(price.home_price) && officeNum === Number(price.office_price)) return;
    onSave(price.id, { home_price: homeNum, office_price: officeNum });
  };

  return (
    <tr className={cn("border-b border-line/60 last:border-0", !price.active && "opacity-45")}>
      <td className="px-5 py-2.5 font-medium">{price.wilaya}</td>
      <td className="px-5 py-2.5">
        <Input
          type="number"
          min="0"
          className="w-28"
          value={home}
          onChange={(e) => setHome(e.target.value)}
          onBlur={commit}
          aria-label={`${price.wilaya} ${t("admin.delivery.home")}`}
        />
      </td>
      <td className="px-5 py-2.5">
        <Input
          type="number"
          min="0"
          className="w-28"
          value={office}
          onChange={(e) => setOffice(e.target.value)}
          onBlur={commit}
          aria-label={`${price.wilaya} ${t("admin.delivery.office")}`}
        />
      </td>
      <td className="px-5 py-2.5">
        <input
          type="checkbox"
          checked={price.active}
          onChange={(e) => onSave(price.id, { active: e.target.checked })}
          className="h-4 w-4 cursor-pointer accent-[rgb(var(--c-brand))]"
          aria-label={`${price.wilaya} ${t("admin.delivery.active")}`}
        />
      </td>
    </tr>
  );
}
