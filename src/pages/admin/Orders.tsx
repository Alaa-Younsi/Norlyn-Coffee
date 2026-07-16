import { useState } from "react";
import { Link } from "react-router-dom";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Field";
import { StatusBadge } from "./components/StatusBadge";
import { useOrders } from "@/hooks/useOrders";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderStatus } from "@/types/db";

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export function AdminOrders() {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const { data: orders, isLoading } = useOrders(filter || undefined);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{t("admin.nav.orders")}</h1>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | "")}
          className="w-52"
          aria-label={t("admin.orders.filter")}
        >
          <option value="">{t("admin.orders.all")}</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`admin.status.${status}`)}
            </option>
          ))}
        </Select>
      </div>

      <Panel className="mt-6 overflow-x-auto">
        {isLoading ? (
          <p className="p-6 text-sm text-muted">{t("common.loading")}</p>
        ) : !orders || orders.length === 0 ? (
          <p className="p-6 text-sm text-muted">{t("admin.dash.none")}</p>
        ) : (
          <table className="min-w-[680px] w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <th className="px-5 py-3 text-start">N°</th>
                <th className="px-5 py-3 text-start">{t("admin.orders.customer")}</th>
                <th className="px-5 py-3 text-start">{t("admin.orders.phone")}</th>
                <th className="px-5 py-3 text-start">{t("checkout.wilaya")}</th>
                <th className="px-5 py-3 text-start">{t("admin.orders.total")}</th>
                <th className="px-5 py-3 text-start">{t("admin.products.status")}</th>
                <th className="px-5 py-3 text-start">{t("admin.orders.date")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line/60 last:border-0 hover:bg-panel-2/50">
                  <td className="px-5 py-3">
                    <Link to={`/admin/orders/${order.id}`} className="font-medium text-brand hover:underline" dir="ltr">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{order.customer_name}</td>
                  <td className="px-5 py-3" dir="ltr">
                    {order.customer_phone}
                  </td>
                  <td className="px-5 py-3">{order.wilaya}</td>
                  <td className="px-5 py-3">{formatPrice(Number(order.total))}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3 text-muted">{formatDate(order.created_at, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
