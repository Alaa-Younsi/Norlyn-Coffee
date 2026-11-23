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
import { defaultOfferId, resolveOffers } from "@/lib/pageBuilder/offers";
import type { BlockOf, CtaTarget, PageDoc } from "@/lib/pageBuilder/types";
import { usePublishedPacks } from "@/hooks/usePacks";
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
  /** the packs an offers block may list — defaults to the published ones (the editor passes drafts too) */
  packs?: Pack[];
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
  packs,
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

  // ---- offers: a visible "offers" block turns the page into a picker
  const { data: publishedPacks } = usePublishedPacks();
  const allPacks = useMemo(() => packs ?? publishedPacks ?? [], [packs, publishedPacks]);
  const offersData = doc.blocks.find((b): b is BlockOf<"offers"> => b.type === "offers" && b.visible)?.data;
  const offers = useMemo(
    () => resolveOffers(offersData, source, allPacks, byId, lang, openedAt, preview),
    [offersData, source, allPacks, byId, lang, openedAt, preview],
  );
  const basePackId = source.kind === "pack" ? source.pack.id : null;
  const [pickedId, setPickedId] = useState<string | null>(null);
  const offerId =
    (pickedId && offers.some((o) => o.id === pickedId) ? pickedId : null) ?? defaultOfferId(offers, offersData, basePackId);
  const selected = offers.find((o) => o.id === offerId) ?? null;
  // what the price / cart / order form sell: the chosen offer, else the page's own pack
  const sellPack: Pack | null = selected?.pack ?? (source.kind === "pack" ? source.pack : null);
  const selectOffer = useCallback((id: string) => {
    setPickedId(id);
    setQty(1);
  }, []);

  const value = useMemo((): Omit<
    PageContextValue,
    "go" | "addToCart" | "setQty" | "qty" | "lineTotal" | "checkoutLines" | "offers" | "offerId" | "selectOffer"
  > => {
    const identity =
      source.kind === "pack"
        ? {
            name: pickLang(lang, source.pack.name_fr, source.pack.name_ar ?? source.pack.name_fr, source.pack.name_en),
            tagline: pickLang(lang, source.pack.tagline_fr ?? "", source.pack.tagline_ar ?? "", source.pack.tagline_en),
          }
        : {
            name: pickLang(lang, source.product.name_fr, source.product.name_ar, source.product.name_en),
            tagline: pickLang(lang, source.product.description_fr ?? "", source.product.description_ar ?? "", source.product.description_en),
          };
    const shared = {
      lang,
      dir,
      theme,
      ...identity,
      onOrdered: (orderNumber: string) => navigate(`/order/${orderNumber}`),
      preview,
    };

    if (sellPack) {
      const pack = sellPack;
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
      const inWindow =
        (!pack.starts_at || new Date(pack.starts_at).getTime() <= openedAt) &&
        (!pack.ends_at || new Date(pack.ends_at).getTime() > openedAt);
      const inStock = items.every((i) => i.product.stock >= i.quantity);
      const pageCover =
        source.kind === "pack"
          ? safeUrl(source.pack.cover_url)
          : ([...(source.product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? "");
      return {
        ...shared,
        kind: "pack",
        coverUrl: pageCover || safeUrl(pack.cover_url) || items[0]?.product.product_images?.[0]?.url || null,
        lineName: pickLang(lang, pack.name_fr, pack.name_ar ?? pack.name_fr, pack.name_en),
        unit: quote?.unit ?? null,
        // an offer picker prices its own savings; plain pack pages keep the pack's crossed-out price
        compare: selected ? selected.was : (quote?.compare ?? null),
        list: quote?.list ?? null,
        tiers: pack.pricing?.tiers ?? [],
        freeShipping: Boolean(pack.pricing?.free_shipping),
        maxQty: pack.max_per_order ?? 10,
        items,
        available: Boolean(quote) && inWindow && inStock && (preview || pack.status === "published"),
      };
    }

    // sellPack is null only for a product page without a usable offer
    const product = source.kind === "product" ? source.product : null;
    if (!product) {
      return {
        ...shared,
        kind: "pack",
        coverUrl: null,
        lineName: identity.name,
        unit: null,
        compare: null,
        list: null,
        tiers: [],
        freeShipping: false,
        maxQty: 1,
        items: [],
        available: false,
      };
    }
    const price = Number(product.price);
    const compare = product.compare_at_price && Number(product.compare_at_price) > price ? Number(product.compare_at_price) : null;
    return {
      ...shared,
      kind: "product",
      coverUrl: product.product_images?.[0]?.url ?? null,
      lineName: identity.name,
      unit: price,
      compare,
      list: compare,
      tiers: [],
      freeShipping: false,
      maxQty: Math.max(1, Math.min(MAX_LINE_QTY, product.stock)),
      items: [{ product, quantity: 1, unitPrice: price }],
      // a packs-only product is never sold on its own (place_order refuses it too)
      available: product.stock > 0 && product.status === "active" && !product.packs_only,
    };
  }, [source, sellPack, selected, byId, lang, dir, theme, navigate, preview, openedAt]);

  const lineTotal =
    value.unit === null ? null : value.kind === "pack" ? packLineTotal(value.unit, qty, { tiers: value.tiers }) : value.unit * qty;

  const checkoutLines: CheckoutLine[] = useMemo(() => {
    if (value.unit === null) return [];
    if (sellPack) {
      return [
        {
          product_id: `pack:${sellPack.id}`,
          pack_id: sellPack.id,
          quantity: qty,
          price: value.unit,
          name: sellPack.name_fr,
          tiers: value.tiers,
          free_shipping: value.freeShipping,
        },
      ];
    }
    if (source.kind !== "product") return [];
    return [{ product_id: source.product.id, quantity: qty, price: value.unit, name: source.product.name_fr }];
  }, [source, sellPack, qty, value.unit, value.tiers, value.freeShipping]);

  const addToCart = useCallback(() => {
    if (preview || value.unit === null || !value.available) return;
    if (sellPack) {
      const pack = sellPack;
      addItem(
        {
          productId: `pack:${pack.id}`,
          packId: pack.id,
          slug: pack.slug,
          nameFr: pack.name_fr,
          nameAr: pack.name_ar ?? pack.name_fr,
          nameEn: pack.name_en,
          price: value.unit,
          imageUrl: safeUrl(pack.cover_url) || value.coverUrl,
          tiers: value.tiers,
          freeShipping: value.freeShipping,
          maxQty: value.maxQty,
        },
        qty,
      );
      pixel.track("add_to_cart", { content_ids: [pack.id], content_name: pack.name_fr, value: lineTotal ?? 0, num_items: qty });
    } else if (source.kind === "product") {
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
  }, [preview, value, source, sellPack, addItem, qty, pixel, lineTotal]);

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
      if (target === "offers" && (scrollTo("pb-offers") || scrollTo("pb-price"))) return;
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

  const ctx: PageContextValue = { ...value, qty, setQty, lineTotal, addToCart, checkoutLines, go, offers, offerId, selectOffer };

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
