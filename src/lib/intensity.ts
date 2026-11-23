/**
 * The intensity printed on the box ("Intensité 8"), which is the number a
 * shopper compares in the shop aisle — so it is the number the site shows.
 *
 * Read off the client's packaging photographs (assets-src/raw/Boites/album2):
 * Vert 8, Or 10, Brun 11, Noir 13, on the usual capsule scale that tops out at
 * 13. The `intensity` column (0–100) predates this and only drives the bean
 * row's fill; the flavoured boxes carry no printed number, so they get none
 * here rather than an invented one.
 */
export const INTENSITY_SCALE = 13;

const PRINTED: Record<string, number> = {
  "moriva-vert": 8,
  "moriva-or": 10,
  "moriva-brun": 11,
  "moriva-noir": 13,
};

/** The number on the box, or null when the box has none. */
export function printedIntensity(slug: string | null | undefined): number | null {
  return slug ? (PRINTED[slug] ?? null) : null;
}

/** How many of five beans to fill: from the printed number when there is one. */
export function intensityBeans(slug: string | null | undefined, intensity: number | null): number {
  const printed = printedIntensity(slug);
  if (printed !== null) return Math.max(1, Math.round((printed / INTENSITY_SCALE) * 5));
  return Math.round(((intensity ?? 0) / 100) * 5);
}

/**
 * Assortment boxes carry several intensities at once — the Coffret Mixte
 * holds 5 of each bio espresso — so they show the whole range, not one number.
 */
const MIXED: Record<string, number[]> = {
  "coffret-mixte-intensites": [8, 10, 11, 13],
};

export function mixedIntensities(slug: string | null | undefined): number[] | null {
  return slug ? (MIXED[slug] ?? null) : null;
}
