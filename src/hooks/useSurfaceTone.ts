/**
 * The tone of the surface colours are drawn on. The site is dark-only
 * (Nov 2026) and every shade of the roast is dark, so this is a constant —
 * kept as a hook so the call sites that adapt an accent colour to its
 * background (readableAccent) read the same if a light surface ever returns.
 */
export function useSurfaceTone(): "light" | "dark" {
  return "dark";
}
