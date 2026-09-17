import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Download, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Price } from "@/components/ui/Price";
import { Select } from "@/components/ui/Field";
import { DeleteAllOrdersModal } from "@/components/admin/DeleteAllOrdersModal";
import { StatusBadge } from "./components/StatusBadge";
import { ordersQueryOptions, ORDERS_LIMIT, useUpdateOrderStatus } from "@/hooks/useOrders";
import { useLanguage } from "@/i18n/LanguageProvider";
import { exportOrders } from "@/lib/exportOrders";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/db";

// Pending first, then the fulfilment pipeline, cancelled last — this mirrors
// what a dispatcher actually does all day: confirm the new ones, then track
// what's moving. Sections open by default only where action is expected.
const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const DEFAULT_OPEN: Record<OrderStatus, boolean> = {
  pending: true,
  confirmed: true,
  shipped: false,
  delivered: false,
  cancelled: false,
};

function matchesSearch(order: Order, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  return (
    order.order_number.toLowerCase().includes(q) ||
    order.customer_name.toLowerCase().includes(q) ||
    order.customer_phone.toLowerCase().includes(q)
  );
}

export function AdminOrders() {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Record<OrderStatus, boolean>>(DEFAULT_OPEN);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Board-rail filter: null = every non-empty section shows, one status =
  // only that section shows (forced open, even if it turns out empty — the
  // tap still needs to give feedback).
  const [boardFilter, setBoardFilter] = useState<OrderStatus | null>(null);
  const updateStatus = useUpdateOrderStatus();

  const results = useQueries({
    queries: STATUSES.map((status) => ordersQueryOptions(status)),
  });

  const byStatus = useMemo(() => {
    const map = {} as Record<OrderStatus, Order[]>;
    STATUSES.forEach((status, i) => {
      const rows = results[i].data ?? [];
      map[status] = rows.filter((o) => matchesSearch(o, search));
    });
    return map;
  }, [results, search]);

  // Board tiles reflect the true per-status count/total regardless of the
  // search box — they're a dispatcher's at-a-glance summary, not a filtered view.
  const boardTotals = useMemo(() => {
    const map = {} as Record<OrderStatus, { count: number; money: number }>;
    STATUSES.forEach((status, i) => {
      const rows = results[i].data ?? [];
      map[status] = { count: rows.length, money: rows.reduce((sum, o) => sum + Number(o.total), 0) };
    });
    return map;
  }, [results]);

  const allRows = useMemo(() => STATUSES.flatMap((s) => byStatus[s]), [byStatus]);
  const totalUnfiltered = results.reduce((sum, r) => sum + (r.data?.length ?? 0), 0);
  const anyLoading = results.some((r) => r.isLoading);

  const deleteAll = useMutation({
    mutationFn: async () => {
      // Supabase refuses an unfiltered .delete(); order_items go with it via
      // the FK cascade.
      const { error } = await supabase.from("orders").delete().not("id", "is", null);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orders-ledger"] });
      setConfirmDelete(false);
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{t("admin.nav.orders")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted start-3.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.orders.search")}
              aria-label={t("admin.orders.search")}
              className="w-56 rounded-full border border-line bg-panel py-2 text-sm ps-9 pe-4 text-ink placeholder:text-muted/70 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void exportOrders(allRows)}
            disabled={allRows.length === 0}
          >
            <Download size={15} />
            {t("admin.orders.export")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            disabled={totalUnfiltered === 0}
          >
            <Trash2 size={15} />
            {t("admin.orders.deleteAll")}
          </Button>
        </div>
      </div>

      {confirmDelete && (
        <DeleteAllOrdersModal
          count={totalUnfiltered}
          deleting={deleteAll.isPending}
          onExport={() => void exportOrders(results.flatMap((r) => r.data ?? []))}
          onConfirm={() => deleteAll.mutate()}
          onClose={() => setConfirmDelete(false)}
        />
      )}

      {search && allRows.length === 0 && !anyLoading && (
        <p className="mt-6 rounded-xl border border-line bg-panel-2/60 px-4 py-2.5 text-sm text-muted">
          {t("admin.orders.noResults")}
        </p>
      )}

      <div
        className="mt-6 flex gap-2.5 overflow-x-auto pb-1"
        role="group"
        aria-label={t("admin.orders.filter")}
      >
        {STATUSES.map((status) => {
          const { count, money } = boardTotals[status];
          const active = boardFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setBoardFilter((prev) => (prev === status ? null : status))}
              aria-pressed={active}
              className={cn(
                "flex shrink-0 flex-col gap-1 rounded-xl border px-4 py-3 text-start transition-colors cursor-pointer",
                active
                  ? "border-brand bg-brand/10 ring-2 ring-brand/30"
                  : "border-line bg-panel hover:border-brand/50",
              )}
            >
              <StatusBadge status={status} />
              <span className="text-lg font-semibold" dir="ltr">
                {count}
              </span>
              <Price value={money} className="text-xs text-muted" />
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-4">
        {STATUSES.map((status, i) => {
          const result = results[i];
          const rows = byStatus[status];
          const isFiltered = boardFilter !== null;
          if (isFiltered && boardFilter !== status) return null;
          // With no board filter, an empty section (no matches at all, search
          // included) just clutters the desk — hide it. With a filter on,
          // always render the section, even empty, so the tap gives feedback.
          if (!isFiltered && rows.length === 0 && !anyLoading) return null;
          const isOpen = isFiltered ? true : open[status];
          return (
            <Panel key={status} className="overflow-hidden">
              <div className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setOpen((prev) => ({ ...prev, [status]: !prev[status] }))}
                  aria-expanded={isOpen}
                  aria-label={t("admin.orders.toggleSection")}
                  className="flex min-w-0 flex-1 items-center gap-3 text-start cursor-pointer"
                >
                  <ChevronDown
                    size={16}
                    className={cn("shrink-0 text-muted transition-transform", isOpen ? "rotate-0" : "-rotate-90 rtl:rotate-90")}
                  />
                  <StatusBadge status={status} />
                  <span className="text-sm text-muted">{rows.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void exportOrders(rows, status)}
                  disabled={rows.length === 0}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand hover:text-brand cursor-pointer disabled:pointer-events-none disabled:opacity-40"
                >
                  <Download size={13} />
                  {t("admin.orders.exportSection")}
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-line">
                  {result.isLoading ? (
                    <p className="p-6 text-sm text-muted">{t("common.loading")}</p>
                  ) : rows.length === 0 ? (
                    <p className="p-6 text-sm text-muted">
                      {search ? t("admin.orders.noResults") : t("admin.orders.noneStatus")}
                    </p>
                  ) : (
                    <>
                      {(result.data?.length ?? 0) >= ORDERS_LIMIT && (
                        <p className="border-b border-line/60 bg-panel-2/40 px-5 py-2 text-xs text-muted">
                          <span dir="ltr">{ORDERS_LIMIT}</span> {t("admin.orders.truncated")}
                        </p>
                      )}
                      {/* Phones get cards, not a table — a 7-column table at
                          360px drags the whole admin page sideways. */}
                      <div className="grid gap-3 p-4 sm:hidden">
                        {rows.map((order) => (
                          <div key={order.id} className="rounded-xl border border-line bg-panel-2/40 p-4">
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                to={`/admin/orders/${order.id}`}
                                className="font-medium text-brand hover:underline"
                                dir="ltr"
                              >
                                {order.order_number}
                              </Link>
                              <Price value={Number(order.total)} className="font-semibold" />
                            </div>
                            <p className="mt-1.5 text-sm">{order.customer_name}</p>
                            <p className="text-sm text-muted" dir="ltr">
                              {order.customer_phone}
                            </p>
                            <p className="text-sm text-muted">{order.wilaya}</p>
                            <div className="mt-2 flex items-center justify-between gap-2 border-t border-line/60 pt-2">
                              <span className="text-xs text-muted">{formatDate(order.created_at, lang)}</span>
                              <OrderStatusPicker
                                order={order}
                                onChange={(next) => updateStatus.mutate({ id: order.id, status: next })}
                                disabled={updateStatus.isPending}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="hidden overflow-x-auto sm:block">
                        <table className="min-w-[700px] w-full whitespace-nowrap text-sm">
                          <thead>
                            <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                              <th className="px-5 py-3 text-start">N°</th>
                              <th className="px-5 py-3 text-start">{t("admin.orders.customer")}</th>
                              <th className="px-5 py-3 text-start">{t("admin.orders.phone")}</th>
                              <th className="px-5 py-3 text-start">{t("checkout.wilaya")}</th>
                              <th className="px-5 py-3 text-start">{t("admin.orders.total")}</th>
                              <th className="px-5 py-3 text-start">{t("admin.orders.date")}</th>
                              <th className="px-5 py-3 text-start">{t("admin.orders.updateStatus")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((order) => (
                              <tr key={order.id} className="border-b border-line/60 last:border-0 hover:bg-panel-2/50">
                                <td className="px-5 py-3">
                                  <Link
                                    to={`/admin/orders/${order.id}`}
                                    className="font-medium text-brand hover:underline"
                                    dir="ltr"
                                  >
                                    {order.order_number}
                                  </Link>
                                </td>
                                <td className="px-5 py-3">{order.customer_name}</td>
                                <td className="px-5 py-3" dir="ltr">
                                  {order.customer_phone}
                                </td>
                                <td className="px-5 py-3">{order.wilaya}</td>
                                <td className="px-5 py-3">
                                  <Price value={Number(order.total)} />
                                </td>
                                <td className="px-5 py-3 text-muted">{formatDate(order.created_at, lang)}</td>
                                <td className="px-5 py-3">
                                  <OrderStatusPicker
                                    order={order}
                                    onChange={(next) => updateStatus.mutate({ id: order.id, status: next })}
                                    disabled={updateStatus.isPending}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/** Per-row status advance — lets a dispatcher move an order along the
 * pipeline without opening it. Restock on cancellation is a server-side
 * trigger (see 0003_functions.sql), so this needs no special case. */
function OrderStatusPicker({
  order,
  onChange,
  disabled,
}: {
  order: Order;
  onChange: (status: OrderStatus) => void;
  disabled: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="w-36 shrink-0">
      <Select
        value={order.status}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        aria-label={t("admin.orders.updateStatus")}
      >
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(`admin.status.${status}`)}
          </option>
        ))}
      </Select>
    </div>
  );
}
