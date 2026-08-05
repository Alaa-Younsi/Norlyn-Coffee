import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { Price } from "@/components/ui/Price";
import { Select } from "@/components/ui/Field";
import {
  CustomerBreakdown,
  LedgerSummary,
  ProductBreakdown,
  RangeFilter,
  SectionTabs,
} from "@/components/admin/LedgerUI";
import { TrendChart } from "@/components/admin/TrendChart";
import { ExpensesPanel, PurchasesPanel, SuppliersPanel } from "@/components/admin/LedgerPanels";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import {
  useExpenses,
  useOrdersLedger,
  useProductCosts,
  useSaveProductCost,
  useStockPurchases,
  useSuppliers,
} from "@/hooks/useFinance";
import {
  buildRange,
  buildSeries,
  byCustomer,
  byProduct,
  computeTotals,
  inRange,
  previousRange,
  toLocalDay,
} from "@/lib/finance";
import type { CostFact, DateRange, SaleFact } from "@/lib/finance";
import { downloadCsv } from "@/lib/csv";
import { pickLang } from "@/lib/localized";
import { cn } from "@/lib/utils";

const TABS: Array<{ value: string; labelKey: TranslationKey }> = [
  { value: "overview", labelKey: "admin.fin.tabOverview" },
  { value: "products", labelKey: "admin.fin.tabProducts" },
  { value: "clients", labelKey: "admin.fin.tabClients" },
  { value: "costs", labelKey: "admin.fin.tabCosts" },
  { value: "purchases", labelKey: "admin.fin.tabPurchases" },
  { value: "expenses", labelKey: "admin.fin.tabExpenses" },
  { value: "suppliers", labelKey: "admin.fin.tabSuppliers" },
];

type Basis = "booked" | "delivered";

export function AdminFinance() {
  const { t, lang } = useLanguage();
  const [range, setRange] = useState<DateRange>(() => buildRange("month"));
  const [tab, setTab] = useState("overview");
  const [basis, setBasis] = useState<Basis>("booked");

  const { data: orders } = useOrdersLedger();
  const { data: expenses } = useExpenses("online");
  const { data: purchases } = useStockPurchases("online");
  const { data: costRows } = useProductCosts();

  // the website catalogue this ledger buys stock for
  const catalogue = useMemo(
    () =>
      (costRows ?? [])
        .filter((row) => row.product)
        .map((row) => ({
          id: row.product_id,
          name: pickLang(lang, row.product?.name_fr, row.product?.name_ar) ?? "",
        })),
    [costRows, lang],
  );

  // On cash-on-delivery, booked and delivered are genuinely different
  // businesses: booked is the dispatcher's working view (and matches the
  // dashboard's revenue tile); delivered is cash actually collected.
  const facts: SaleFact[] = useMemo(() => {
    return (orders ?? [])
      .filter((order) =>
        basis === "delivered" ? order.status === "delivered" : order.status !== "cancelled",
      )
      .map((order) => ({
        id: order.id,
        reference: order.order_number,
        day: toLocalDay(order.created_at),
        customerName: order.customer_name,
        subtotal: Number(order.subtotal),
        discount: 0,
        shipping: Number(order.shipping),
        lines: (order.order_items ?? []).map((item) => ({
          itemKey: item.product_id ?? item.name_fr,
          itemName: pickLang(lang, item.name_fr, item.name_ar),
          quantity: item.quantity,
          unitPrice: Number(item.price),
          unitCost: Number(item.unit_cost ?? 0),
        })),
      }));
  }, [orders, basis, lang]);

  const expenseFacts: CostFact[] = useMemo(
    () =>
      (expenses ?? []).map((expense) => ({
        id: expense.id,
        day: toLocalDay(expense.spent_at),
        label: expense.label,
        amount: Number(expense.amount),
      })),
    [expenses],
  );

  const purchaseFacts: CostFact[] = useMemo(
    () =>
      (purchases ?? []).map((purchase) => ({
        id: purchase.id,
        day: toLocalDay(purchase.purchased_at),
        label: purchase.label ?? "—",
        amount: Number(purchase.total_cost),
      })),
    [purchases],
  );

  const windowed = useMemo(() => {
    const previous = previousRange(range);
    const pick = <T extends { day: string }>(rows: T[], r: DateRange) =>
      rows.filter((row) => inRange(row.day, r));

    return {
      sales: pick(facts, range),
      expenses: pick(expenseFacts, range),
      purchases: pick(purchaseFacts, range),
      previous: previous
        ? {
            sales: pick(facts, previous),
            expenses: pick(expenseFacts, previous),
            purchases: pick(purchaseFacts, previous),
          }
        : null,
    };
  }, [facts, expenseFacts, purchaseFacts, range]);

  const totals = computeTotals(windowed.sales, windowed.expenses, windowed.purchases);
  const previousTotals = windowed.previous
    ? computeTotals(
        windowed.previous.sales,
        windowed.previous.expenses,
        windowed.previous.purchases,
      )
    : null;

  const series = useMemo(
    () => buildSeries(windowed.sales, windowed.expenses, range),
    [windowed.sales, windowed.expenses, range],
  );

  const productRows = useMemo(() => byProduct(windowed.sales), [windowed.sales]);
  const customerRows = useMemo(() => byCustomer(windowed.sales), [windowed.sales]);

  const exportCsv = () => {
    downloadCsv(
      `finances-site-${toLocalDay(new Date())}.csv`,
      [
        t("admin.bd.product"),
        t("admin.bd.qty"),
        t("admin.bd.revenue"),
        t("admin.bd.cost"),
        t("admin.bd.profit"),
      ],
      productRows.map((row) => [
        row.name,
        row.quantity,
        row.revenue.toFixed(2),
        row.cost.toFixed(2),
        row.profit.toFixed(2),
      ]),
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{t("admin.fin.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("admin.fin.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download size={15} />
          {t("admin.fin.export")}
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-6">
        <RangeFilter range={range} onChange={setRange} />
        <label className="text-sm">
          <span className="mb-1 block text-muted">{t("admin.fin.basis")}</span>
          <Select
            className="w-44"
            value={basis}
            onChange={(e) => setBasis(e.target.value as Basis)}
          >
            <option value="booked">{t("admin.fin.basisBooked")}</option>
            <option value="delivered">{t("admin.fin.basisDelivered")}</option>
          </Select>
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">{t("admin.fin.basisHint")}</p>

      <div className="mt-6">
        <LedgerSummary totals={totals} previous={previousTotals} />
      </div>

      <div className="mt-8">
        <SectionTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div className="mt-6">
        {tab === "overview" && <TrendChart points={series} />}
        {tab === "products" && (
          <Panel className="overflow-hidden">
            <ProductBreakdown rows={productRows} />
          </Panel>
        )}
        {tab === "clients" && (
          <Panel className="overflow-hidden">
            <CustomerBreakdown rows={customerRows} />
          </Panel>
        )}
        {tab === "costs" && <CostsTab />}
        {tab === "purchases" && (
          <PurchasesPanel scope="online" range={range} items={catalogue} />
        )}
        {tab === "expenses" && <ExpensesPanel scope="online" range={range} />}
        {tab === "suppliers" && <SuppliersPanel />}
      </div>
    </div>
  );
}

/** Buy-price editor — the tab that turns "profit = revenue" into real margin. */
function CostsTab() {
  const { t, lang } = useLanguage();
  const { data: rows } = useProductCosts();
  const { data: suppliers } = useSuppliers();
  const saveCost = useSaveProductCost();
  const [search, setSearch] = useState("");

  const filtered = (rows ?? []).filter((row) => {
    const name = pickLang(lang, row.product?.name_fr, row.product?.name_ar);
    return (name ?? "").toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <div>
      <p className="text-xs text-muted">{t("admin.fin.costsWarning")}</p>
      <Input
        className="mt-3 max-w-sm"
        placeholder={t("admin.cost.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="mt-4 space-y-2">
        {filtered.map((row) => {
          const price = Number(row.product?.price ?? 0);
          const cost = Number(row.cost_price);
          const margin = price > 0 ? (price - cost) / price : 0;
          return (
            <Panel key={row.product_id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {pickLang(lang, row.product?.name_fr, row.product?.name_ar)}
                </p>
                <p className="text-xs text-muted">
                  {t("admin.cost.sellPrice")}: <Price value={price} />
                </p>
              </div>

              <label className="text-xs text-muted">
                <span className="mb-1 block">{t("admin.cost.buyPrice")}</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-32"
                  defaultValue={cost}
                  onBlur={(e) =>
                    saveCost.mutate({
                      product_id: row.product_id,
                      cost_price: Number(e.target.value) || 0,
                      supplier_id: row.supplier_id,
                    })
                  }
                />
              </label>

              <label className="text-xs text-muted">
                <span className="mb-1 block">{t("admin.cost.supplier")}</span>
                <Select
                  className="w-40"
                  defaultValue={row.supplier_id ?? ""}
                  onChange={(e) =>
                    saveCost.mutate({
                      product_id: row.product_id,
                      cost_price: cost,
                      supplier_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">{t("admin.cost.noSupplier")}</option>
                  {(suppliers ?? []).map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </Select>
              </label>

              {/* red when negative — that is the client discovering they are
                  selling at a loss */}
              <span
                className={cn(
                  "w-16 text-end text-sm tabular-nums",
                  margin < 0 ? "text-red-700 dark:text-red-400" : "text-muted",
                )}
                dir="ltr"
              >
                {(margin * 100).toFixed(0)} %
              </span>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
