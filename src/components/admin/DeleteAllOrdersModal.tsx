import { AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/i18n/LanguageProvider";

/**
 * A modal, not window.confirm: deletion is irreversible, so the escape hatch
 * (export first) has to live IN the dialog.
 */
export function DeleteAllOrdersModal({
  count,
  deleting,
  onExport,
  onConfirm,
  onClose,
}: {
  count: number;
  deleting: boolean;
  onExport: () => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 h-full w-full bg-ink/50"
        // dismissal is disabled while the delete is in flight
        onClick={deleting ? undefined : onClose}
        aria-label={t("common.close")}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-line bg-panel p-6 shadow-2xl">
        <AlertTriangle size={28} className="text-red-600" strokeWidth={1.6} />
        <h2 className="mt-3 font-display text-2xl">{t("admin.orders.deleteAllTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t("admin.orders.deleteAllBody")}</p>
        <p className="mt-2 text-sm font-medium">
          <span dir="ltr">{count}</span> {t("admin.orders.deleteAllCount")}
        </p>
        <p className="mt-2 text-xs text-muted">{t("admin.orders.deleteAllNote")}</p>

        <div className="mt-6 space-y-2">
          <Button variant="outline" className="w-full" onClick={onExport} disabled={deleting}>
            <Download size={15} />
            {t("admin.orders.deleteAllExport")}
          </Button>
          <Button variant="danger" className="w-full" onClick={onConfirm} disabled={deleting}>
            {deleting ? t("admin.orders.deleting") : t("admin.orders.deleteAllConfirm")}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose} disabled={deleting}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
