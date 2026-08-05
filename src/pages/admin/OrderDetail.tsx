import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Field";
import { StatusBadge } from "./components/StatusBadge";
import { useOrder, useUpdateOrderStatus } from "@/hooks/useOrders";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatDate, formatPrice } from "@/lib/format";
import { pickLang } from "@/lib/localized";
import type { OrderStatus } from "@/types/db";

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export function AdminOrderDetail() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { data: order, isLoading } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();

  if (isLoading) return <p className="text-muted">{t("common.loading")}</p>;
  if (!order) return <p className="text-muted">{t("confirm.notFound")}</p>;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
        <ChevronLeft size={15} className="rtl:rotate-180" />
        {t("common.back")}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl" dir="ltr">
          {order.order_number}
        </h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">{formatDate(order.created_at, lang)}</span>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Panel className="p-6">
          <h2 className="font-display text-xl">{t("admin.orders.customer")}</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("checkout.name")}</dt>
              <dd className="font-medium">{order.customer_name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("admin.orders.phone")}</dt>
              <dd className="font-medium" dir="ltr">
                {order.customer_phone}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("checkout.wilaya")}</dt>
              <dd>{order.wilaya}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("checkout.city")}</dt>
              <dd>{order.city}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t("checkout.deliveryType")}</dt>
              <dd>{order.delivery_type === "office" ? t("checkout.office") : t("checkout.home")}</dd>
            </div>
          </dl>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-display text-xl">{t("admin.orders.updateStatus")}</h2>
          <Select
            className="mt-3"
            value={order.status}
            disabled={updateStatus.isPending}
            onChange={(e) =>
              updateStatus.mutate({ id: order.id, status: e.target.value as OrderStatus })
            }
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`admin.status.${status}`)}
              </option>
            ))}
          </Select>
          <div className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t("checkout.subtotal")}</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t("checkout.shipping")}</span>
              <span>{formatPrice(Number(order.shipping))}</span>
            </div>
            <div className="flex justify-between pt-1 font-semibold">
              <span>{t("checkout.total")}</span>
              <span className="text-brand">{formatPrice(Number(order.total))}</span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="mt-5 p-6">
        <h2 className="font-display text-xl">{t("admin.orders.items")}</h2>
        <ul className="mt-3 space-y-3">
          {(order.order_items ?? []).map((item) => (
            <li key={item.id} className="flex items-center gap-3 text-sm">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt=""
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  className="h-12 w-12 rounded-lg border border-line object-contain"
                />
              )}
              <span className="min-w-0 flex-1 truncate">
                {pickLang(lang, item.name_fr, item.name_ar)} × {item.quantity}
              </span>
              <span className="font-medium">{formatPrice(Number(item.price) * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
