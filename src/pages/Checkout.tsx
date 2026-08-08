import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCart, cartSubtotal } from "@/store/cart";
import { useSeo } from "@/hooks/useSeo";
import { formatPrice } from "@/lib/format";
import { pickLang } from "@/lib/localized";
import { usePixel } from "@/components/MetaPixelProvider";

export function Checkout() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const pixel = usePixel();
  const intentFired = useRef(false);

  useSeo({ title: `${t("checkout.title")} — Norlyn Coffee` });

  // dedicated route: navigating here from the cart IS checkout intent
  useEffect(() => {
    if (intentFired.current || items.length === 0) return;
    intentFired.current = true;
    pixel.track("initiate_checkout", {
      content_ids: items.map((i) => i.productId),
      value: cartSubtotal(items),
    });
    // fire once for the visit — deliberately not re-run on cart edits, and not
    // on `pixel` either: its identity changes every time the matched pixel set
    // widens, which would re-fire the event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lines = useMemo(
    () =>
      items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.nameFr,
      })),
    [items],
  );

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted">{t("cart.empty")}</p>
        <Link to="/shop">
          <Button variant="outline">{t("cart.continue")}</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 pb-24 pt-28">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">{t("checkout.title")}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <Panel className="p-6">
          <h2 className="mb-5 font-display text-2xl">{t("checkout.contact")}</h2>
          <CheckoutForm
            lines={lines}
            intent="mount"
            intentKey="cart"
            onSuccess={(orderNumber) => {
              clear();
              navigate(`/order/${orderNumber}`);
            }}
          />
        </Panel>
        <Panel className="h-fit p-6">
          <h2 className="mb-4 font-display text-2xl">{t("checkout.summary")}</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 text-sm">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-12 rounded-lg object-contain"
                  />
                )}
                <span className="min-w-0 flex-1 truncate">
                  {pickLang(lang, item.nameFr, item.nameAr, item.nameEn)} × {item.quantity}
                </span>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}
