import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";
import type { StoreSettings } from "@/types/db";

export function AdminSettings() {
  const { t } = useLanguage();
  const { data: settings } = useStoreSettings();

  return (
    <div className="max-w-md">
      <h1 className="font-display text-3xl">{t("admin.nav.settings")}</h1>
      {!settings ? (
        <p className="mt-6 text-sm text-muted">{t("common.loading")}</p>
      ) : (
        <SettingsForm settings={settings} />
      )}
    </div>
  );
}

function SettingsForm({ settings }: { settings: StoreSettings }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [shippingFee, setShippingFee] = useState(() => String(settings.shipping_fee));
  const [freeShip, setFreeShip] = useState(() =>
    settings.free_ship_threshold !== null ? String(settings.free_ship_threshold) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fee = Number(shippingFee);
      if (!Number.isFinite(fee) || fee < 0) throw new Error(t("err.invalidInput"));
      const threshold = freeShip.trim() === "" ? null : Number(freeShip);
      if (threshold !== null && (!Number.isFinite(threshold) || threshold <= 0)) {
        throw new Error(t("err.invalidInput"));
      }
      const { error: upError } = await supabase
        .from("store_settings")
        .update({ shipping_fee: fee, free_ship_threshold: threshold })
        .eq("id", 1);
      if (upError) throw upError;
    },
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["store-settings"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <Panel className="mt-6 p-6">
      <form onSubmit={submit} className="space-y-4">
        <FieldWrapper label={t("admin.settings.shippingFee")}>
          <Input
            type="number"
            min="0"
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper label={t("admin.settings.freeShip")}>
          <Input
            type="number"
            min="0"
            value={freeShip}
            onChange={(e) => setFreeShip(e.target.value)}
            placeholder="—"
          />
        </FieldWrapper>
        <p className="text-xs text-muted">{t("admin.settings.freeShipHint")}</p>
        {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </form>
    </Panel>
  );
}
