import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatPrice } from "@/lib/format";
import { pickLang } from "@/lib/localized";
import type { Product } from "@/types/db";

/**
 * Frosted rather than solid: on the landing page the 3D espresso machine brews
 * behind this grid, and the blur turns it into soft depth instead of a shape
 * fighting the card.
 */
export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useLanguage();
  const name = pickLang(lang, product.name_fr, product.name_ar);
  const image = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  const out = product.stock <= 0;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="fx-sheen group relative block overflow-hidden rounded-3xl border border-line bg-panel/75 backdrop-blur-md p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[0_24px_60px_-24px_rgb(var(--c-brand)/0.45)]"
    >
      <div
        className="relative mx-auto aspect-square w-full max-w-56"
        style={{
          background: `radial-gradient(ellipse at 50% 62%, ${product.accent_color ?? "#b08439"}26, transparent 65%)`,
        }}
      >
        {image && (
          <img
            src={image.url}
            alt={image.alt ?? name}
            width={640}
            height={640}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain drop-shadow-[0_20px_24px_rgb(var(--c-ink)/0.28)] transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2"
          />
        )}
        {out && (
          <span className="absolute top-2 start-2 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-cream">
            {t("shop.outOfStock")}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-xl leading-tight">{name}</h3>
          {product.intensity !== null && (
            <div className="mt-1.5 flex items-center gap-1" aria-label={t("variants.intensity")}>
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-4 rounded-full"
                  style={{
                    backgroundColor:
                      i < Math.round(((product.intensity ?? 0) / 100) * 5)
                        ? (product.accent_color ?? "rgb(var(--c-brand))")
                        : "rgb(var(--c-line))",
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="text-end">
          {product.compare_at_price !== null && product.compare_at_price > product.price && (
            <p className="text-xs text-muted line-through">{formatPrice(product.compare_at_price)}</p>
          )}
          <p className="font-semibold text-brand">{formatPrice(product.price)}</p>
        </div>
      </div>
    </Link>
  );
}
