import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/db";

const styles: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  confirmed: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300",
  shipped: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-300",
  delivered: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-semibold", styles[status])}>
      {t(`admin.status.${status}`)}
    </span>
  );
}
