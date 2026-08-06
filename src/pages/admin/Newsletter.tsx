import { useMemo, useState } from "react";
import { Download, MailX, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Field";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  useDeleteSubscriber,
  useSetSubscriberStatus,
  useSubscribers,
} from "@/hooks/useNewsletter";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";
import type { SubscriberStatus } from "@/types/db";

const FILTERS: Array<{ value: SubscriberStatus | "all"; labelKey: TranslationKey }> = [
  { value: "all", labelKey: "admin.newsletter.filterAll" },
  { value: "subscribed", labelKey: "admin.newsletter.filterActive" },
  { value: "unsubscribed", labelKey: "admin.newsletter.filterOut" },
];

export function AdminNewsletter() {
  const { t, lang } = useLanguage();
  const { data: subscribers, isLoading } = useSubscribers();
  const setStatus = useSetSubscriberStatus();
  const remove = useDeleteSubscriber();
  const [filter, setFilter] = useState<SubscriberStatus | "all">("all");
  const [search, setSearch] = useState("");

  const all = useMemo(() => subscribers ?? [], [subscribers]);
  const activeCount = all.filter((row) => row.status === "subscribed").length;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter(
      (row) =>
        (filter === "all" || row.status === filter) && (!term || row.email.includes(term)),
    );
  }, [all, filter, search]);

  /**
   * Exports the CURRENTLY FILTERED list, the same rule as the orders export —
   * what you see is what you get. `downloadCsv` applies the formula-injection
   * guard: the RPC's address grammar happily accepts `=cmd@evil.com`, and that
   * would execute for whoever opens the file in Excel.
   */
  const exportCsv = () => {
    downloadCsv(
      `abonnes-newsletter-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Email", "Statut", "Source", "Inscrit le"],
      rows.map((row) => [row.email, row.status, row.source, row.created_at.slice(0, 10)]),
    );
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{t("admin.newsletter.title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {activeCount} {t("admin.newsletter.activeCount")}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download size={15} />
          {t("admin.newsletter.export")}
        </Button>
      </div>

      {/* scrolls horizontally, never wraps: a wrapped row changes height between
          FR and AR and reflows the page under the user's thumb mid-tap */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors cursor-pointer",
              filter === option.value
                ? "border-brand bg-brand/10 font-medium text-brand"
                : "border-line text-muted hover:border-brand/50",
            )}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("admin.newsletter.search")}
        aria-label={t("admin.newsletter.search")}
        dir="ltr"
        className="mt-3"
      />

      {isLoading && <p className="mt-6 text-sm text-muted">{t("common.loading")}</p>}
      {!isLoading && rows.length === 0 && (
        <Panel className="mt-6 p-6 text-sm text-muted">{t("admin.newsletter.none")}</Panel>
      )}

      <div className="mt-6 space-y-2">
        {rows.map((row) => (
          <Panel
            key={row.id}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 p-4",
              row.status === "unsubscribed" && "opacity-60",
            )}
          >
            <div className="min-w-0">
              {/* an address is always LTR, even on the Arabic admin */}
              <p className="truncate text-sm font-medium" dir="ltr">
                {row.email}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {formatDate(row.created_at, lang)} · {row.source}
                {row.status === "unsubscribed" && ` · ${t("admin.newsletter.filterOut")}`}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() =>
                  setStatus.mutate({
                    id: row.id,
                    status: row.status === "subscribed" ? "unsubscribed" : "subscribed",
                  })
                }
                className="rounded-full p-2 text-muted transition-colors hover:text-brand cursor-pointer"
                aria-label={
                  row.status === "subscribed"
                    ? t("admin.newsletter.unsubscribe")
                    : t("admin.newsletter.resubscribe")
                }
                title={
                  row.status === "subscribed"
                    ? t("admin.newsletter.unsubscribe")
                    : t("admin.newsletter.resubscribe")
                }
              >
                {row.status === "subscribed" ? <MailX size={15} /> : <RotateCcw size={15} />}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(t("admin.newsletter.confirmDelete"))) remove.mutate(row.id);
                }}
                className="rounded-full p-2 text-muted transition-colors hover:text-red-600 cursor-pointer"
                aria-label={t("common.delete")}
                title={t("common.delete")}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
