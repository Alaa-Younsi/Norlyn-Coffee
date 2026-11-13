import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { gsap, SplitText } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type Tag = "h1" | "h2" | "h3" | "p";

/**
 * A heading whose lines rise out of their own masks as it scrolls in — the
 * site's one text entrance, replacing the small-caps kicker + fade that every
 * template ships.
 *
 * Two traps this is built around:
 *  - SplitText rewrites the element's children, and `revert()` restores the
 *    HTML it saw at split time — so after a language switch it would paint the
 *    OLD language back over React's render. `key={lang}` gives every language
 *    a fresh element instead.
 *  - Arabic is joined script: splitting it into lines is fine, into letters is
 *    not. It is split by words only.
 *
 * Text stays real text throughout (screen readers get the aria-label SplitText
 * sets), and under reduced motion nothing is split at all.
 */
export function RevealHeading({
  as = "h2",
  children,
  className,
  delay = 0,
}: {
  as?: Tag;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { lang } = useLanguage();
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const arabic = lang === "ar";
      const split = SplitText.create(el, {
        type: arabic ? "words" : "lines,words",
        mask: arabic ? "words" : "lines",
        // the italic accent's descenders need room inside the mask
        linesClass: "pb-[0.08em] -mb-[0.08em]",
      });
      gsap.from(arabic ? split.words : split.lines, {
        yPercent: 115,
        rotate: arabic ? 0 : 2.5,
        duration: 1.15,
        delay,
        ease: "expo.out",
        stagger: 0.09,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [lang, delay]);

  const Component = as;
  return (
    <Component key={lang} ref={ref} className={cn("text-balance", className)}>
      {children}
    </Component>
  );
}
