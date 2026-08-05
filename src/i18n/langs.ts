import type { Lang } from "@/types/db";

/** Display order of the language switcher, and the only values accepted
 *  from localStorage — anything else falls back to FR. */
export const LANGS: readonly Lang[] = ["fr", "ar", "en"];

/** Switcher label: each language named in its own script. */
export const LANG_LABEL: Record<Lang, string> = { fr: "FR", ar: "ع", en: "EN" };

/** Full name, for the switcher's accessible label. */
export const LANG_NAME: Record<Lang, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
};

/** Next language in the cycle — the switcher is one button, not a menu. */
export function nextLang(current: Lang): Lang {
  const i = LANGS.indexOf(current);
  return LANGS[(i + 1) % LANGS.length];
}
