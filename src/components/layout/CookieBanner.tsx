import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Mascot } from "@/components/mascot/Mascot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useConsent } from "@/store/consent";
import { cn } from "@/lib/utils";

/**
 * The consent card. A compact card at the bottom, never a full-width wall
 * over the shop, and it waits until the splash has lifted (it mounts with the store
 * layout, which sits under the splash curtain anyway).
 *
 * Three equal choices — accept, refuse, customise — because refusing must be
 * as easy as accepting. The only optional category is measurement/advertising
 * (the Meta pixel); essentials are listed for honesty and cannot be turned off.
 * Hidden on /admin.
 */
export function CookieBanner() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const open = useConsent((state) => state.open);
  const current = useConsent((state) => state.marketing);
  const decide = useConsent((state) => state.decide);
  const [customising, setCustomising] = useState(false);
  const [marketing, setMarketing] = useState(current);

  if (pathname.startsWith("/admin")) return null;

  return (
    <AnimatePresence>
      {open && (
        // centred at the bottom on wide screens: the hero's start side carries
        // the tagline and its end side the order button — the middle holds
        // only the scroll seal. The wrapper centres; the motion child animates
        // (framer's transform would overwrite a translate class on one element).
        <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[55] flex justify-center sm:bottom-5">
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label={t("consent.title")}
          className="pointer-events-auto w-full sm:w-[26rem]"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
        >
          <div className="rounded-3xl border border-line bg-panel p-5 shadow-[0_30px_70px_-30px_rgb(0_0_0/0.8)] sm:p-6">
            <div className="flex items-start gap-4">
              <Mascot emotion="wink" palette={["wink"]} size={44} float={false} className="shrink-0" />
              <div>
                <p className="font-display text-xl leading-tight">{t("consent.title")}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t("consent.body")}{" "}
                  <Link to="/legal/cookies" className="text-ink underline decoration-brand/60 underline-offset-4">
                    {t("consent.policy")}
                  </Link>
                </p>
              </div>
            </div>

            {customising && (
              <ul className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
                <li className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block font-medium">{t("consent.essential")}</span>
                    <span className="block text-xs text-muted">{t("consent.essentialHint")}</span>
                  </span>
                  <span className="mt-0.5 shrink-0 text-xs text-brand">{t("consent.always")}</span>
                </li>
                <li className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block font-medium">{t("consent.marketing")}</span>
                    <span className="block text-xs text-muted">{t("consent.marketingHint")}</span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={marketing}
                    aria-label={t("consent.marketing")}
                    onClick={() => setMarketing((v) => !v)}
                    className={cn(
                      "relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
                      marketing ? "bg-brand" : "bg-line",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-[inset-inline-start] duration-300",
                        marketing ? "start-[1.375rem]" : "start-0.5",
                      )}
                    />
                  </button>
                </li>
              </ul>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2">
              {customising ? (
                <button
                  type="button"
                  onClick={() => decide(marketing)}
                  className="col-span-3 cursor-pointer rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-cream"
                >
                  {t("consent.save")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => decide(false)}
                    className="cursor-pointer rounded-full border border-line px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/40"
                  >
                    {t("consent.refuse")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomising(true)}
                    className="cursor-pointer rounded-full border border-line px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/40"
                  >
                    {t("consent.customize")}
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(true)}
                    className="cursor-pointer rounded-full bg-brand px-3 py-2.5 text-sm font-semibold text-cream"
                  >
                    {t("consent.accept")}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
