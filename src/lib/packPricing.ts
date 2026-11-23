/**
 * Client mirror of `pack_quote()` / `pack_line_total()` in
 * supabase/migrations/0021_packs_and_pages.sql — DISPLAY ONLY. The order is
 * always re-priced by place_order; if these two ever disagree, the database
 * wins and the shopper sees the server's total on the confirmation page.
 * Change one, change the other.
 */

export type PackPricingMode = "sum" | "fixed" | "percent" | "amount";

export interface PackTier {
  qty: number;
  percent: number;
}

export interface PackPricing {
  mode: PackPricingMode;
  value?: number;
  /** round DOWN to a multiple of this (1 / undefined = none) */
  step?: number;
  /** 0–99: force the last two digits, never rounding up */
  ending?: number | null;
  floor?: number;
  compare?: "auto" | "none" | number;
  tiers?: PackTier[];
  free_shipping?: boolean;
}

export interface PackItem {
  product_id: string;
  quantity: number;
  /** custom unit price inside this pack only */
  price?: number | null;
}

export interface PackQuote {
  /** Σ (custom or list price) × qty — what the mode applies to */
  base: number;
  /** Σ list price × qty */
  list: number;
  /** one pack */
  unit: number;
  /** crossed-out price, or null */
  compare: number | null;
}

export function packQuote(
  items: PackItem[],
  pricing: PackPricing,
  priceOf: (productId: string) => number | undefined,
): PackQuote | null {
  if (items.length === 0) return null;
  let base = 0;
  let list = 0;
  for (const item of items) {
    const price = priceOf(item.product_id);
    if (price === undefined) return null;
    const qty = Math.max(1, Math.floor(item.quantity || 1));
    list += price * qty;
    const custom = item.price !== null && item.price !== undefined && item.price >= 0 ? item.price : price;
    base += custom * qty;
  }

  const value = Math.max(0, pricing.value ?? 0);
  let x: number;
  switch (pricing.mode) {
    case "fixed":
      x = value;
      break;
    case "percent":
      x = Math.round((base * (100 - Math.min(value, 95))) / 100);
      break;
    case "amount":
      x = base - value;
      break;
    default:
      x = base;
  }
  const step = Math.max(1, pricing.step ?? 1);
  if (step > 1) x = Math.floor(x / step) * step;
  const ending = pricing.ending;
  if (ending !== null && ending !== undefined && ending >= 0 && ending <= 99) {
    let candidate = Math.floor(x / 100) * 100 + ending;
    if (candidate > x) candidate -= 100;
    x = candidate;
  }
  x = Math.max(x, Math.max(0, pricing.floor ?? 0), 0);

  const cmp = pricing.compare ?? "auto";
  const compare =
    cmp === "none" ? null : cmp === "auto" ? (list > x ? list : null) : cmp > x ? cmp : null;

  return { base, list, unit: x, compare };
}

export function tierPercent(qty: number, pricing: Pick<PackPricing, "tiers">): number {
  const hit = (pricing.tiers ?? []).filter((t) => t.qty <= qty).map((t) => t.percent);
  return Math.min(hit.length ? Math.max(...hit) : 0, 95);
}

export function packLineTotal(unit: number, qty: number, pricing: Pick<PackPricing, "tiers">): number {
  return Math.round((unit * qty * (100 - tierPercent(qty, pricing))) / 100);
}

/** Clean what the editor produced before saving — the DB clamps again anyway. */
export function sanitizePricing(raw: Partial<PackPricing> | null | undefined): PackPricing {
  const mode: PackPricingMode = ["sum", "fixed", "percent", "amount"].includes(raw?.mode ?? "")
    ? (raw?.mode as PackPricingMode)
    : "percent";
  const num = (v: unknown, min = 0, max = 10_000_000) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
  };
  const tiers = (raw?.tiers ?? [])
    .map((t) => ({ qty: Math.floor(num(t.qty, 2, 20)), percent: num(t.percent, 0, 95) }))
    .filter((t) => t.percent > 0)
    .sort((a, b) => a.qty - b.qty);
  const compare =
    raw?.compare === "none" || raw?.compare === "auto"
      ? raw.compare
      : typeof raw?.compare === "number" && raw.compare > 0
        ? raw.compare
        : "auto";
  return {
    mode,
    value: num(raw?.value, 0, mode === "percent" ? 95 : 10_000_000),
    step: Math.max(1, Math.floor(num(raw?.step, 1))),
    ending: raw?.ending === null || raw?.ending === undefined ? null : Math.floor(num(raw.ending, 0, 99)),
    floor: num(raw?.floor),
    compare,
    tiers,
    free_shipping: Boolean(raw?.free_shipping),
  };
}
