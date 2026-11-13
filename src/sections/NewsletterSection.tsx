import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useHoneypot } from "@/hooks/useHoneypot";
import { useSubscribeNewsletter } from "@/hooks/useNewsletter";
import { useRevealOnScroll } from "@/hooks/useScrollFX";
import type { TranslationKey } from "@/i18n/translations";
import type { MascotEmotion } from "@/lib/mascot";

/** Cheap client-side gate. The real one is the regex in migration 0010. */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;

/**
 * The last thing on the home page before the footer.
 *
 * Deliberately one field. Every extra input on a newsletter form costs
 * signups, and the shop already collects a name and a phone at checkout — the
 * only thing it is missing is a way to reach people who are not ready to buy.
 *
 * Success is a state of THIS section, not a toast: the form is replaced by the
 * confirmation in place, so the answer appears where the user was looking.
 */
export function NewsletterSection() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  useRevealOnScroll(sectionRef);
  const { isSpam } = useHoneypot();
  const subscribe = useSubscribeNewsletter();

  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [done, setDone] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorKey(null);

    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || value.length > 160) {
      setErrorKey("newsletter.invalid");
      return;
    }
    // a bot that filled the hidden field gets the success screen and no row —
    // telling it why would just teach the next attempt
    if (isSpam(honeypot)) {
      setDone(true);
      return;
    }

    try {
      await subscribe.mutateAsync({ email: value });
      setDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorKey(
        message.includes("ERR_RATE_LIMIT")
          ? "newsletter.rateLimit"
          : message.includes("ERR_INVALID_INPUT")
            ? "newsletter.invalid"
            : "newsletter.error",
      );
    }
  };

  const face: MascotEmotion = done ? "love" : errorKey ? "surprised" : "happy";

  return (
    // the ref is the SECTION and data-reveal is on the block inside it:
    // useRevealOnScroll does root.querySelectorAll(), which never matches the
    // root itself — the two on one element is a silent no-op
    <section ref={sectionRef} className="relative overflow-clip px-6 py-24 sm:py-32">
      <div
        data-reveal
        className="relative mx-auto grid max-w-7xl items-end gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20"
      >
        <div>
          {done ? (
            <h2 className="font-display text-[2.6rem] leading-[1.02] font-medium tracking-[-0.02em] sm:text-6xl">
              {t("newsletter.doneTitle")}
            </h2>
          ) : (
            <h2 className="font-display text-[2.6rem] leading-[1.02] font-medium tracking-[-0.02em] sm:text-6xl">
              {t("newsletter.title")}{" "}
              <span className="fx-accent text-brand">{t("newsletter.titleAccent")}</span>
            </h2>
          )}
          <p className="mt-6 max-w-md leading-relaxed text-muted">
            {done ? t("newsletter.doneBody") : t("newsletter.subtitle")}
          </p>
        </div>

        <div className="flex items-end gap-5">
          {/* the cup watches you type — happy, surprised at a typo, in love once you're in */}
          <Mascot
            emotion={face}
            palette={["happy", "love", "surprised"]}
            size={76}
            className="hidden shrink-0 sm:block"
          />

          {done ? (
            <span className="inline-flex items-center gap-2 border-b border-brand/50 pb-3 font-display text-xl text-brand">
              <Check size={18} />
              {t("newsletter.doneBadge")}
            </span>
          ) : (
            <form onSubmit={onSubmit} className="w-full" noValidate>
              {/* honeypot — off-screen, never focusable, invisible to real users */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              {/* one line, one gold rule, one round button — the whole form */}
              <div className="flex items-center gap-3 border-b border-ink/30 pb-3 transition-colors focus-within:border-brand">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  // an address is always LTR, even on the Arabic page
                  dir="ltr"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("newsletter.placeholder")}
                  aria-label={t("newsletter.placeholder")}
                  aria-invalid={errorKey !== null}
                  className="min-w-0 flex-1 bg-transparent font-display text-xl text-ink placeholder:text-muted/60 focus:outline-none sm:text-2xl"
                />
                <button
                  type="submit"
                  disabled={subscribe.isPending}
                  aria-label={subscribe.isPending ? t("newsletter.sending") : t("newsletter.cta")}
                  className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand text-cream transition-transform duration-300 hover:scale-105 disabled:opacity-50"
                >
                  <ArrowRight size={18} className="rtl:-scale-x-100" />
                </button>
              </div>

              {errorKey && (
                <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
                  {t(errorKey)}
                </p>
              )}
              <p className="mt-3 text-xs text-muted">{t("newsletter.privacy")}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
