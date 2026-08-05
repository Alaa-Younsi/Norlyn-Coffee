import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { useCart, cartSubtotal } from "@/store/cart";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatPrice } from "@/lib/format";
import { pickLang } from "@/lib/localized";

export function CartDrawer() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { items, isOpen, closeCart, removeItem, setQuantity } = useCart();
  const subtotal = cartSubtotal(items);

  return (
    <Drawer open={isOpen} onClose={closeCart} title={t("cart.title")}>
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-muted">{t("cart.empty")}</p>
          <Button
            variant="outline"
            onClick={() => {
              closeCart();
              navigate("/shop");
            }}
          >
            {t("cart.continue")}
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <ul className="flex-1 space-y-4 p-5">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3 rounded-2xl border border-line bg-panel-2/50 p-3">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    width={72}
                    height={72}
                    loading="lazy"
                    decoding="async"
                    className="h-18 w-18 shrink-0 rounded-xl object-contain"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {pickLang(lang, item.nameFr, item.nameAr)}
                  </p>
                  <p className="mt-0.5 text-sm text-brand font-medium">{formatPrice(item.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="rounded-full border border-line p-1 text-muted hover:text-ink cursor-pointer"
                      aria-label="-"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      className="rounded-full border border-line p-1 text-muted hover:text-ink cursor-pointer"
                      aria-label="+"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="ms-auto rounded-full p-1.5 text-muted hover:text-red-600 cursor-pointer"
                      aria-label={t("cart.remove")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted">{t("cart.subtotal")}</span>
              <span className="font-display text-2xl text-brand">{formatPrice(subtotal)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                closeCart();
                navigate("/checkout");
              }}
            >
              {t("cart.checkout")}
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
