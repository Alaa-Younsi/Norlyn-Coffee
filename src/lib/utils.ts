/** Plain string join — NOT tailwind-merge; later classes don't override earlier ones. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * PostgREST `.or()` filter strings treat `,()` as grammar and `%_` as ILIKE
 * wildcards — sanitize search input before interpolating (filter-grammar
 * injection guard).
 */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()]/g, "").replace(/[\\%_]/g, "\\$&").slice(0, 100);
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Maps progress p within [start, end] to 0..1, clamped.
 *
 * A zero-width (or inverted) range would divide by zero and return NaN at
 * p === start, and NaN is not survivable downstream: the 3D rig damps its
 * transforms with `pos += (target - pos) * damp`, so a single NaN target
 * sticks forever and the object stays off screen until a reload. A degenerate
 * range therefore reads as a hard switch at `start` instead.
 */
export function segment(p: number, start: number, end: number): number {
  if (end <= start) return p < start ? 0 : 1;
  return clamp((p - start) / (end - start), 0, 1);
}
