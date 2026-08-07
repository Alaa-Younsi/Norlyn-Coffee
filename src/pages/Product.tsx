import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { EspressoLoop } from "@/components/product/EspressoLoop";
import { CoffeeDivider } from "@/components/effects/CoffeeDivider";
import { CoffeeRing } from "@/components/effects/CoffeeRing";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { ScrollProgressBar } from "@/components/effects/ScrollProgressBar";
import { Steam } from "@/components/effects/Steam";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { BRAND_ACCENT, readableAccent } from "@/lib/contrast";
import { useProduct } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { useCart, MAX_LINE_QTY } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { dbSize, dbSrcSet } from "@/lib/media";
import { usePixel } from "@/components/MetaPixelProvider";
import { pickLang } from "@/lib/localized";
import { cn } from "@/lib/utils";

export function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const { data: product, isLoading } = useProduct(slug);
  const addItem = useCart((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const pixel = usePixel();
  const trackedViewId = useRef<string | null>(null);

  const images = useMemo(
    () => [...(product?.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [product],
  );
  const name = product ? pickLang(lang, product.name_fr, product.name_ar) : "";
  const description = product
    ? pickLang(lang, product.description_fr, product.description_ar)
    : "";
  const details = product ? pickLang(lang, product.details_fr, product.details_ar) : [];

  // Registering the slug widens the matched pixel set (a `products`-scoped
  // pixel only becomes live once the provider knows which product this is).
  const { setContext } = pixel;
  useEffect(() => {
    if (slug) setContext({ productSlug: slug });
  }, [slug, setContext]);

  useEffect(() => {
    if (!product || trackedViewId.current === product.id) return;
    trackedViewId.current = product.id;
    pixel.track("view_content", {
      content_ids: [product.id],
      content_name: product.name_fr,
      content_type: "product",
      value: Number(product.price),
    });
  }, [product, pixel]);

  useSeo({
    title: product ? `${product.name_fr} — Norlyn Coffee` : "Norlyn Coffee",
    description: product?.description_fr ?? undefined,
    image: images[0]?.url,
    jsonLd: product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name_fr,
          description: product.description_fr ?? undefined,
          image: images.map((i) => i.url),
          offers: {
            "@type": "Offer",
            priceCurrency: "DZD",
            price: Number(product.price),
            availability:
              product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }
      : undefined,
  });

  if (isLoading) {
    return <main className="pt-40 text-center text-muted min-h-screen">{t("common.loading")}</main>;
  }
  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted">{t("product.notFound")}</p>
        <Link to="/shop">
          <Button variant="outline">{t("product.backToShop")}</Button>
        </Link>
      </main>
    );
  }

  const out = product.stock <= 0;
  const low = !out && product.stock <= 10;
  // `accent` paints decoration (washes, intensity bars) and may be any colour
  // the client picked; `titleAccent` is the same hue forced into a legible
  // lightness band, because a near-black Noir title would vanish on dark.
  const accent = product.accent_color ?? BRAND_ACCENT;
  const titleAccent = readableAccent(product.accent_color, theme);

  const handleAdd = () => {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        nameFr: product.name_fr,
        nameAr: product.name_ar,
        price: Number(product.price),
        imageUrl: images[0]?.url ?? null,
      },
      quantity,
    );
    pixel.track("add_to_cart", {
      content_ids: [product.id],
      content_name: product.name_fr,
      // coerce: a numeric Postgres column can arrive over PostgREST as a string
      value: Number(product.price) * quantity,
      num_items: quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <main className="relative mx-auto min-h-screen max-w-7xl overflow-x-clip px-6 pb-24 pt-24">
      <ScrollProgressBar />
      {/* coffee ambience tinted by the variant's accent */}
      <FloatingBeans count={8} seed={13} />
      <CoffeeRing className="fx-spin-slow -start-20 top-40 w-64 opacity-10" />
      <CoffeeRing className="-end-16 bottom-24 w-52 opacity-10" />

      <Link
        to="/shop"
        className="relative inline-flex items-center gap-1 text-sm text-muted hover:text-brand transition-colors"
      >
        <ChevronLeft size={16} className="rtl:rotate-180" />
        {t("product.backToShop")}
      </Link>

      {/*
        Two columns that are never the same height: the buy side carries the
        whole checkout form, the gallery carries one square. On desktop the
        film is placed into that leftover row so the column finishes instead of
        trailing off; on mobile there is no leftover — the columns stack — so
        it falls to the bottom of the page in source order, well clear of the
        price and the order button.
      */}
      <div className="relative mt-6 grid gap-10 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
        {/* gallery */}
        <div className="lg:col-start-1 lg:row-start-1">
          <div
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-line bg-panel p-4 sm:p-6"
            style={{ background: `radial-gradient(ellipse at 50% 65%, ${accent}22, rgb(var(--c-panel)) 70%)` }}
          >
            {/* steam curling off the capsule, like it just finished brewing */}
            <Steam className="absolute top-6 start-1/2 -translate-x-1/2 opacity-70" />
            {images[imageIndex] && (
              // transform-only swap: the new shot rises into place
              <motion.img
                key={images[imageIndex].id}
                initial={{ y: 30, scale: 0.96 }}
                animate={{ y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                src={images[imageIndex].url}
                srcSet={dbSrcSet(images[imageIndex].url)}
                sizes="(min-width: 1024px) 45vw, 85vw"
                alt={images[imageIndex].alt ?? name}
                width={1000}
                height={1000}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                // fills its frame: every product shot is re-framed at build
                // time to carry the same margin around the same subject size
                // (see scripts/optimize-images.mjs), so shrinking it again
                // here would only re-introduce the scale drift it removes
                className="fx-float h-full w-full object-contain drop-shadow-[0_35px_35px_rgb(var(--c-ink)/0.3)]"
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setImageIndex(i)}
                  className={cn(
                    "h-20 w-20 overflow-hidden rounded-xl border p-1 cursor-pointer",
                    i === imageIndex ? "border-brand" : "border-line",
                  )}
                >
                  <img
                    src={dbSize(img.url, "sm")}
                    alt=""
                    width={80}
                    height={80}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
          {product.video_url && (
            <video
              src={product.video_url}
              poster={images[0]?.url}
              preload="none"
              controls
              className="mt-4 w-full rounded-2xl border border-line"
            />
          )}
        </div>

        {/* info + buy — owns the whole end column, both rows of it */}
        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <h1
            className="font-display text-4xl font-semibold sm:text-5xl"
            style={{ color: titleAccent }}
          >
            {name}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-3xl text-brand">{formatPrice(Number(product.price))}</span>
            {product.compare_at_price !== null &&
              Number(product.compare_at_price) > Number(product.price) && (
                <span className="text-muted line-through">
                  {formatPrice(Number(product.compare_at_price))}
                </span>
              )}
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                out
                  ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                  : "bg-brand/10 text-brand",
              )}
            >
              {out ? t("product.outOfStock") : low ? t("product.lowStock") : t("product.inStock")}
            </span>
          </div>

          {description && <p className="mt-5 leading-relaxed text-muted">{description}</p>}

          {/* intensity + dosage, same language as the landing showcase */}
          {(product.intensity !== null || product.dosage) && (
            <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
              {product.intensity !== null && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted">
                    {t("variants.intensity")}
                  </dt>
                  <dd className="mt-1.5 flex items-center gap-1.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className="h-2 w-7 rounded-full"
                        style={{
                          backgroundColor:
                            i < Math.round(((product.intensity ?? 0) / 100) * 5)
                              ? accent
                              : "rgb(var(--c-line))",
                        }}
                      />
                    ))}
                  </dd>
                </div>
              )}
              {product.dosage && (
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted">
                    {t("variants.dosage")}
                  </dt>
                  <dd className="mt-1 font-display text-2xl">{product.dosage}</dd>
                </div>
              )}
            </dl>
          )}

          {details.length > 0 && (
            <ul className="mt-5 space-y-2">
              {details.map((detail) => (
                <li key={detail} className="flex items-start gap-2 text-sm">
                  <Check size={15} className="mt-0.5 shrink-0 text-brand" />
                  {detail}
                </li>
              ))}
            </ul>
          )}

          {!out && (
            <div className="mt-7 flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-full border border-line bg-panel px-3 py-2">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-muted hover:text-ink cursor-pointer"
                  aria-label={t("product.decrease")}
                >
                  <Minus size={15} />
                </button>
                <span className="w-6 text-center font-semibold" aria-live="polite">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(MAX_LINE_QTY, q + 1))}
                  className="text-muted hover:text-ink cursor-pointer"
                  aria-label={t("product.increase")}
                >
                  <Plus size={15} />
                </button>
              </div>
              <Button onClick={handleAdd} variant={added ? "outline" : "gold"} className="flex-1">
                {added ? t("product.added") : t("product.addToCart")}
              </Button>
            </div>
          )}

          {/* quick-buy — bypasses the cart entirely */}
          {!out && (
            <Panel className="fx-sheen mt-8 p-6">
              <CoffeeDivider className="mb-5" />
              <h2 className="font-display text-2xl">{t("product.orderNow")}</h2>
              <p className="mt-1 mb-5 text-sm text-muted">{t("product.orderNowSub")}</p>
              <CheckoutForm
                compact
                intent="focus"
                intentKey={product.id}
                lines={[
                  {
                    product_id: product.id,
                    quantity,
                    price: Number(product.price),
                    name: product.name_fr,
                  },
                ]}
                onSuccess={(orderNumber) => navigate(`/order/${orderNumber}`)}
              />
            </Panel>
          )}
        </div>

        {/* the espresso loop, filling out the start column under the gallery */}
        <EspressoLoop className="lg:col-start-1 lg:row-start-2 lg:h-full" />
      </div>
    </main>
  );
}
