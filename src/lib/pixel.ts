declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type PixelParams = Record<string, unknown>;

/**
 * A `value` of undefined/NaN/0 still registers as a "successful" event on
 * Meta's side and silently corrupts ROAS reporting — skip sending instead.
 */
function hasValidValue(params?: PixelParams): boolean {
  if (!params || !("value" in params)) return true;
  const value = params.value;
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function track(event: string, params?: PixelParams): void {
  if (!hasValidValue(params)) {
    if (import.meta.env.DEV) {
      console.warn(`[pixel] skipped ${event}: invalid value`, params);
    }
    return;
  }
  window.fbq?.("track", event, params);
}

export function trackPageView(): void {
  window.fbq?.("track", "PageView");
}

export function trackViewContent(params: PixelParams): void {
  track("ViewContent", params);
}

export function trackAddToCart(params: PixelParams): void {
  track("AddToCart", params);
}

export function trackInitiateCheckout(params: PixelParams): void {
  track("InitiateCheckout", params);
}

export function trackPurchase(params: PixelParams): void {
  track("Purchase", params);
}
