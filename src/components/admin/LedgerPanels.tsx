import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { Price } from "@/components/ui/Price";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import {
  useApplyPurchaseToStock,
  useDeleteExpense,
  useDeletePurchase,
  useDeleteSupplier,
  useExpenses,
  useSaveExpense,
  useSavePurchase,
  useSaveSupplier,
  useStockPurchases,
  useSuppliers,
} from "@/hooks/useFinance";
import { toLocalDay } from "@/lib/finance";
import type { DateRange } from "@/lib/finance";
import { inRange } from "@/lib/finance";
import type { ExpenseCategory, LedgerScope } from "@/types/db";

const CATEGORIES: Array<{ value: ExpenseCategory; labelKey: TranslationKey }> = [
  { value: "rent", labelKey: "admin.exp.catRent" },
  { value: "salary", labelKey: "admin.exp.catSalary" },
  { value: "marketing", labelKey: "admin.exp.catMarketing" },
  { value: "delivery", labelKey: "admin.exp.catDelivery" },
  { value: "supplies", labelKey: "admin.exp.catSupplies" },
  { value: "utilities", labelKey: "admin.exp.catUtilities" },
  { value: "other", labelKey: "admin.exp.catOther" },
];

/* ------------------------------------------------------------- suppliers */

export function SuppliersPanel() {
  const { t } = useLanguage();
  const { data: suppliers } = useSuppliers();
  const saveSupplier = useSaveSupplier();
  const deleteSupplier = useDeleteSupplier();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  return (
    <div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          <Plus size={15} />
          {t("admin.sup.add")}
        </Button>
      </div>

      {open && (
        <Panel className="mt-4 p-5">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              saveSupplier.mutate(
                {
                  name: form.name.trim(),
                  phone: form.phone.trim() || null,
                  email: form.email.trim() || null,
                  address: form.address.trim() || null,
                },
                {
                  onSuccess: () => {
                    setForm({ name: "", phone: "", email: "", address: "" });
                    setOpen(false);
                  },
                },
              );
            }}
          >
            <FieldWrapper label={t("admin.sup.name")}>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </FieldWrapper>
            <FieldWrapper label={t("admin.sup.phone")}>
              <Input
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FieldWrapper>
            <FieldWrapper label={t("admin.sup.email")}>
              <Input
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FieldWrapper>
            <FieldWrapper label={t("admin.sup.address")}>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </FieldWrapper>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm" disabled={saveSupplier.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {(suppliers ?? []).length === 0 ? (
        <p className="p-6 text-sm text-muted">{t("admin.sup.none")}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {(suppliers ?? []).map((supplier) => (
            <Panel key={supplier.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{supplier.name}</p>
                <p className="text-xs text-muted" dir="ltr">
                  {[supplier.phone, supplier.email, supplier.address].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("common.delete")}
                onClick={() => deleteSupplier.mutate(supplier.id)}
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

/* -------------------------------------------------------------- purchases */

export function PurchasesPanel({
  scope,
  range,
  items,
}: {
  scope: LedgerScope;
  range: DateRange;
  /** the catalogue this scope buys from */
  items: Array<{ id: string; name: string }>;
}) {
  const { t } = useLanguage();
  const { data: purchases } = useStockPurchases(scope);
  const { data: suppliers } = useSuppliers();
  const savePurchase = useSavePurchase();
  const deletePurchase = useDeletePurchase();
  const applyToStock = useApplyPurchaseToStock();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    itemId: "",
    label: "",
    supplierId: "",
    quantity: 1,
    unitCost: 0,
    purchasedAt: toLocalDay(new Date()),
  });

  // filtered to the dashboard's period so the list reconciles with the totals
  const rows = (purchases ?? []).filter((p) => inRange(toLocalDay(p.purchased_at), range));

  return (
    <div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          <Plus size={15} />
          {t("admin.pur.add")}
        </Button>
      </div>

      {open && (
        <Panel className="mt-4 p-5">
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              savePurchase.mutate(
                {
                  scope,
                  product_id: scope === "online" ? form.itemId || null : null,
                  store_product_id: scope === "store" ? form.itemId || null : null,
                  label: form.label.trim() || null,
                  supplier_id: form.supplierId || null,
                  quantity: Number(form.quantity) || 0,
                  unit_cost: Number(form.unitCost) || 0,
                  purchased_at: form.purchasedAt,
                },
                { onSuccess: () => setOpen(false) },
              );
            }}
          >
            <FieldWrapper label={t("admin.pur.item")}>
              <Select
                value={form.itemId}
                onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              >
                <option value="">{t("admin.pur.freeLabel")}</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            {!form.itemId && (
              <FieldWrapper label={t("admin.pur.freeLabel")}>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </FieldWrapper>
            )}
            <FieldWrapper label={t("admin.cost.supplier")}>
              <Select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              >
                <option value="">{t("admin.cost.noSupplier")}</option>
                {(suppliers ?? []).map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label={t("admin.pur.qty")}>
              <Input
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </FieldWrapper>
            <FieldWrapper label={t("admin.pur.unitCost")}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.unitCost}
                onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
              />
            </FieldWrapper>
            <FieldWrapper label={t("admin.pur.date")}>
              <Input
                type="date"
                value={form.purchasedAt}
                onChange={(e) => setForm({ ...form, purchasedAt: e.target.value })}
              />
            </FieldWrapper>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" size="sm" disabled={savePurchase.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <p className="mt-4 text-xs text-muted">{t("admin.pur.applyHint")}</p>

      {rows.length === 0 ? (
        <p className="p-6 text-sm text-muted">{t("admin.pur.none")}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {rows.map((purchase) => {
            const item = items.find(
              (i) => i.id === (purchase.product_id ?? purchase.store_product_id),
            );
            return (
              <Panel key={purchase.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item?.name ?? purchase.label ?? "—"}</p>
                  <p className="text-xs text-muted" dir="ltr">
                    {purchase.quantity} × {Number(purchase.unit_cost)} · {purchase.purchased_at}
                  </p>
                </div>
                <Price value={Number(purchase.total_cost)} className="text-sm tabular-nums" />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={applyToStock.isPending}
                  onClick={() => applyToStock.mutate(purchase)}
                >
                  {t("admin.pur.apply")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t("common.delete")}
                  onClick={() => deletePurchase.mutate(purchase.id)}
                >
                  <Trash2 size={15} />
                </Button>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- expenses */

export function ExpensesPanel({ scope, range }: { scope: LedgerScope; range: DateRange }) {
  const { t } = useLanguage();
  const { data: expenses } = useExpenses(scope);
  const saveExpense = useSaveExpense();
  const deleteExpense = useDeleteExpense();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    label: "",
    category: "other" as ExpenseCategory,
    amount: 0,
    spentAt: toLocalDay(new Date()),
  });

  const rows = (expenses ?? []).filter((e) => inRange(toLocalDay(e.spent_at), range));

  return (
    <div>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          <Plus size={15} />
          {t("admin.exp.add")}
        </Button>
      </div>

      {open && (
        <Panel className="mt-4 p-5">
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveExpense.mutate(
                {
                  scope,
                  label: form.label.trim(),
                  category: form.category,
                  amount: Number(form.amount) || 0,
                  spent_at: form.spentAt,
                },
                { onSuccess: () => setOpen(false) },
              );
            }}
          >
            <FieldWrapper label={t("admin.exp.label")}>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
              />
            </FieldWrapper>
            <FieldWrapper label={t("admin.exp.category")}>
              <Select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as ExpenseCategory })
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {t(category.labelKey)}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label={t("admin.exp.amount")}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </FieldWrapper>
            <FieldWrapper label={t("admin.exp.date")}>
              <Input
                type="date"
                value={form.spentAt}
                onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
              />
            </FieldWrapper>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" size="sm" disabled={saveExpense.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {rows.length === 0 ? (
        <p className="p-6 text-sm text-muted">{t("admin.exp.none")}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((expense) => (
            <Panel key={expense.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{expense.label}</p>
                <p className="text-xs text-muted">
                  {t(
                    CATEGORIES.find((c) => c.value === expense.category)?.labelKey ??
                      "admin.exp.catOther",
                  )}{" "}
                  · <span dir="ltr">{expense.spent_at}</span>
                </p>
              </div>
              <Price value={Number(expense.amount)} className="text-sm tabular-nums" />
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("common.delete")}
                onClick={() => deleteExpense.mutate(expense.id)}
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
