import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "./components/StatusBadge";
import { useOrders } from "@/hooks/useOrders";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";
import { formatDate, formatPrice } from "@/lib/format";

export function Dashboard() {
  const { t, lang } = useLanguage();
  const { data: orders } = useOrders();

  const { data: activeProducts } = useQuery({
    queryKey: ["admin-active-products-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const pending = (orders ?? []).filter((o) => o.status === "pending").length;
  const revenue = (orders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const stats = [
    { label: t("admin.dash.orders"), value: String(orders?.length ?? 0) },
    { label: t("admin.dash.pending"), value: String(pending) },
    { label: t("admin.dash.revenue"), value: formatPrice(revenue) },
    { label: t("admin.dash.products"), value: String(activeProducts ?? 0) },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl">{t("admin.nav.dashboard")}</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Panel key={stat.label} className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-brand">{stat.value}</p>
          </Panel>
        ))}
      </div>

      <h2 className="mt-10 font-display text-2xl">{t("admin.dash.recent")}</h2>
      <Panel className="mt-4 overflow-x-auto">
        {!orders || orders.length === 0 ? (
          <p className="p-6 text-sm text-muted">{t("admin.dash.none")}</p>
        ) : (
          <table className="min-w-[560px] w-full text-sm">
            <thead>
              <tr className="border-b border-line text-start text-xs uppercase tracking-wider text-muted">
                <th className="px-5 py-3 text-start">N°</th>
                <th className="px-5 py-3 text-start">{t("admin.orders.customer")}</th>
                <th className="px-5 py-3 text-start">{t("admin.orders.total")}</th>
                <th className="px-5 py-3 text-start">{t("admin.products.status")}</th>
                <th className="px-5 py-3 text-start">{t("admin.orders.date")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map((order) => (
                <tr key={order.id} className="border-b border-line/60 last:border-0 hover:bg-panel-2/50">
                  <td className="px-5 py-3">
                    <Link to={`/admin/orders/${order.id}`} className="font-medium text-brand hover:underline" dir="ltr">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{order.customer_name}</td>
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
