import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSurfaceTone } from "@/hooks/useSurfaceTone";
import { readableAccent } from "@/lib/contrast";
import { formatPrice } from "@/lib/format";
import { dbSrcSet } from "@/lib/media";
import { pickLang } from "@/lib/localized";
import { intensityBeans, printedIntensity } from "@/lib/intensity";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/db";

/** A roasted bean, for the intensity scale. */
function Bean({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg viewBox="0 0 12 16" className="h-3.5 w-2.5" aria-hidden>
      <ellipse
        cx="6"
        cy="8"
        rx="5.2"
        ry="7.2"
        fill={filled ? color : "none"}
        stroke={filled ? color : "rgb(var(--c-line))"}
        strokeWidth="1"
      />
      <path
        d="M6 1.4c-1.5 2.3 1.5 4.7 0 6.6s-1.5 4.3 0 6.6"
        fill="none"
        stroke={filled ? "rgb(var(--c-bg))" : "rgb(var(--c-line))"}
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A capsule on a plinth of its own colour. No boxed card: the product sits in
 * a pool of light tinted by its pack colour, lifts and turns toward you on
 * hover while the pool brightens, and its intensity is counted in roasted
 * beans rather than a progress bar.
 */
export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useLanguage();
  const name = pickLang(lang, product.name_fr, product.name_ar, product.name_en);
  const image = [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  const out = product.stock <= 0;
  const accent = product.accent_color ?? "#b08439";
  const beans = intensityBeans(product.slug, product.intensity);
  const level = printedIntensity(product.slug);
  // the raw pack colour lights the plinth; the beans need one that reads on the page
  const tone = useSurfaceTone();
  const beanColor = readableAccent(accent, tone);

  return (
    // The tilt rides a WRAPPER: GSAP writes its own inline transform for the
    // lean, and the hover lift is a class — one property, two owners otherwise.
    <div data-tilt="6" className="h-full">
      <Link to={`/product/${product.slug}`} className="group flex h-full flex-col">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-panel-2/50 transition-colors duration-500 group-hover:bg-panel-2/80">
          {/* the pool of light, in the pack's own colour */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-70 transition-opacity duration-700 group-hover:opacity-100"
            style={{ background: `radial-gradient(60% 45% at 50% 62%, ${accent}55, transparent 70%)` }}
          />
          {/* its shadow on the plinth */}
          <div
            aria-hidden
            className="absolute bottom-[14%] left-1/2 h-4 w-1/2 -translate-x-1/2 rounded-[50%] bg-shade/30 blur-md transition-all duration-700 group-hover:w-2/5 group-hover:bg-shade/20"
          />
          {image && (
            <img
              src={image.url}
              srcSet={dbSrcSet(image.url)}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 80vw"
              alt={image.alt ?? name}
              width={640}
              height={640}
              loading="lazy"
              decoding="async"
              className="absolute inset-x-[10%] top-[8%] h-[78%] w-[80%] object-contain drop-shadow-[0_24px_28px_rgb(0_0_0/0.3)] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-4 group-hover:-rotate-6 group-hover:scale-[1.04]"
            />
          )}
          {out && (
            <span className="absolute start-4 top-4 rounded-full bg-shade/85 px-3 py-1 text-xs font-semibold text-on-shade">
              {t("shop.outOfStock")}
            </span>
          )}
          {/* the call to action slides up out of the plinth on hover */}
          <span className="absolute inset-x-4 bottom-4 flex translate-y-[140%] items-center justify-between rounded-full bg-ink px-5 py-3 text-sm font-medium text-bg transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0 group-focus-visible:translate-y-0">
            {t("variants.view")}
            <ArrowUpRight size={16} className="rtl:-scale-x-100" />
          </span>
        </div>

        <div className="mt-5 flex items-start justify-between gap-4 px-1">
          <div className="min-w-0">
            <h3 className="font-display text-xl leading-tight sm:text-2xl">{name}</h3>
            {product.intensity !== null && (
              <div
                className="mt-2 flex items-center gap-1"
                role="img"
                aria-label={`${t("variants.intensity")} ${level ?? `${beans}/5`}`}
              >
                {level !== null && (
                  <span className="me-1.5 font-display text-base leading-none tabular-nums" style={{ color: beanColor }} dir="ltr">
                    {level}
                  </span>
                )}
                {Array.from({ length: 5 }, (_, i) => (
                  <Bean key={i} filled={i < beans} color={beanColor} />
                ))}
              </div>
            )}
          </div>
          <div className="shrink-0 text-end">
            {product.compare_at_price !== null && product.compare_at_price > product.price && (
              <p className="text-xs text-muted line-through">{formatPrice(product.compare_at_price)}</p>
            )}
            <p className={cn("font-display text-lg text-ink")}>{formatPrice(product.price)}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
