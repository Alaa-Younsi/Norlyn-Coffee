import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { usePixel } from "@/components/MetaPixelProvider";
import type { CheckoutLine } from "@/components/checkout/CheckoutForm";
import { useLanguage } from "@/i18n/LanguageProvider";
import { getLenisInstance } from "@/lib/lenis";
import { pickLang } from "@/lib/localized";
import { packLineTotal, packQuote } from "@/lib/packPricing";
import { safeUrl } from "@/lib/pageBuilder/defaults";
import { isLightTheme, siteTokens } from "@/lib/pageBuilder/tokens";
import type { CtaTarget, PageDoc } from "@/lib/pageBuilder/types";
import { MAX_LINE_QTY, useCart } from "@/store/cart";
import type { Pack, Product } from "@/types/db";
import { cn } from "@/lib/utils";
import { BlockView, StickyBuyBar } from "./blocks";
import { PageContext } from "./context";
import type { PageContextValue, PageItem } from "./context";
import { BackgroundFx, CursorGlow, Grain, ScrollProgress } from "./fx";

export type PageSource = { kind: "pack"; pack: Pack } | { kind: "product"; product: Product };

interface PageRendererProps {
  doc: PageDoc;
  source: PageSource;
  /** every product a pack may reference (with images) */
  catalogue: Product[];
  /** admin preview: fake checkout, no fixed chrome */
  preview?: boolean;
  className?: string;
  /** editor: click a block in the preview to edit it */
  selectedId?: string | null;
  onSelectBlock?: (id: string) => void;
}

/**
 * Renders a page document. The same component powers /pack/:slug, the
 * personalised /product/:slug, and the live preview in the admin editor —
 * what the editor shows IS what ships.
 */
export function PageRenderer({
  doc,
  source,
  catalogue,
  preview = false,
  className,
  selectedId,
  onSelectBlock,
}: PageRendererProps) {
  const { lang, dir } = useLanguage();
  const navigate = useNavigate();
  const addItem = useCart((s) => s.addItem);
  const pixel = usePixel();
  const rootRef = useRef<HTMLDivElement>(null);
  const [qty, setQty] = useState(1);
  const [checkoutInView, setCheckoutInView] = useState(false);
  // the sale window is checked against the moment the page opened
  const [openedAt] = useState(() => Date.now());
  const theme = doc.theme;

  const byId = useMemo(() => new Map(catalogue.map((p) => [p.id, p])), [catalogue]);

  const value = useMemo((): Omit<PageContextValue, "go" | "addToCart" | "setQty" | "qty" | "lineTotal" | "checkoutLines"> => {
    if (source.kind === "pack") {
      const pack = source.pack;
      const items: PageItem[] = [];
      for (const it of pack.items ?? []) {
        const product = byId.get(it.product_id);
        if (!product) continue;
        const custom = it.price !== null && it.price !== undefined && it.price >= 0 ? Number(it.price) : Number(product.price);
        items.push({ product, quantity: Math.max(1, it.quantity), unitPrice: custom });
      }
      const quote = packQuote(pack.items ?? [], pack.pricing, (id) => {
        const p = byId.get(id);
        return p && p.status === "active" ? Number(p.price) : undefined;
      });
      const now = openedAt;
      const inWindow =
        (!pack.starts_at || new Date(pack.starts_at).getTime() <= now) &&
        (!pack.ends_at || new Date(pack.ends_at).getTime() > now);
      const inStock = items.every((i) => i.product.stock >= i.quantity);
      return {
        kind: "pack",
        lang,
        dir,
        theme,
        name: pickLang(lang, pack.name_fr, pack.name_ar ?? pack.name_fr, pack.name_en),
        tagline: pickLang(lang, pack.tagline_fr ?? "", pack.tagline_ar ?? "", pack.tagline_en),
        coverUrl: safeUrl(pack.cover_url) || items[0]?.product.product_images?.[0]?.url || null,
        unit: quote?.unit ?? null,
        compare: quote?.compare ?? null,
        list: quote?.list ?? null,
        tiers: pack.pricing?.tiers ?? [],
        freeShipping: Boolean(pack.pricing?.free_shipping),
        maxQty: pack.max_per_order ?? 10,
        items,
        available: Boolean(quote) && inWindow && inStock && (preview || pack.status === "published"),
        onOrdered: (orderNumber: string) => navigate(`/order/${orderNumber}`),
        preview,
      };
    }
    const product = source.product;
    const price = Number(product.price);
    const compare = product.compare_at_price && Number(product.compare_at_price) > price ? Number(product.compare_at_price) : null;
    return {
      kind: "product",
      lang,
      dir,
      theme,
      name: pickLang(lang, product.name_fr, product.name_ar, product.name_en),
      tagline: pickLang(lang, product.description_fr ?? "", product.description_ar ?? "", product.description_en),
      coverUrl: product.product_images?.[0]?.url ?? null,
      unit: price,
      compare,
      list: compare,
      tiers: [],
      freeShipping: false,
      maxQty: Math.max(1, Math.min(MAX_LINE_QTY, product.stock)),
      items: [{ product, quantity: 1, unitPrice: price }],
      available: product.stock > 0 && product.status === "active",
      onOrdered: (orderNumber: string) => navigate(`/order/${orderNumber}`),
      preview,
    };
  }, [source, byId, lang, dir, theme, navigate, preview, openedAt]);

  const lineTotal =
    value.unit === null ? null : value.kind === "pack" ? packLineTotal(value.unit, qty, { tiers: value.tiers }) : value.unit * qty;

  const checkoutLines: CheckoutLine[] = useMemo(() => {
    if (value.unit === null) return [];
    if (source.kind === "pack") {
      return [
        {
          product_id: `pack:${source.pack.id}`,
          pack_id: source.pack.id,
          quantity: qty,
          price: value.unit,
          name: source.pack.name_fr,
          tiers: value.tiers,
          free_shipping: value.freeShipping,
        },
      ];
    }
    return [{ product_id: source.product.id, quantity: qty, price: value.unit, name: source.product.name_fr }];
  }, [source, qty, value.unit, value.tiers, value.freeShipping]);

  const addToCart = useCallback(() => {
    if (preview || value.unit === null || !value.available) return;
    if (source.kind === "pack") {
      const pack = source.pack;
      addItem(
        {
          productId: `pack:${pack.id}`,
          packId: pack.id,
          slug: pack.slug,
          nameFr: pack.name_fr,
          nameAr: pack.name_ar ?? pack.name_fr,
          nameEn: pack.name_en,
          price: value.unit,
          imageUrl: value.coverUrl,
          tiers: value.tiers,
          freeShipping: value.freeShipping,
          maxQty: value.maxQty,
        },
        qty,
      );
      pixel.track("add_to_cart", { content_ids: [pack.id], content_name: pack.name_fr, value: lineTotal ?? 0, num_items: qty });
    } else {
      const p = source.product;
      addItem(
        {
          productId: p.id,
          slug: p.slug,
          nameFr: p.name_fr,
          nameAr: p.name_ar,
          nameEn: p.name_en,
          price: Number(p.price),
          imageUrl: p.product_images?.[0]?.url ?? null,
        },
        qty,
      );
      pixel.track("add_to_cart", { content_ids: [p.id], content_name: p.name_fr, value: lineTotal ?? 0, num_items: qty });
    }
  }, [preview, value, source, addItem, qty, pixel, lineTotal]);

  const scrollTo = useCallback((id: string) => {
    const el = rootRef.current?.querySelector<HTMLElement>(`#${id}`);
    if (!el) return false;
    const lenis = getLenisInstance();
    if (lenis && !preview) lenis.scrollTo(el, { offset: -80 });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }, [preview]);

  const go = useCallback(
    (target: CtaTarget) => {
      if (target === "top") {
        rootRef.current?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (target === "cart") {
        addToCart();
        return;
      }
      if (target === "price" && scrollTo("pb-price")) return;
      if (scrollTo("pb-checkout")) return;
      // no order block on this page: take the basket route instead
      if (preview) return;
      addToCart();
      navigate("/checkout");
    },
    [addToCart, scrollTo, navigate, preview],
  );

  // the sticky bar steps aside while the order form itself is on screen
  useEffect(() => {
    const el = rootRef.current?.querySelector("#pb-checkout");
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCheckoutInView(entry.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [doc.blocks]);

  const ctx: PageContextValue = { ...value, qty, setQty, lineTotal, addToCart, checkoutLines, go };

  // a light page also lightens the site header above it (outside this tree)
  const light = isLightTheme(theme);
  useEffect(() => {
    if (preview || !light) return;
    const root = document.documentElement;
    const tokens = siteTokens(theme);
    root.dataset.pbLight = "";
    for (const [k, v] of Object.entries(tokens)) root.style.setProperty(k.replace("--c-", "--pbh-"), v);
    return () => {
      delete root.dataset.pbLight;
      for (const k of Object.keys(tokens)) root.style.removeProperty(k.replace("--c-", "--pbh-"));
    };
  }, [preview, light, theme]);

  const vars = {
    ...siteTokens(theme),
    "--pb-bg": theme.bg,
    "--pb-surface": theme.surface,
    "--pb-text": theme.text,
    "--pb-muted": theme.muted,
    "--pb-accent": theme.accent,
    "--pb-accent2": theme.accent2,
    "--pb-radius": `${theme.radius}px`,
  } as CSSProperties;

  return (
    <PageContext.Provider value={ctx}>
      {/* the colour variables live on an outer wrapper: the fixed chrome
          (progress bar, sticky buy bar) must sit OUTSIDE the @container box,
          which is a containing block for position:fixed descendants */}
      <div style={vars} className={cn("bg-[var(--pb-bg)] text-[var(--pb-text)]", className)}>
      {theme.scrollProgress && !preview && <ScrollProgress />}
      <div
        ref={rootRef}
        className={cn(
          "@container relative isolate overflow-x-clip",
          theme.font === "sans" && "font-sans",
        )}
      >
        <BackgroundFx fx={theme.bgFx} />
        {theme.grain && <Grain />}
        {theme.cursorGlow && <CursorGlow />}
        <div className="relative z-[2]">
          {doc.blocks
            .filter((b) => b.visible)
            .map((block) =>
              onSelectBlock ? (
                <div
                  key={block.id}
                  data-block-id={block.id}
                  onClickCapture={() => onSelectBlock(block.id)}
                  className={cn(
                    "relative outline-2 -outline-offset-2 transition-[outline-color] hover:outline hover:outline-[color-mix(in_srgb,var(--pb-accent)_45%,transparent)]",
                    selectedId === block.id && "outline outline-[var(--pb-accent)] hover:outline-[var(--pb-accent)]",
                  )}
                >
                  <BlockView block={block} />
                </div>
              ) : (
                <BlockView key={block.id} block={block} />
              ),
            )}
        </div>
      </div>
      {theme.stickyBar && !preview && <StickyBuyBar hidden={checkoutInView} />}
      </div>
    </PageContext.Provider>
  );
}
