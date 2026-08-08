import type { Lang } from "@/types/db";

/**
 * Pick the right variant of a client-entered, DB-backed value.
 *
 * Static UI strings go through `t()` — this is only for content the client
 * types into the admin (product names, article bodies, slide captions…).
 *
 * Since migration 0012 every localized table carries an `*_en` column, but
 * only `*_fr` is NOT NULL — so English falls back to French rather than
 * rendering an empty product name. That covers both a row the client added
 * before writing its English and any table whose English column is still to
 * come. The 4th argument stays optional for exactly that reason.
 *
 * `en ?? fr` and not `en || fr`: an empty string the client typed on purpose
 * is a deliberate "leave this blank", and only NULL means "not translated".
 */
export function pickLang<T>(lang: Lang, fr: T, ar: T, en?: T | null): T {
  if (lang === "ar") return ar;
  if (lang === "en") return en ?? fr;
  return fr;
}
