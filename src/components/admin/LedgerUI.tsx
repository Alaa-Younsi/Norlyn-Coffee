import { Panel } from "@/components/ui/Panel";
import { Price } from "@/components/ui/Price";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import type { CustomerRow, DateRange, ProductRow, RangePreset, Totals } from "@/lib/finance";
import { buildRange } from "@/lib/finance";
import { cn } from "@/lib/utils";

const PRESETS: Array<{ value: RangePreset; labelKey: TranslationKey }> = [
  { value: "day", labelKey: "admin.fin.rangeDay" },
  { value: "week", labelKey: "admin.fin.rangeWeek" },
  { value: "month", labelKey: "admin.fin.rangeMonth" },
  { value: "year", labelKey: "admin.fin.rangeYear" },
  { value: "max", labelKey: "admin.fin.rangeMax" },
  { value: "custom", labelKey: "admin.fin.rangeCustom" },
];

/** Trailing windows ending today — never calendar weeks/months. */
export function RangeFilter({
  range,
  onChange,
}: {
  range: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const { t } = useLanguage();

  return (
    <div>
      {/* scrolls, never wraps: a wrapped row changes height when the labels
          change length between FR and AR and reflows the page mid-tap */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() =>
              onChange(
                preset.value === "custom"
                  ? { preset: "custom", from: range.from, to: range.to }
                  : buildRange(preset.value),
              )
            }
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors cursor-pointer",
              range.preset === preset.value
                ? "border-brand bg-brand/10 font-medium text-brand"
                : "border-line text-muted hover:border-brand/50",
            )}
          >
            {t(preset.labelKey)}
          </button>
        ))}
      </div>

      {range.preset === "custom" && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">{t("admin.fin.from")}</span>
            <input
              type="date"
              value={range.from ?? ""}
              onChange={(e) => onChange({ ...range, from: e.target.value || null })}
              className="rounded-xl border border-line bg-panel px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">{t("admin.fin.to")}</span>
            <input
              type="date"
              value={range.to ?? ""}
              onChange={(e) => onChange({ ...range, to: e.target.value || null })}
              className="rounded-xl border border-line bg-panel px-3 py-2 text-sm"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export function SectionTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ value: string; labelKey: TranslationKey }>;
  active: string;
  onChange: (value: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-line pb-0">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors cursor-pointer",
            active === tab.value
              ? "border-brand font-semibold text-brand"
              : "border-transparent text-muted hover:text-ink",
          )}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  );
}

/**
 * One figure, a delta badge vs. the previous period (hidden when there is no
 * previous), an optional hint line.
 */
export function StatTile({
  label,
  value,
  previous,
  hint,
  invertDelta,
  negative,
  percent,
  plain,
}: {
  label: string;
  value: number;
  previous?: number | null;
  hint?: string;
  /** a rise is the BAD direction (cost-type tiles) */
  invertDelta?: boolean;
  /** paint red when below zero (gross/net profit) */
  negative?: boolean;
  percent?: boolean;
  /** a count, not an amount */
  plain?: boolean;
}) {
  const hasPrevious = previous !== null && previous !== undefined && previous !== 0;
  const delta = hasPrevious ? ((value - previous) / Math.abs(previous)) * 100 : null;
  const good = delta === null ? null : invertDelta ? delta <= 0 : delta >= 0;

  return (
    <Panel className="p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-display text-xl font-semibold tabular-nums",
          negative && value < 0 ? "text-red-700 dark:text-red-400" : "text-ink",
        )}
      >
        {percent ? (
          <span dir="ltr">{(value * 100).toFixed(1)} %</span>
        ) : plain ? (
          <span dir="ltr">{value}</span>
        ) : (
          <Price value={value} />
        )}
      </p>
      {delta !== null && (
        <p
          className={cn(
            "mt-1 text-xs tabular-nums",
            good ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
          )}
          dir="ltr"
        >
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)} %
        </p>
      )}
      {hint && <p className="mt-1 text-[11px] leading-snug text-muted">{hint}</p>}
    </Panel>
  );
}

/**
 * The eight-tile P&L header, ordered the way the money moves so it reads as a
 * statement instead of a tile hunt.
 */
export function LedgerSummary({
  totals,
  previous,
}: {
  totals: Totals;
  previous: Totals | null;
}) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label={t("admin.fin.revenue")}
        value={totals.revenue}
        previous={previous?.revenue}
        hint={t("admin.fin.revenueHint")}
      />
      <StatTile
        label={t("admin.fin.cogs")}
        value={totals.cogs}
        previous={previous?.cogs}
        invertDelta
      />
      <StatTile
        label={t("admin.fin.gross")}
        value={totals.grossProfit}
        previous={previous?.grossProfit}
        negative
      />
      <StatTile
        label={t("admin.fin.expenses")}
        value={totals.expenses}
        previous={previous?.expenses}
        invertDelta
      />
      <StatTile
        label={t("admin.fin.net")}
        value={totals.netProfit}
        previous={previous?.netProfit}
        negative
      />
      <StatTile label={t("admin.fin.margin")} value={totals.margin} percent />
      <StatTile
        label={t("admin.fin.sales")}
        value={totals.salesCount}
        previous={previous?.salesCount}
        plain
      />
      <StatTile
        label={t("admin.fin.purchases")}
        value={totals.purchases}
        previous={previous?.purchases}
        invertDelta
        hint={t("admin.fin.purchasesHint")}
      />
    </div>
  );
}

/** Own overflow-x-auto: letting a wide table size the page drags the shell. */
export function ProductBreakdown({ rows }: { rows: ProductRow[] }) {
  const { t } = useLanguage();
  if (rows.length === 0) return <p className="p-6 text-sm text-muted">{t("admin.bd.none")}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <th className="px-4 py-3 text-start">{t("admin.bd.product")}</th>
            <th className="px-4 py-3 text-end">{t("admin.bd.qty")}</th>
            <th className="px-4 py-3 text-end">{t("admin.bd.revenue")}</th>
            <th className="px-4 py-3 text-end">{t("admin.bd.cost")}</th>
            <th className="px-4 py-3 text-end">{t("admin.bd.profit")}</th>
            <th className="px-4 py-3 text-end">{t("admin.bd.margin")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-line/60 last:border-0">
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3 text-end tabular-nums" dir="ltr">
                {row.quantity}
              </td>
              <td className="px-4 py-3 text-end tabular-nums">
                <Price value={row.revenue} />
              </td>
              <td className="px-4 py-3 text-end tabular-nums">
                <Price value={row.cost} />
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-end tabular-nums",
                  row.profit < 0 && "text-red-700 dark:text-red-400",
                )}
              >
                <Price value={row.profit} />
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-end tabular-nums",
                  row.margin < 0 && "text-red-700 dark:text-red-400",
                )}
                dir="ltr"
              >
                {(row.margin * 100).toFixed(0)} %
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CustomerBreakdown({ rows }: { rows: CustomerRow[] }) {
  const { t } = useLanguage();
  if (rows.length === 0) return <p className="p-6 text-sm text-muted">{t("admin.bd.none")}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[460px] text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <th className="px-4 py-3 text-start">{t("admin.bd.client")}</th>
            <th className="px-4 py-3 text-end">{t("admin.bd.orders")}</th>
            <th className="px-4 py-3 text-end">{t("admin.bd.revenue")}</th>
            <th className="px-4 py-3 text-end">{t("admin.bd.profit")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-line/60 last:border-0">
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3 text-end tabular-nums" dir="ltr">
                {row.orders}
              </td>
              <td className="px-4 py-3 text-end tabular-nums">
                <Price value={row.revenue} />
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-end tabular-nums",
                  row.profit < 0 && "text-red-700 dark:text-red-400",
                )}
              >
                <Price value={row.profit} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
