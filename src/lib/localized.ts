import type { Lang } from "@/types/db";

/**
 * Pick the right variant of a client-entered, DB-backed value.
 *
 * Static UI strings go through `t()` — this is only for content the client
 * types into the admin (product names, article bodies, slide captions…).
 *
 * EN has no column in the schema yet, so it falls back to FR rather than
 * rendering an empty product name. When an `*_en` column is added, pass it as
 * the 4th argument and that field is English-aware with no other change;
 * `en ?? fr` also covers a column that exists but is still NULL, which is what
 * every row looks like the day the migration lands.
 */
export function pickLang<T>(lang: Lang, fr: T, ar: T, en?: T | null): T {
  if (lang === "ar") return ar;
  if (lang === "en") return en ?? fr;
  return fr;
}
