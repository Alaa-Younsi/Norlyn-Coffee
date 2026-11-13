import { useRef } from "react";
import { RevealHeading } from "@/components/brand/RevealHeading";
import { ScrollLitText } from "@/components/brand/ScrollLitText";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDriftIn, useFadeUp } from "@/hooks/useScrollFX";

/** "Deux gammes, un seul standard" → the clause after the comma is the accent. */
function splitAccent(title: string): [string, string] {
  const match = title.match(/^(.+?[,،])\s*(.+)$/);
  return match ? [match[1], match[2]] : [title, ""];
}

/**
 * Chapter one. The copy sits on the start side — the cup has
 * just flown to the end side and parks there as a capsule.
 *
 *  - the heading's second clause is set in the gold italic accent;
 *  - the first paragraph is a statement read at scroll pace: its words light
 *    up one after another as the page moves.
 */
export function StorySection() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  useFadeUp(sectionRef);
  // the cup flies to the end side as this section arrives — the copy slides
  // in from the start side, so the two motions mirror around the centreline
  useDriftIn(copyRef, "start", 90);

  const [lead, accent] = splitAccent(t("story.title"));

  return (
    <section
      ref={sectionRef}
      id="story"
      className="relative mx-auto flex min-h-screen max-w-7xl items-center overflow-clip px-6 py-28"
    >
      <FloatingBeans count={5} seed={3} />

      <div ref={copyRef} className="relative max-w-2xl">
        <RevealHeading className="font-display text-[2.7rem] leading-[0.98] font-medium tracking-[-0.03em] sm:text-6xl lg:text-[5.2rem]">
          {lead}
          {accent && (
            <>
              <br />
              <span className="fx-accent text-brand">{accent}</span>
            </>
          )}
        </RevealHeading>

        <ScrollLitText
          text={t("story.p1")}
          className="mt-10 max-w-xl font-display text-[1.45rem] leading-[1.45] tracking-[-0.005em] sm:text-[1.75rem]"
        />
        <p data-fade="22" className="mt-6 max-w-lg leading-[1.75] text-muted">
          {t("story.p2")}
        </p>
      </div>
    </section>
  );
}
