import { createContext, useContext } from "react";
import type { CheckoutLine } from "@/components/checkout/CheckoutForm";
import type { PackTier } from "@/lib/packPricing";
import type { OfferOption } from "@/lib/pageBuilder/offers";
import type { CtaTarget, Theme } from "@/lib/pageBuilder/types";
import type { Lang, Product } from "@/types/db";

export interface PageItem {
  product: Product;
  quantity: number;
  /** the unit price used inside this pack (custom or list) */
  unitPrice: number;
}

/** Everything a block may need about what is being sold. */
export interface PageContextValue {
  kind: "pack" | "product";
  lang: Lang;
  dir: "ltr" | "rtl";
  theme: Theme;
  name: string;
  tagline: string;
  coverUrl: string | null;
  /** what is actually being bought — the selected offer's name, or `name` */
  lineName: string;
  /** one unit (one pack / one box) */
  unit: number | null;
  compare: number | null;
  /** Σ list prices (packs) — the "bought separately" figure */
  list: number | null;
  tiers: PackTier[];
  freeShipping: boolean;
  maxQty: number;
  items: PageItem[];
  available: boolean;
  qty: number;
  setQty: (qty: number) => void;
  /** total for the current qty, tiers applied */
  lineTotal: number | null;
  addToCart: () => void;
  checkoutLines: CheckoutLine[];
  onOrdered: (orderNumber: string) => void;
  go: (target: CtaTarget) => void;
  /** admin preview: no real orders, no fixed-position chrome */
  preview: boolean;
  /** the options of the page's "offers" block (empty when it has none) */
  offers: OfferOption[];
  offerId: string | null;
  selectOffer: (id: string) => void;
}

export const PageContext = createContext<PageContextValue | null>(null);

export function usePage(): PageContextValue {
  const ctx = useContext(PageContext);
  if (!ctx) throw new Error("usePage must be used inside <PageRenderer>");
  return ctx;
}
