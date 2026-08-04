import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { Price } from "@/components/ui/Price";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import { useSuppliers } from "@/hooks/useFinance";
import {
  storeSaleErrorKey,
  useCreateStoreSale,
  useDeleteStoreProduct,
  useDeleteStoreSale,
  useSaveStoreProduct,
  useStoreProducts,
  useStoreSales,
} from "@/hooks/useStoreLedger";
import { inRange, toLocalDay } from "@/lib/finance";
import type { DateRange } from "@/lib/finance";
import { cn } from "@/lib/utils";
import type { PaymentMethod, StoreItemKind, StoreProduct } from "@/types/db";

const PAYMENTS: Array<{ value: PaymentMethod; labelKey: TranslationKey }> = [
  { value: "cash", labelKey: "admin.store.cash" },
  { value: "card", labelKey: "admin.store.card" },
  { value: "transfer", labelKey: "admin.store.transfer" },
  { value: "other", labelKey: "admin.store.other" },
];

const ERROR_KEYS: Record<string, TranslationKey> = {
  forbidden: "admin.store.errForbidden",
  empty: "admin.store.errEmpty",
  qty: "admin.store.errQty",
  notFound: "admin.store.errNotFound",
  stock: "admin.store.errStock",
  generic: "admin.store.errGeneric",
};

/* ------------------------------------------------------------ the catalogue */

interface CatalogDraft {
  id?: string;
  name: string;
  kind: StoreItemKind;
  sku: string;
  category: string;
  cost_price: number;
  price: number;
  stock: number;
  supplier_id: string;
  active: boolean;
}

function emptyCatalogDraft(): CatalogDraft {
  return {
    name: "",
    kind: "product",
    sku: "",
    category: "",
    cost_price: 0,
    price: 0,
    stock: 0,
    supplier_id: "",
    active: true,
  };
}

export function StoreCatalogPanel() {
  const { t } = useLanguage();
  const { data: products } = useStoreProducts();
  const { data: suppliers } = useSuppliers();
  const saveProduct = useSaveStoreProduct();
  const deleteProduct = useDeleteStoreProduct();
  const [draft, setDraft] = useState<CatalogDraft | null>(null);

  const isService = draft?.kind === "service";

  return (
    <div>
      <div className="flex justify-end">
        {!draft && (
          <Button size="sm" onClick={() => setDraft(emptyCatalogDraft())}>
            <Plus size={15} />
            {t("admin.store.newItem")}
          </Button>
        )}
      </div>

      {draft && (
        <Panel className="mt-4 p-5">
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveProduct.mutate(
                {
                  id: draft.id,
                  name: draft.name.trim(),
                  kind: draft.kind,
                  sku: draft.sku.trim() || null,
                  category: draft.category.trim() || null,
                  // a service books no phantom cost and holds no stock
                  cost_price: isService ? 0 : Number(draft.cost_price) || 0,
                  stock: isService ? 0 : Number(draft.stock) || 0,
                  price: Number(draft.price) || 0,
                  supplier_id: draft.supplier_id || null,
                  active: draft.active,
                },
                { onSuccess: () => setDraft(null) },
              );
            }}
          >
            <FieldWrapper label={t("admin.sup.name")}>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                required
              />
            </FieldWrapper>
            <FieldWrapper label={t("admin.store.kind")}>
              <Select
                value={draft.kind}
                onChange={(e) =>
                  // force cost/stock to 0 on the switch rather than carrying
                  // over whatever was typed before it
                  setDraft({
                    ...draft,
                    kind: e.target.value as StoreItemKind,
                    cost_price: e.target.value === "service" ? 0 : draft.cost_price,
                    stock: e.target.value === "service" ? 0 : draft.stock,
                  })
                }
              >
                <option value="product">{t("admin.store.kindProduct")}</option>
                <option value="service">{t("admin.store.kindService")}</option>
              </Select>
            </FieldWrapper>
            <FieldWrapper label={t("admin.store.sku")}>
              <Input
                dir="ltr"
                value={draft.sku}
                onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
              />
            </FieldWrapper>
            <FieldWrapper label={t("admin.store.category")}>
              <Input
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              />
            </FieldWrapper>
            <FieldWrapper label={t("admin.store.sellPrice")}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
              />
            </FieldWrapper>
            {!isService && (
              <>
                <FieldWrapper label={t("admin.store.buyPrice")}>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.cost_price}
                    onChange={(e) => setDraft({ ...draft, cost_price: Number(e.target.value) })}
                  />
                </FieldWrapper>
                <FieldWrapper label={t("admin.store.stock")}>
                  <Input
                    type="number"
                    min={0}
                    value={draft.stock}
                    onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })}
                  />
                </FieldWrapper>
              </>
            )}
            <FieldWrapper label={t("admin.cost.supplier")}>
              <Select
                value={draft.supplier_id}
                onChange={(e) => setDraft({ ...draft, supplier_id: e.target.value })}
              >
                <option value="">{t("admin.cost.noSupplier")}</option>
                {(suppliers ?? []).map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            </FieldWrapper>

            {isService && (
              <p className="text-xs text-muted sm:col-span-2 lg:col-span-3">
                {t("admin.store.serviceHint")}
              </p>
            )}

            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit" size="sm" disabled={saveProduct.isPending}>
                {t("common.save")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(null)}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {(products ?? []).length === 0 ? (
        <p className="p-6 text-sm text-muted">{t("admin.store.catalogueNone")}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {(products ?? []).map((product) => (
            <Panel
              key={product.id}
              className={cn("flex flex-wrap items-center gap-3 p-4", !product.active && "opacity-60")}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-muted">
                  {product.kind === "service"
                    ? t("admin.store.kindService")
                    : `${t("admin.store.stock")}: ${product.stock}`}
                  {product.category && ` · ${product.category}`}
                </p>
              </div>
              <Price value={Number(product.price)} className="text-sm tabular-nums" />
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft({
                    id: product.id,
                    name: product.name,
                    kind: product.kind,
                    sku: product.sku ?? "",
                    category: product.category ?? "",
                    cost_price: Number(product.cost_price),
                    price: Number(product.price),
                    stock: product.stock,
                    supplier_id: product.supplier_id ?? "",
                    active: product.active,
                  })
                }
              >
                {t("common.edit")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("common.delete")}
                onClick={() => deleteProduct.mutate(product.id)}
              >
                <Trash2 size={15} />
              </Button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ the till */

interface TicketLine {
  key: string;
  storeProductId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  /** snapshot from when the line was added — the server still re-checks */
  availableStock: number | null;
}

export function StoreSalesPanel() {
  const { t } = useLanguage();
  const { data: products } = useStoreProducts();
  const createSale = useCreateStoreSale();
  const [lines, setLines] = useState<TicketLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [customer, setCustomer] = useState("");
  const [pick, setPick] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addFromCatalogue = (product: StoreProduct) => {
    setLines((prev) => [
      ...prev,
      {
        key: `${product.id}-${Date.now()}`,
        storeProductId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: Number(product.price),
        availableStock: product.kind === "service" ? null : product.stock,
      },
    ]);
  };

  const addAdHoc = () => {
    setLines((prev) => [
      ...prev,
      {
        key: `adhoc-${Date.now()}`,
        storeProductId: null,
        name: "",
        quantity: 1,
        unitPrice: 0,
        availableStock: null,
      },
    ]);
  };

  const patch = (key: string, values: Partial<TicketLine>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...values } : line)));

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const blocked = lines.some(
    (line) =>
      (!line.storeProductId && !line.name.trim()) ||
      (line.availableStock !== null && line.quantity > line.availableStock),
  );

  const submit = () => {
    setError(null);
    setResult(null);
    if (lines.length === 0) {
      setError(t("admin.store.emptyTicket"));
      return;
    }
    createSale.mutate(
      {
        sale: {
          customer_name: customer.trim() || undefined,
          discount,
          payment_method: payment,
          sold_at: toLocalDay(new Date()),
        },
        items: lines.map((line) => ({
          store_product_id: line.storeProductId,
          name: line.name,
          quantity: line.quantity,
          unit_price: line.unitPrice,
        })),
      },
      {
        onSuccess: (saleNumber) => {
          setResult(saleNumber);
          setLines([]);
          setDiscount(0);
          setCustomer("");
        },
        onError: (mutationError) => {
          const key = storeSaleErrorKey((mutationError as Error).message ?? "");
          setError(t(ERROR_KEYS[key] ?? "admin.store.errGeneric"));
        },
      },
    );
  };

  return (
    <Panel className="p-5">
      <h3 className="font-display text-xl">{t("admin.store.till")}</h3>

      <div className="mt-4 flex flex-wrap gap-2">
        <Select
          value={pick}
          className="w-full sm:w-72"
          onChange={(e) => {
            const product = (products ?? []).find((p) => p.id === e.target.value);
            if (product) addFromCatalogue(product);
            setPick("");
          }}
        >
          <option value="">{t("admin.store.addLine")}</option>
          {(products ?? [])
            .filter((product) => product.active)
            .map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — {Number(product.price)}
                {product.kind === "product" ? ` (${product.stock} ${t("admin.store.remaining")})` : ""}
              </option>
            ))}
        </Select>
        <Button size="sm" variant="outline" onClick={addAdHoc}>
          <Plus size={15} />
          {t("admin.store.adhoc")}
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {lines.map((line) => {
          const overStock = line.availableStock !== null && line.quantity > line.availableStock;
          return (
            <div
              key={line.key}
              className={cn(
                "flex flex-wrap items-center gap-2 rounded-2xl border p-3",
                overStock ? "border-red-500/60" : "border-line",
              )}
            >
              {line.storeProductId ? (
                <span className="min-w-0 flex-1 truncate text-sm">{line.name}</span>
              ) : (
                <Input
                  className="min-w-0 flex-1"
                  placeholder={t("admin.store.adhocName")}
                  value={line.name}
                  onChange={(e) => patch(line.key, { name: e.target.value })}
                />
              )}

              {/* ≥36px targets */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="-"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line cursor-pointer"
                  onClick={() => patch(line.key, { quantity: Math.max(1, line.quantity - 1) })}
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm tabular-nums" dir="ltr">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  aria-label="+"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line cursor-pointer"
                  onClick={() => patch(line.key, { quantity: line.quantity + 1 })}
                >
                  <Plus size={14} />
                </button>
              </div>

              <Input
                type="number"
                min={0}
                step="0.01"
                className="w-28"
                value={line.unitPrice}
                onChange={(e) => patch(line.key, { unitPrice: Number(e.target.value) })}
              />

              <button
                type="button"
                aria-label={t("common.delete")}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted cursor-pointer hover:text-red-600"
                onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <FieldWrapper label={t("admin.store.customer")}>
          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} />
        </FieldWrapper>
        <FieldWrapper label={t("admin.store.discount")}>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
          />
        </FieldWrapper>
        <FieldWrapper label={t("admin.store.payment")}>
          <Select
            value={payment}
            onChange={(e) => setPayment(e.target.value as PaymentMethod)}
          >
            {PAYMENTS.map((method) => (
              <option key={method.value} value={method.value}>
                {t(method.labelKey)}
              </option>
            ))}
          </Select>
        </FieldWrapper>
      </div>

      <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">{t("admin.store.subtotal")}</span>
          <Price value={subtotal} className="tabular-nums" />
        </div>
        <div className="flex justify-between font-semibold">
          <span>{t("admin.store.total")}</span>
          <Price value={total} className="text-brand tabular-nums" />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
      {result && (
        <p className="mt-3 text-sm text-brand">
          {t("admin.store.done")} <span dir="ltr">{result}</span>
        </p>
      )}

      <Button
        className="mt-4"
        onClick={submit}
        disabled={createSale.isPending || blocked || lines.length === 0}
      >
        {createSale.isPending ? t("admin.store.submitting") : t("admin.store.submit")}
      </Button>
    </Panel>
  );
}

/* ------------------------------------------------------------- sales list */

export function StoreSalesList({ range }: { range: DateRange }) {
  const { t } = useLanguage();
  const { data: sales } = useStoreSales();
  const deleteSale = useDeleteStoreSale();

  const rows = (sales ?? []).filter((sale) => inRange(toLocalDay(sale.sold_at), range));

  if (rows.length === 0) return <p className="p-6 text-sm text-muted">{t("admin.store.salesNone")}</p>;

  return (
    <div className="space-y-2">
      {rows.map((sale) => (
        <Panel key={sale.id} className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium" dir="ltr">
              {sale.sale_number}
            </p>
            <p className="text-xs text-muted">
              {sale.customer_name ?? "—"} · <span dir="ltr">{sale.sold_at}</span> ·{" "}
              {(sale.store_sale_items ?? []).length} × {t("admin.bd.product")}
            </p>
          </div>
          <Price value={Number(sale.total)} className="text-sm tabular-nums" />
          <Button
            size="sm"
            variant="ghost"
            aria-label={t("common.delete")}
            onClick={() => {
              if (confirm(t("admin.store.deleteConfirm"))) deleteSale.mutate(sale.id);
            }}
          >
            <Trash2 size={15} />
          </Button>
        </Panel>
      ))}
    </div>
  );
}
