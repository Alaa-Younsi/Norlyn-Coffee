import { createContext } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { Lang } from "@/types/db";

/**
 * Editor-only strings carry their three languages inline: the builder has a
 * few hundred option labels and keeping each beside the control it names is
 * easier to maintain than a parallel key file. The type demands all three.
 */
export type Tri = { fr: string; en: string; ar: string };

export const tri = (fr: string, en: string, ar: string): Tri => ({ fr, en, ar });

export function useTx() {
  const { lang } = useLanguage();
  return (s: Tri) => s[lang] || s.fr;
}

/** which language the editor is currently WRITING in (not the admin UI language) */
export const EditLangContext = createContext<{ editLang: Lang; setEditLang: (l: Lang) => void }>({
  editLang: "fr",
  setEditLang: () => undefined,
});
