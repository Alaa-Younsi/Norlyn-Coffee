import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePixel } from "@/components/MetaPixelProvider";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Mascot } from "@/components/mascot/Mascot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { pickLang } from "@/lib/localized";
import { dbSize } from "@/lib/media";
import type { GuestOrder } from "@/types/db";

export function OrderConfirmation() {
  const { orderNumber } = useParams();
  const { t, lang } = useLanguage();

  useSeo({ title: `${t("confirm.title")} — Norlyn Coffee`, noindex: true });

  // orders has no anon SELECT policy (RLS) — the recap must come through the
  // guest-safe RPC, never a direct .from("orders") select.
  const { data: order, isLoading } = useQuery({
    queryKey: ["guest-order", orderNumber],
    enabled: Boolean(orderNumber) && isSupabaseConfigured,
    queryFn: async (): Promise<GuestOrder | null> => {
      const { data, error } = await supabase.rpc("get_order_by_number", {
        p_order_number: orderNumber,
      });
      if (error) throw error;
      return data as GuestOrder | null;
    },
  });

  // Purchase reports the authoritative server total, and dedupes on the order
  // number: a value-compared ref (not a boolean) survives StrictMode's dev
  // double-invoke and the identity change `pixel.track` gets whenever the
  // matched pixel set widens.
  const pixel = usePixel();
  const trackedOrder = useRef<string | null>(null);

  useEffect(() => {
    if (!order || trackedOrder.current === order.order_number) return;
    trackedOrder.current = order.order_number;
    pixel.track(
      "purchase",
      {
        content_ids: order.items.map((item) => item.name_fr),
        value: Number(order.total),
        num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      },
      order.order_number,
    );
  }, [order, pixel]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center px-6 pb-24 pt-32 text-center">
      <Mascot emotion="excited" palette={["excited"]} size={110} frameSize="lg" />
      <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{t("confirm.title")}</h1>
      <p className="mt-2 text-muted">{t("confirm.sub")}</p>

      <Panel className="mt-8 w-full p-6 text-start">
        <p className="text-sm text-muted">{t("confirm.number")}</p>
        <p className="font-display text-2xl tracking-wide text-brand" dir="ltr">
          {orderNumber}
        </p>

        {isLoading && <p className="mt-4 text-sm text-muted">{t("common.loading")}</p>}

        {order && (
          <>
            <ul className="mt-5 space-y-2 border-t border-line pt-4">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  {item.image_url && (
                    <img
                      src={dbSize(item.image_url, "sm")}
                      alt=""
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-10 rounded-lg object-contain"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {pickLang(lang, item.name_fr, item.name_ar, item.name_en)} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{t("checkout.subtotal")}</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("checkout.shipping")}</span>
                <span>{order.shipping === 0 ? t("checkout.shippingFree") : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("confirm.delivery")}</span>
                <span>
                  {order.wilaya} — {order.city} (
                  {order.delivery_type === "office" ? t("checkout.office") : t("checkout.home")})
                </span>
              </div>
              <div className="flex justify-between pt-2 font-semibold">
                <span>{t("checkout.total")}</span>
                <span className="text-brand">{formatPrice(order.total)}</span>
              </div>
            </div>
          </>
        )}

        {!isLoading && isSupabaseConfigured && !order && (
          <p className="mt-4 text-sm text-muted">{t("confirm.notFound")}</p>
        )}
      </Panel>

      <Link to="/" className="mt-8">
        <Button variant="outline">{t("confirm.backHome")}</Button>
      </Link>
    </main>
  );
}
