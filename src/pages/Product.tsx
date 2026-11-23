import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, ChevronLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { EspressoLoop } from "@/components/product/EspressoLoop";
import { Gallery } from "@/components/product/Gallery";
import { ProductCard } from "@/components/product/ProductCard";
import { RevealHeading } from "@/components/brand/RevealHeading";
import { KineticLine } from "@/components/brand/KineticLine";
import { Reveal } from "@/components/brand/Reveal";
import { useTiltCards } from "@/hooks/useScrollFX";
import { PRODUCT_VIDEO_SLOT, PRODUCT_VIDEO_SLOT_2 } from "@/lib/videoSlots";
import { ProductBackdrop } from "@/components/effects/ProductBackdrop";
import { Steam } from "@/components/effects/Steam";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { BRAND_ACCENT, readableAccent } from "@/lib/contrast";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { useCart, MAX_LINE_QTY } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { usePixel } from "@/components/MetaPixelProvider";
import { pickLang } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { intensityBeans, mixedIntensities, printedIntensity } from "@/lib/intensity";
import { PageRenderer } from "@/components/pageBuilder/PageRenderer";
import { useProductPage } from "@/hooks/usePacks";
import { DEFAULT_THEME, createBlock, normalizePage } from "@/lib/pageBuilder/defaults";
import type { Block, PageDoc } from "@/lib/pageBuilder/types";

/**
 * The buy box of a packs-only product (0023) with no personalised page: the
 * page builder's own offer picker + order form, so the shopper can only pick
 * one of the product's packs — exactly what place_order accepts.
 */
function packsOnlyDoc(): PageDoc {
  const offers = createBlock("offers");
  const checkout = createBlock("checkout");
  const tight = { pad: "none", width: "full", align: "start", anim: "none" } as const;
  return {
    version: 1,
    theme: { ...DEFAULT_THEME, bgFx: "none", grain: false, cursorGlow: false, scrollProgress: false, stickyBar: false, anim: "none" },
    blocks: [
      {
        ...offers,
        ...tight,
        data: { ...offers.data, style: "list", eyebrow: {}, title: {}, subtitle: {}, cta: {}, unitLabel: { fr: "boîte", ar: "علبة", en: "box" } },
      } as Block,
      { ...checkout, ...tight, pad: "md", data: { ...checkout.data, style: "card", showSummary: false } } as Block,
    ],
  };
}
const PACKS_ONLY_DOC = packsOnlyDoc();

export function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const { data: product, isLoading } = useProduct(slug);
  const { data: allProducts } = useProducts();
  // a personalised page built in the admin (0021) — replaces or extends this one
  const { data: customPage, isLoading: customLoading } = useProductPage(product?.id);
  const customDoc = useMemo(() => (customPage ? normalizePage(customPage.page) : null), [customPage]);
  const addItem = useCart((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const pixel = usePixel();
  const trackedViewId = useRef<string | null>(null);
  // the stage leans toward the cursor (data-tilt, pointer-fine only)
  const stageRef = useRef<HTMLDivElement>(null);
  useTiltCards(stageRef, [product?.id]);

  const images = useMemo(
    () => [...(product?.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [product],
  );
  const name = product ? pickLang(lang, product.name_fr, product.name_ar, product.name_en) : "";
  const description = product
    ? pickLang(lang, product.description_fr, product.description_ar, product.description_en)
    : "";
  const details = product ? pickLang(lang, product.details_fr, product.details_ar, product.details_en) : [];

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

  // The page's own language, not the source language: this is what a shopper
  // sees in the tab, and what a share into WhatsApp carries with it. The pixel
  // payloads above deliberately stay on name_fr — an analytics key that
  // changes with the visitor's language splits one product into three.
  useSeo({
    title: product ? `${name} — Norlyn Coffee` : "Norlyn Coffee",
    description: description ?? undefined,
    image: images[0]?.url,
    jsonLd: product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          description: description ?? undefined,
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

  if (isLoading || (product && customLoading)) {
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

  if (customDoc && customPage?.mode === "replace" && customDoc.blocks.length > 0) {
    return (
      <main className="min-h-screen">
        <PageRenderer doc={customDoc} source={{ kind: "product", product }} catalogue={allProducts ?? [product]} className="pt-20" />
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
        nameEn: product.name_en,
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

  const beans = intensityBeans(product.slug, product.intensity);
  const level = printedIntensity(product.slug);
  const mixed = mixedIntensities(product.slug);
  const related = (allProducts ?? []).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <main className="relative min-h-screen overflow-x-clip pb-24 pt-24 sm:pt-28">
      <ProductBackdrop />

      <div className="relative mx-auto max-w-7xl px-6">

        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* ------------------------------------------------ the stage */}
          {/* sticky on desktop: the capsule stays in view while the details scroll */}
          <div ref={stageRef} className="lg:sticky lg:top-24 lg:self-start [perspective:1400px]">
            {/* fully on screen the moment the page opens: on desktop the stage
                is sized to the viewport (minus header and thumbnails), not to
                its column width. Swipe / drag between the shots. */}
            <Gallery
              images={images.map((img) => ({ key: img.id, url: img.url, alt: img.alt }))}
              activeIndex={imageIndex}
              onActiveChange={setImageIndex}
              name={name}
              stage={
                <>
                  {/* the pool of light, in the pack's own colour */}
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(55% 45% at 50% 60%, ${accent}55, transparent 72%)` }}
                  />
                  <div aria-hidden className="absolute bottom-[13%] left-1/2 h-5 w-1/2 -translate-x-1/2 rounded-[50%] bg-shade/40 blur-lg" />
                  <Steam className="absolute top-6 start-1/2 -translate-x-1/2 opacity-60" />
                </>
              }
            />
          </div>

          {/* --------------------------------------------- the details */}
          <div className="lg:pt-2">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted transition-colors hover:text-ink"
            >
              <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
              {t("product.backToShop")}
            </Link>
            <p className="mt-8 flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-muted">
              <span aria-hidden className="h-px w-8" style={{ backgroundColor: titleAccent }} />
              {out ? t("product.outOfStock") : low ? t("product.lowStock") : t("product.inStock")}
            </p>
            <h1 className="mt-5 font-display text-[3.2rem] leading-[0.95] font-medium tracking-[-0.035em] sm:text-7xl">
              <KineticLine key={product.id} text={name} delay={0.45} stagger={0.04} />
            </h1>

            {description && (
              <Reveal as="p" index={1} className="mt-6 max-w-lg font-display text-xl leading-[1.55] italic text-ink/75">
                {description}
              </Reveal>
            )}

            {/* the facts, ruled off like a menu — same card as the home page */}
            <Reveal index={2}>
            <dl className="mt-10 grid max-w-lg grid-cols-3 border-y border-line">
              <div className="py-4 pe-4">
                <dt className="text-[10px] uppercase tracking-[0.28em] text-muted">{t("variants.intensity")}</dt>
                {mixed ? (
                  <dd className="mt-2 font-display text-xl leading-tight">
                    {t("pb.mixed")}
                    <span className="mt-0.5 block text-sm tabular-nums" style={{ color: titleAccent }} dir="ltr">
                      {mixed.join(" · ")}
                    </span>
                  </dd>
                ) : (
                <dd className="mt-1.5 flex items-center gap-1" aria-label={level !== null ? String(level) : `${beans}/5`}>
                  {level !== null && (
                    <span className="me-1.5 font-display text-2xl leading-none tabular-nums" style={{ color: titleAccent }} dir="ltr">
                      {level}
                    </span>
                  )}
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg key={i} viewBox="0 0 12 16" className={cn("h-4 w-3", level !== null && "max-sm:hidden")} aria-hidden>
                      <ellipse
                        cx="6"
                        cy="8"
                        rx="5.2"
                        ry="7.2"
                        fill={i < beans ? titleAccent : "none"}
                        stroke={i < beans ? titleAccent : "rgb(var(--c-line))"}
                      />
                      <path
                        d="M6 1.4c-1.5 2.3 1.5 4.7 0 6.6s-1.5 4.3 0 6.6"
                        fill="none"
                        stroke={i < beans ? "rgb(var(--c-bg))" : "rgb(var(--c-line))"}
                        strokeWidth="0.9"
                        strokeLinecap="round"
                      />
                    </svg>
                  ))}
                </dd>
                )}
              </div>
              <div className="border-s border-line px-4 py-4">
                <dt className="text-[10px] uppercase tracking-[0.28em] text-muted">{t("variants.dosage")}</dt>
                <dd className="mt-2 font-display text-2xl">{product.dosage ?? "—"}</dd>
              </div>
              <div className="border-s border-line py-4 ps-4">
                <dt className="text-[10px] uppercase tracking-[0.28em] text-muted">{t("variants.price")}</dt>
                <dd className="mt-2 font-display text-2xl">
                  {formatPrice(Number(product.price))}
                  {product.compare_at_price !== null && Number(product.compare_at_price) > Number(product.price) && (
                    <span className="ms-2 align-middle text-sm text-muted line-through">
                      {formatPrice(Number(product.compare_at_price))}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            </Reveal>

            {details.length > 0 && (
              <ol className="mt-8 max-w-lg divide-y divide-line">
                {details.map((detail, i) => (
                  <Reveal as="li" index={3 + i} y={16} key={detail} className="flex items-baseline gap-5 py-3 text-sm text-ink/85">
                    <span className="font-display text-xs tabular-nums text-brand">{String(i + 1).padStart(2, "0")}</span>
                    {detail}
                  </Reveal>
                ))}
              </ol>
            )}

            {product.packs_only ? (
              <section className="mt-10 max-w-lg">
                <p className="mb-4 text-sm text-muted">{t("pb.packsOnly")}</p>
                <div className="overflow-hidden rounded-[2rem] border border-line">
                  <PageRenderer doc={PACKS_ONLY_DOC} source={{ kind: "product", product }} catalogue={allProducts ?? [product]} className="p-4 sm:p-6" />
                </div>
              </section>
            ) : (
              <>
              {!out && (
                <div className="mt-10 flex max-w-lg items-center gap-4">
                  <div className="flex items-center gap-4 rounded-full border border-line px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="cursor-pointer text-muted hover:text-ink"
                      aria-label={t("product.decrease")}
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-6 text-center font-display text-lg tabular-nums" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(MAX_LINE_QTY, q + 1))}
                      className="cursor-pointer text-muted hover:text-ink"
                      aria-label={t("product.increase")}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <Button onClick={handleAdd} variant={added ? "outline" : "gold"} size="lg" className="flex-1 gap-3">
                    {added ? (
                      <>
                        <Check size={17} />
                        {t("product.added")}
                      </>
                    ) : (
                      t("product.addToCart")
                    )}
                  </Button>
                </div>
              )}
  
              {/* quick-buy — bypasses the cart entirely */}
              {!out && (
                <section className="mt-12 max-w-lg rounded-[2rem] border border-line bg-panel/60 p-6 sm:p-8">
                  <h2 className="font-display text-2xl">{t("product.orderNow")}</h2>
                  <p className="mb-6 mt-1.5 text-sm text-muted">{t("product.orderNowSub")}</p>
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
                </section>
              )}
  
              </>
            )}

            {product.video_url && (
              <video
                src={product.video_url}
                poster={images[0]?.url}
                preload="none"
                controls
                className="mt-10 w-full max-w-lg rounded-2xl border border-line"
              />
            )}
          </div>
        </div>

        {/* two 4:5 films side by side (stacked on phones), each its own admin
            slot — the second is the client's vertical social edit */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-6 md:grid-cols-2">
          <Reveal>
            <EspressoLoop slot={PRODUCT_VIDEO_SLOT} className="aspect-[4/5]" />
          </Reveal>
          <Reveal index={1}>
            <EspressoLoop slot={PRODUCT_VIDEO_SLOT_2} className="aspect-[4/5]" />
          </Reveal>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <RevealHeading className="font-display text-[2.4rem] leading-[1] font-medium tracking-[-0.02em] sm:text-5xl">
              {t("product.related")}
            </RevealHeading>
            <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p, i) => (
                <Reveal key={p.id} index={i}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>

      {customDoc && customPage?.mode === "extend" && customDoc.blocks.length > 0 && (
        <PageRenderer doc={customDoc} source={{ kind: "product", product }} catalogue={allProducts ?? [product]} className="mt-24" />
      )}
    </main>
  );
}
