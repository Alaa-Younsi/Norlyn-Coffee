import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Mascot } from "@/components/mascot/Mascot";
import { CoffeeBeanIcon } from "@/components/effects/CoffeeBeanIcon";
import { CoffeeRing } from "@/components/effects/CoffeeRing";
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
    // the ref is the SECTION and data-reveal is on the card inside it:
    // useRevealOnScroll does root.querySelectorAll(), which never matches the
    // root itself — the two on one element is a silent no-op
    <section ref={sectionRef} className="relative overflow-hidden px-6 py-20 sm:py-24">
      <CoffeeRing className="fx-spin-slow -end-24 -top-10 w-64 opacity-10 sm:w-80" />

      <div
        data-reveal
        className="relative mx-auto max-w-3xl rounded-[2rem] border border-brand/25 bg-panel/75 p-8 text-center shadow-[0_40px_90px_-50px_rgb(var(--c-ink)/0.5)] backdrop-blur-md sm:p-12"
      >
        <div className="flex items-center justify-center gap-3">
          <CoffeeBeanIcon className="w-3 text-brand/70" />
          <p className="text-xs uppercase tracking-[0.35em] text-brand">
            {t("newsletter.kicker")}
          </p>
        </div>

        <Mascot
          emotion={face}
          palette={["happy", "love", "surprised"]}
          size={84}
          className="mx-auto mt-5"
        />

        {done ? (
          <>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">{t("newsletter.doneTitle")}</h2>
            <p className="mx-auto mt-3 max-w-md text-balance text-muted">
              {t("newsletter.doneBody")}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand">
              <Check size={15} />
              {t("newsletter.doneBadge")}
            </span>
          </>
        ) : (
          <>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">
              {t("newsletter.title")}{" "}
              <span className="fx-accent text-brand">{t("newsletter.titleAccent")}</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-balance text-muted">
              {t("newsletter.subtitle")}
            </p>

            <form onSubmit={onSubmit} className="mx-auto mt-7 max-w-md" noValidate>
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

              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
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
                  className="flex-1"
                />
                <Button type="submit" disabled={subscribe.isPending} className="shrink-0">
                  <Send size={15} />
                  {subscribe.isPending ? t("newsletter.sending") : t("newsletter.cta")}
                </Button>
              </div>

              {errorKey && (
                <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
                  {t(errorKey)}
                </p>
              )}
              <p className="mt-3 text-xs text-muted">{t("newsletter.privacy")}</p>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
