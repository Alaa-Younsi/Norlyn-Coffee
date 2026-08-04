import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import {
  CustomerBreakdown,
  LedgerSummary,
  ProductBreakdown,
  RangeFilter,
  SectionTabs,
} from "@/components/admin/LedgerUI";
import { TrendChart } from "@/components/admin/TrendChart";
import { ExpensesPanel, PurchasesPanel, SuppliersPanel } from "@/components/admin/LedgerPanels";
import {
  StoreCatalogPanel,
  StoreSalesList,
  StoreSalesPanel,
} from "@/components/admin/StorePanels";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import { useExpenses, useStockPurchases } from "@/hooks/useFinance";
import { useStoreProducts, useStoreSales } from "@/hooks/useStoreLedger";
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

const TABS: Array<{ value: string; labelKey: TranslationKey }> = [
  { value: "overview", labelKey: "admin.fin.tabOverview" },
  { value: "till", labelKey: "admin.fin.tabTill" },
  { value: "sales", labelKey: "admin.fin.tabSales" },
  { value: "catalogue", labelKey: "admin.fin.tabCatalogue" },
  { value: "products", labelKey: "admin.fin.tabProducts" },
  { value: "clients", labelKey: "admin.fin.tabClients" },
  { value: "purchases", labelKey: "admin.fin.tabPurchases" },
  { value: "expenses", labelKey: "admin.fin.tabExpenses" },
  { value: "suppliers", labelKey: "admin.fin.tabSuppliers" },
];

/**
 * Structurally the twin of Finance.tsx over a completely separate set of
 * tables. `shipping: 0` on every fact — nothing is delivered from a counter.
 */
export function AdminStoreLedger() {
  const { t } = useLanguage();
  const [range, setRange] = useState<DateRange>(() => buildRange("month"));
  const [tab, setTab] = useState("overview");

  const { data: sales } = useStoreSales();
  const { data: products } = useStoreProducts();
  const { data: expenses } = useExpenses("store");
  const { data: purchases } = useStockPurchases("store");

  const facts: SaleFact[] = useMemo(
    () =>
      (sales ?? []).map((sale) => ({
        id: sale.id,
        reference: sale.sale_number,
        day: toLocalDay(sale.sold_at),
        customerName: sale.customer_name ?? "",
        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount),
        shipping: 0,
        lines: (sale.store_sale_items ?? []).map((item) => ({
          itemKey: item.store_product_id ?? item.name,
          itemName: item.name,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          unitCost: Number(item.unit_cost),
        })),
      })),
    [sales],
  );

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

  const catalogue = useMemo(
    () => (products ?? []).map((product) => ({ id: product.id, name: product.name })),
    [products],
  );

  const exportCsv = () => {
    downloadCsv(
      `magasin-${toLocalDay(new Date())}.csv`,
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
          <h1 className="font-display text-3xl">{t("admin.fin.storeTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("admin.fin.storeSubtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download size={15} />
          {t("admin.fin.export")}
        </Button>
      </div>

      <div className="mt-6">
        <RangeFilter range={range} onChange={setRange} />
      </div>

      <div className="mt-6">
        <LedgerSummary totals={totals} previous={previousTotals} />
      </div>

      <div className="mt-8">
        <SectionTabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div className="mt-6">
        {tab === "overview" && <TrendChart points={series} />}
        {tab === "till" && <StoreSalesPanel />}
        {tab === "sales" && <StoreSalesList range={range} />}
        {tab === "catalogue" && <StoreCatalogPanel />}
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
        {tab === "purchases" && (
          <PurchasesPanel scope="store" range={range} items={catalogue} />
        )}
        {tab === "expenses" && <ExpensesPanel scope="store" range={range} />}
        {tab === "suppliers" && <SuppliersPanel />}
      </div>
    </div>
  );
}
