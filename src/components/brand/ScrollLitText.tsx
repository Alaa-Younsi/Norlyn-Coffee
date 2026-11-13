import { useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { gsap, SplitText } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * A statement whose words light up as you read down it: every word starts as
 * a ghost of the ink and comes up to full strength in reading order, scrubbed
 * to the scroll, so the paragraph is read at the pace the page is scrolled.
 *
 * The colour is a `color-mix` driven by a per-word `--lit` (0 → 1) that GSAP
 * tweens — not a colour value, so it always follows the ink token. Text is
 * never hidden (a ghost word is still 22% ink), so a
 * trigger that never fires leaves a readable paragraph. Same `key={lang}`
 * reasoning as RevealHeading.
 */
export function ScrollLitText({ text, className }: { text: string; className?: string }) {
  const { lang } = useLanguage();
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const split = SplitText.create(el, { type: "words", wordsClass: "fx-lit" });
      gsap.fromTo(
        split.words,
        { "--lit": 0 },
        {
          "--lit": 1,
          ease: "none",
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 45%", scrub: 0.4 },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [lang, text]);

  return (
    <p key={lang} ref={ref} className={cn("text-pretty", className)}>
      {text}
    </p>
  );
}
