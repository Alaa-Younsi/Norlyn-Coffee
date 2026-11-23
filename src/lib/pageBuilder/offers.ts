import { pickLang } from "@/lib/localized";
import { packQuote } from "@/lib/packPricing";
import type { Lang, Pack, Product } from "@/types/db";
import { safeUrl } from "./defaults";
import type { L10n, OffersData } from "./types";

/**
 * The options of an "offers" block (3 / 4 / 5 boxes…), resolved against the
 * packs that actually exist. Prices come from the same packQuote() mirror as
 * every other pack display; place_order re-prices the chosen pack anyway.
 */
export interface OfferOption {
  pack: Pack;
  id: string;
  slug: string;
  name: string;
  tagline: string;
  cover: string;
  /** one pack */
  unit: number;
  /** total units inside (Σ item quantities) */
  units: number;
  perUnit: number;
  freeShipping: boolean;
  available: boolean;
  badge: L10n;
  note: L10n;
  highlight: boolean;
  /** the figure to cross out, or null */
  was: number | null;
  saving: number;
}

const productSet = (pack: Pack) =>
  [...new Set((pack.items ?? []).map((i) => i.product_id))].sort().join(",");

export function resolveOffers(
  data: OffersData | undefined,
  base: { kind: "pack"; pack: Pack } | { kind: "product"; product: Product },
  packs: Pack[],
  byId: Map<string, Product>,
  lang: Lang,
  now: number,
  preview: boolean,
): OfferOption[] {
  if (!data) return [];

  let chosen: { pack: Pack; badge: L10n; note: L10n; highlight: boolean }[];
  if (data.items.length > 0) {
    const bySlug = new Map(packs.map((p) => [p.slug, p]));
    chosen = data.items.flatMap((item) => {
      const pack = bySlug.get(item.slug);
      return pack ? [{ pack, badge: item.badge, note: item.note, highlight: item.highlight }] : [];
    });
  } else {
    // automatic: every pack made of exactly the same product(s) as this page
    const key = base.kind === "product" ? base.product.id : productSet(base.pack);
    const auto = packs.filter((p) => productSet(p) === key);
    if (base.kind === "pack" && !auto.some((p) => p.id === base.pack.id)) auto.push(base.pack);
    chosen = auto.map((pack) => ({ pack, badge: {}, note: {}, highlight: false }));
  }

  const priceOf = (id: string) => {
    const p = byId.get(id);
    return p && p.status === "active" ? Number(p.price) : undefined;
  };

  const options = chosen.flatMap(({ pack, badge, note, highlight }): OfferOption[] => {
    const quote = packQuote(pack.items ?? [], pack.pricing, priceOf);
    if (!quote) return [];
    const units = (pack.items ?? []).reduce((n, i) => n + Math.max(1, i.quantity), 0);
    const inWindow =
      (!pack.starts_at || new Date(pack.starts_at).getTime() <= now) &&
      (!pack.ends_at || new Date(pack.ends_at).getTime() > now);
    const inStock = (pack.items ?? []).every((i) => (byId.get(i.product_id)?.stock ?? 0) >= Math.max(1, i.quantity));
    const firstImage = byId.get(pack.items?.[0]?.product_id ?? "")?.product_images?.[0]?.url ?? "";
    return [
      {
        pack,
        id: pack.id,
        slug: pack.slug,
        name: pickLang(lang, pack.name_fr, pack.name_ar ?? pack.name_fr, pack.name_en),
        tagline: pickLang(lang, pack.tagline_fr ?? "", pack.tagline_ar ?? "", pack.tagline_en),
        cover: safeUrl(pack.cover_url) || firstImage,
        unit: quote.unit,
        units,
        perUnit: units > 0 ? quote.unit / units : quote.unit,
        freeShipping: Boolean(pack.pricing?.free_shipping),
        available: inWindow && inStock && (preview || pack.status === "published"),
        badge,
        note,
        highlight,
        was: quote.compare,
        saving: quote.compare ? quote.compare - quote.unit : 0,
      },
    ];
  });

  if (data.items.length === 0) options.sort((a, b) => a.units - b.units || a.unit - b.unit);

  if (data.savings === "none") {
    for (const o of options) {
      o.was = null;
      o.saving = 0;
    }
  } else if (data.savings === "first" && options.length > 0) {
    // the saving against the entry offer's per-unit rate — the honest way to
    // say "the 5-box is cheaper per box than the 3-box"
    const rate = options[0].perUnit;
    for (const o of options) {
      const was = Math.round(rate * o.units);
      o.was = was > o.unit ? was : null;
      o.saving = o.was ? o.was - o.unit : 0;
    }
  }
  return options;
}

/** which option is selected when the page opens */
export function defaultOfferId(options: OfferOption[], data: OffersData | undefined, basePackId: string | null): string | null {
  if (options.length === 0) return null;
  const usable = options.filter((o) => o.available);
  const pool = usable.length ? usable : options;
  return (
    // a pack's own page opens on that pack
    pool.find((o) => o.id === basePackId)?.id ??
    pool.find((o) => data?.preselect && o.slug === data.preselect)?.id ??
    pool.find((o) => o.highlight)?.id ??
    pool[0].id
  );
}
