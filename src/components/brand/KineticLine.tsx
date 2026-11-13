import { Fragment } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * A line of display type that arrives one glyph at a time: each letter rises
 * out of its own mask while it swings up from a fallen-back angle and comes
 * into focus. Arabic is joined script, so it animates by word instead.
 *
 * `play` gates the whole entrance (the hero waits for the splash to lift), and
 * a screen reader gets the whole line as plain text — the animated glyphs
 * are hidden from it.
 */
export function KineticLine({
  text,
  className,
  play = true,
  delay = 0,
  stagger = 0.028,
}: {
  text: string;
  className?: string;
  play?: boolean;
  delay?: number;
  stagger?: number;
}) {
  const { lang } = useLanguage();
  const byWord = lang === "ar";
  const words = text.split(" ");
  let glyph = 0;

  return (
    <span className={cn("inline-block [perspective:600px]", className)}>
      {/* the readable line; the glyphs below are presentation */}
      <span className="sr-only">{text}</span>
      {words.map((word, w) => {
        // letters live inside an unbreakable word box, so the line wraps
        // between words exactly as plain text would — never mid-word
        const pieces = byWord ? [word] : Array.from(word);
        return (
          <Fragment key={`${w}-${word}`}>
          <span aria-hidden className="inline-block whitespace-nowrap">
            {pieces.map((piece, k) => {
              const order = glyph++;
              return (
                <span
                  key={`${k}-${piece}`}
                  className="inline-block pb-[0.14em] -mb-[0.14em] align-bottom [clip-path:inset(-1em_-0.4em_0_-0.4em)]"
                >
                  <motion.span
                    className="inline-block origin-bottom"
                    initial={{ y: "105%", rotateX: -80, filter: "blur(6px)" }}
                    animate={play ? { y: 0, rotateX: 0, filter: "blur(0px)" } : undefined}
                    transition={{ duration: 0.9, delay: delay + order * (byWord ? stagger * 4 : stagger), ease: EASE }}
                  >
                    {piece}
                  </motion.span>
                </span>
              );
            })}
          </span>
          {/* the space sits OUTSIDE the word box: trailing whitespace inside an
              inline-block collapses and would glue the words together */}
          {w < words.length - 1 && " "}
          </Fragment>
        );
      })}
    </span>
  );
}
