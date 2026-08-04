import type { MetaPixel, PixelEventKey } from "@/types/db";

/**
 * Multi-pixel Meta runtime. Two rules shape everything here:
 *
 * 1. Every event goes through `trackSingle`, NEVER plain `track`. `track`
 *    broadcasts to every initialised pixel, which files a landing page's
 *    conversions into the retargeting pixel's data and makes both campaigns'
 *    numbers wrong.
 * 2. Which pixels are live is decided from the DB, by scope + match values —
 *    never hardcoded.
 *
 * Nothing in this module throws. An ad blocker is the normal case for a real
 * share of Algerian visitors and must never break checkout.
 */

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

interface FbqFn {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  push?: FbqFn;
  loaded?: boolean;
  version?: string;
}

const SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";

export interface PixelContext {
  pathname: string;
  productSlug?: string;
  landingSlug?: string;
  /** ids a page forces on regardless of scope rules */
  extraPixelIds?: string[];
}

export interface PixelParams {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{ id: string; quantity: number }>;
  num_items?: number;
  search_string?: string;
  [key: string]: unknown;
}

const EVENT_NAMES: Record<PixelEventKey, string> = {
  page_view: "PageView",
  view_content: "ViewContent",
  add_to_cart: "AddToCart",
  initiate_checkout: "InitiateCheckout",
  purchase: "Purchase",
  lead: "Lead",
  search: "Search",
};

/** Which pixel ids fbq already knows about — init is idempotent per id. */
const initialised = new Set<string>();

/**
 * Installs Meta's stub (the queue buffering calls made before the script
 * downloads) and appends the script tag once.
 */
function ensureFbq(): FbqFn | undefined {
  if (typeof window === "undefined" || typeof document === "undefined") return undefined;

  if (!window.fbq) {
    const fbq: FbqFn = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue?.push(args);
    };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = fbq;
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
  }

  if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = SCRIPT_SRC;
    document.head.appendChild(script);
  }

  return window.fbq;
}

/**
 * `all` → every storefront page. `paths` → pathname PREFIX match. `products` /
 * `landing` → slug membership.
 *
 * An empty match_values on a SCOPED pixel means "every page of that kind"
 * (one pixel for all product pages) — not "no pages".
 */
export function matchPixels(pixels: MetaPixel[], ctx: PixelContext): MetaPixel[] {
  const forced = new Set(ctx.extraPixelIds ?? []);

  return pixels
    .filter((pixel) => {
      if (!pixel.active) return false;
      if (forced.has(pixel.id)) return true;

      const values = pixel.match_values ?? [];
      switch (pixel.scope) {
        case "all":
          return true;
        case "paths":
          if (values.length === 0) return true;
          return values.some(
            (value) => ctx.pathname === value || ctx.pathname.startsWith(`${value}/`),
          );
        case "products":
          if (!ctx.productSlug) return false;
          return values.length === 0 || values.includes(ctx.productSlug);
        case "landing":
          if (!ctx.landingSlug) return false;
          return values.length === 0 || values.includes(ctx.landingSlug);
        default:
          return false;
      }
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function initPixels(pixels: MetaPixel[]): void {
  const fbq = ensureFbq();
  if (!fbq) return;

  const fresh = pixels.filter((p) => !initialised.has(p.pixel_id));
  if (fresh.length === 0) return;

  // The pixel's own automatic PageView ignores the per-pixel event toggles and
  // doubles up with the one the router sends.
  fbq("set", "autoConfig", false, "all");

  for (const pixel of fresh) {
    fbq("init", pixel.pixel_id);
    initialised.add(pixel.pixel_id);
  }
}

/** ids already initialised — the provider's per-(path, id) PageView bookkeeping. */
export function isInitialised(pixelId: string): boolean {
  return initialised.has(pixelId);
}

function hasValidValue(params?: PixelParams): boolean {
  if (!params || !("value" in params)) return true;
  const value = params.value;
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Sends one event to each matched pixel that has it enabled.
 * `eventId` is Meta's dedup key — the same conversion later sent server-side
 * collapses into one.
 */
export function trackEvent(
  pixels: MetaPixel[],
  key: PixelEventKey,
  params?: PixelParams,
  eventId?: string,
): void {
  const fbq = typeof window === "undefined" ? undefined : window.fbq;
  if (!fbq) return;

  // A value that resolves to undefined/NaN/0 still gets accepted by Meta as a
  // "successful" event and silently corrupts ROAS reporting.
  if (!hasValidValue(params)) {
    if (import.meta.env.DEV) {
      console.warn(`[pixel] skipped ${key}: invalid value`, params?.value);
    }
    return;
  }

  for (const pixel of pixels) {
    if (pixel.events?.[key] === false) continue;
    if (!initialised.has(pixel.pixel_id)) continue;

    const payload: PixelParams = { ...params };
    if ("value" in payload && !payload.currency) payload.currency = pixel.currency || "DZD";

    const args: unknown[] = ["trackSingle", pixel.pixel_id, EVENT_NAMES[key]];
    // the params slot must be filled before the eventID slot, or fbq reads the
    // dedup object as the event's parameters
    if (Object.keys(payload).length > 0 || eventId) args.push(payload);
    if (eventId) args.push({ eventID: eventId });

    fbq(...args);
  }
}
