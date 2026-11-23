import type { Theme } from "./types";

/**
 * The site's own components (CheckoutForm, Button, Field…) paint with the
 * `--c-*` RGB-triplet tokens from index.css. Inside a custom page those must
 * follow the PAGE's palette, or a light "Crème" page renders a dark order
 * form with invisible labels. These helpers translate a Theme into tokens.
 */

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const n = Number.parseInt(h.slice(0, 6), 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [0, 0, 0];
}

const triplet = ([r, g, b]: RGB) => `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** relative luminance, 0 (black) … 1 (white) */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const isLightTheme = (theme: Theme) => luminance(theme.bg) > 0.4;

/** `--c-*` overrides for everything rendered inside the page */
export function siteTokens(theme: Theme): Record<string, string> {
  const bg = hexToRgb(theme.bg);
  const surface = hexToRgb(theme.surface);
  const text = hexToRgb(theme.text);
  const light = isLightTheme(theme);
  return {
    "--c-bg": triplet(bg),
    "--c-panel": triplet(surface),
    "--c-panel-2": triplet(mix(surface, text, 0.06)),
    "--c-line": triplet(mix(bg, text, 0.2)),
    "--c-ink": triplet(text),
    "--c-muted": triplet(hexToRgb(theme.muted)),
    "--c-brand": triplet(hexToRgb(theme.accent)),
    "--c-gold-hi": triplet(hexToRgb(theme.accent2)),
    // "cream" is the site's text-on-gold colour: always the darker end
    "--c-cream": triplet(light ? text : bg),
  };
}
