import type { Lang } from "@/types/db";

/**
 * `12 500 DA` — space thousands separator, DA suffix. Wrapped in Unicode
 * LTR-isolate marks (U+2066/U+2069) so the amount doesn't bidi-reorder to
 * "DA 950" inside RTL text.
 */
export function formatPrice(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const [intPart, decPart] = rounded.toString().split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `⁦${grouped}${decPart ? `,${decPart}` : ""} DA⁩`;
}

const DATE_LOCALE: Record<Lang, string> = {
  fr: "fr-DZ",
  ar: "ar-DZ",
  // en-GB, not en-US: day-before-month matches what the FR/AR views show, so
  // switching language never silently reorders 05/08 into 08/05.
  en: "en-GB",
};

export function formatDate(iso: string, lang: Lang = "fr"): string {
  return new Date(iso).toLocaleDateString(DATE_LOCALE[lang], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
