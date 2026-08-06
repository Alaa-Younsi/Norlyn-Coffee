/**
 * Keeping client-chosen colours legible.
 *
 * Every variant carries an `accent_color` that is true to its packaging — the
 * Noir capsule really is near-black, the Or really is dark gold. Painting a
 * headline with that raw value is what put "Moriva Ristretto Noir" at roughly
 * 1.2:1 against the dark theme's background: technically rendered, actually
 * invisible.
 *
 * So the accent is treated as a HUE the design owns, not a finished colour:
 * lightness is clamped into the band that reads on the current theme, and the
 * result is verified against WCAG contrast before it is handed back. The
 * client can pick any colour in the admin and no combination can produce
 * unreadable text.
 *
 * The 3:1 target is the AA threshold for large text, which is the only place
 * this is used — headlines and the product title. Body copy never takes an
 * accent colour.
 */

type Theme = "light" | "dark";

/** the lightest / darkest surface an accent is drawn on, per theme */
const SURFACE: Record<Theme, [number, number, number]> = {
  light: [252, 248, 242],
  dark: [19, 14, 10],
};

/** lightness band (%) that keeps a hue distinguishable on each theme */
const BAND: Record<Theme, [number, number]> = {
  light: [18, 42],
  dark: [58, 82],
};

export const BRAND_ACCENT = "rgb(var(--c-brand))";

export function readableAccent(
  color: string | null | undefined,
  theme: Theme,
  minRatio = 3,
): string {
  const rgb = parseHex(color);
  if (!rgb) return BRAND_ACCENT;

  const [h, s, l] = rgbToHsl(rgb);
  const [min, max] = BAND[theme];
  let lightness = clamp(l, min, max);

  // clamping alone can still fall short for a very desaturated hue, so walk it
  // the rest of the way toward the readable end of the band
  const direction = theme === "dark" ? 4 : -4;
  for (let step = 0; step < 12; step += 1) {
    if (contrast(hslToRgb(h, s, lightness), SURFACE[theme]) >= minRatio) break;
    lightness = clamp(lightness + direction, 5, 95);
  }
  return hslToCss(h, s, lightness);
}

/* ------------------------------------------------------------------ colour */

function parseHex(value: string | null | undefined): [number, number, number] | null {
  if (!value) return null;
  const hex = value.trim().replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) return [0, 0, l * 100];

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  h *= 60;
  if (h < 0) h += 360;

  return [h, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function hslToCss(h: number, s: number, l: number): string {
  return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
