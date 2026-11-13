import { useEffect, useRef } from "react";
import { RevealHeading } from "@/components/brand/RevealHeading";
import { Mascot } from "@/components/mascot/Mascot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useFadeUp } from "@/hooks/useScrollFX";
import { gsap } from "@/lib/gsap";
import type { MascotEmotion } from "@/lib/mascot";

/**
 * The order journey as three stops on a single line of steam. The line draws
 * itself as the section scrolls past (DrawSVG, scrubbed), and each stop is
 * answered by the cup with the face that step deserves — determined when you
 * order, excited when the phone rings, in love when it's at your door.
 * Each face means something here, which is the point: the mascot used to
 * decorate, now it narrates.
 */
export function HowItWorksSection() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pathMobileRef = useRef<SVGPathElement>(null);
  useFadeUp(sectionRef);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      for (const path of [pathRef.current, pathMobileRef.current]) {
        if (!path) continue;
        gsap.fromTo(
          path,
          { drawSVG: "0%" },
          {
            drawSVG: "100%",
            ease: "none",
            scrollTrigger: { trigger: section, start: "top 70%", end: "bottom 75%", scrub: 0.6 },
          },
        );
      }
    }, section);
    return () => ctx.revert();
  }, []);

  const steps: Array<{ face: MascotEmotion; title: string; text: string }> = [
    { face: "determined", title: t("how.s1t"), text: t("how.s1d") },
    { face: "excited", title: t("how.s2t"), text: t("how.s2d") },
    { face: "love", title: t("how.s3t"), text: t("how.s3d") },
  ];

  return (
    <section ref={sectionRef} className="relative overflow-clip py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-6">
        <RevealHeading className="max-w-2xl font-display text-[2.6rem] leading-[1.02] font-medium tracking-[-0.02em] sm:text-6xl">
          {t("how.title")}
        </RevealHeading>

        <div className="relative mt-20">
          {/* desktop: one horizontal wisp of steam through the three stops */}
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-10 hidden h-28 w-full rtl:-scale-x-100 md:block"
          >
            <path
              ref={pathRef}
              d="M40 70 C 180 10, 300 120, 420 60 S 680 0, 800 62 S 1060 120, 1170 50"
              fill="none"
              stroke="rgb(var(--c-brand))"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {/* phones: the same line runs down the start edge */}
          <svg
            viewBox="0 0 40 600"
            preserveAspectRatio="none"
            aria-hidden
            className="pointer-events-none absolute start-[2.6rem] top-0 h-full w-10 md:hidden"
          >
            <path
              ref={pathMobileRef}
              d="M20 0 C 0 100, 40 200, 20 300 S 0 500, 20 600"
              fill="none"
              stroke="rgb(var(--c-brand))"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <ol className="relative grid gap-14 md:grid-cols-3 md:gap-10">
            {steps.map((step, i) => (
              <li key={step.title} data-fade="40" className="flex gap-6 md:block">
                <div className="relative shrink-0">
                  <Mascot emotion={step.face} palette={[step.face]} size={84} float={false} />
                </div>
                <div className="md:mt-8">
                  <span className="font-display text-sm tabular-nums tracking-[0.3em] text-brand">
                    0{i + 1}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-medium sm:text-3xl">{step.title}</h3>
                  <p className="mt-3 max-w-xs leading-relaxed text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
