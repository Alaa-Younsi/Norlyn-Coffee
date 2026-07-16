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

export function formatDate(iso: string, lang: "fr" | "ar" = "fr"): string {
  return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-DZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
