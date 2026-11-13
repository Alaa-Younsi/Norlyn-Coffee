import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * A page told as an old film, played by the scroll.
 *
 * The section pins one full screen (CSS sticky inside a tall wrapper) and a
 * single GSAP timeline, scrubbed to the scroll, plays every scene in turn.
 * Each scene gets ~1.8 screens of scroll, in three beats:
 *
 *   1. ARRIVE — the picture dissolves in under the last one, the words rise
 *      into place line by line, and the inset print slides up beside them;
 *   2. HOLD — for most of the scene nothing but a slow drift moves, so the
 *      text can actually be read;
 *   3. LEAVE — the words lift away and the next picture takes over.
 *
 * The look is an archive print: heavy letterbox bars (they close in when the
 * film starts), a sepia/low-saturation grade, a vignette, grain, and on
 * desktop a light flicker, the odd scratch and a hair of gate weave.
 *
 * Performance: every picture sits in the same sticky frame, so the browser's
 * lazy loading would fetch them all at once. Instead only the scenes next to
 * the current one mount their pictures at all, and phones are served a
 * smaller rendition (the picture is dimmed and graded — it does not need
 * 1600 px).
 *
 * Reduced motion: no pin, no timeline — the same scenes, stacked as plain
 * full-height panels.
 */

export interface Credit {
  /** the small line above, set in the gold italic — the "role" */
  role?: string;
  /** the large line — the "name" */
  name: ReactNode;
}

export interface FilmPicture {
  /** a managed image slot, or a raw URL (article covers) */
  slot?: string;
  src?: string;
}

export interface FilmScene extends FilmPicture {
  id: string;
  /** a photograph printed beside the words (on phones: above them) */
  inset?: FilmPicture;
  /** a big statement, set larger than credits */
  title?: ReactNode;
  credits?: Credit[];
  body?: ReactNode;
  /** anything else: buttons, links, a row of capsules */
  extra?: ReactNode;
  align?: "center" | "start";
  /** how dark the picture is pushed under the text (0–1) */
  dim?: number;
  /** credits above the title (a numbered chapter, an article's tag line) */
  creditsFirst?: boolean;
}

/** the archive grade — applied per picture so each stays its own GPU layer */
const GRADE = "[filter:sepia(0.42)_saturate(0.68)_contrast(1.1)_brightness(0.92)]";

/** scroll per scene, in viewport heights */
const SCENE_VH = 180;

export function CreditsFilm({ scenes, label }: { scenes: FilmScene[]; label: string }) {
  const { lang } = useLanguage();
  const wrapRef = useRef<HTMLElement>(null);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  // which scene is playing — only its neighbours mount their pictures
  const [at, setAt] = useState(0);
  const count = scenes.length;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reduced || count === 0) return;

    const ctx = gsap.context(() => {
      const bgs = gsap.utils.toArray<HTMLElement>("[data-film-bg]");
      const blocks = gsap.utils.toArray<HTMLElement>("[data-film-scene]");
      const bars = gsap.utils.toArray<HTMLElement>("[data-film-bar]");
      const last = count - 1;

      // the bars close in as the film starts
      gsap.from(bars, { scaleY: 0, duration: 1.4, ease: "expo.out", delay: 0.2 });

      gsap.set(bgs.slice(1), { autoAlpha: 0 });
      gsap.set(blocks.slice(1), { autoAlpha: 0 });

      let current = 0;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            const next = Math.min(last, Math.floor(self.progress * count));
            if (next !== current) {
              current = next;
              setAt(next);
            }
          },
        },
      });

      blocks.forEach((block, i) => {
        const bg = bgs[i];
        const lines = block.querySelectorAll<HTMLElement>("[data-film-line]");
        const inset = block.querySelector<HTMLElement>("[data-film-inset]");
        const isFirst = i === 0;
        const isLast = i === last;

        // the picture: a long cross-dissolve across the cut, then a slow push
        if (bg) {
          if (!isFirst) tl.fromTo(bg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.24 }, i - 0.12);
          tl.fromTo(bg, { scale: 1.14 }, { scale: 1, duration: 1.24 }, Math.max(0, i - 0.12));
          if (!isLast) tl.to(bg, { autoAlpha: 0, duration: 0.24 }, i + 0.88);
        }

        // ARRIVE
        if (!isFirst) {
          tl.fromTo(block, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, i + 0.02);
          if (lines.length) {
            tl.fromTo(
              lines,
              { y: 60, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.24, stagger: 0.045, ease: "power2.out" },
              i + 0.04,
            );
          }
        }
        // HOLD — a slow drift, readable the whole way
        tl.fromTo(block, { yPercent: isFirst ? 0 : 4 }, { yPercent: isLast ? 0 : -4, duration: 1 }, i);
        if (inset) tl.fromTo(inset, { y: 70 }, { y: -50, duration: 1 }, i);
        // LEAVE
        if (!isLast) tl.to(block, { autoAlpha: 0, y: -40, duration: 0.12, ease: "power1.in" }, i + 0.82);
      });
      // the end card holds before the section releases
      tl.to({}, { duration: 0.25 });
    }, wrap);

    return () => ctx.revert();
  }, [reduced, count, lang]);

  /* ---------------------------------------------------------------- render */
  const picture = (pic: FilmPicture, priority: boolean, sizes: string) =>
    pic.slot ? (
      <ImageSlot slot={pic.slot} fill flat rounded="rounded-none" priority={priority} sizes={sizes} />
    ) : pic.src ? (
      <img src={pic.src} alt="" className="h-full w-full object-cover" loading={priority ? "eager" : "lazy"} decoding="async" />
    ) : null;

  const insetPrint = (scene: FilmScene, i: number, mounted: boolean) =>
    scene.inset ? (
      <figure
        data-film-inset
        className={cn(
          "relative shrink-0 bg-[#ece2cf] p-2 pb-7 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.85)] sm:p-3 sm:pb-10",
          "w-[min(44vw,11rem)] md:w-[min(28vw,24rem)]",
          i % 2 ? "rotate-[2.5deg]" : "-rotate-[2.5deg]",
        )}
      >
        <div className={cn("relative aspect-[4/5] overflow-hidden bg-shade", GRADE)}>
          {mounted && picture(scene.inset, false, "(max-width: 767px) 44vw, 28vw")}
          <div aria-hidden className="absolute inset-0 shadow-[inset_0_0_40px_rgb(40_22_8/0.55)]" />
        </div>
      </figure>
    ) : null;

  const sceneContent = (scene: FilmScene, i: number, mounted: boolean) => {
    const hasInset = Boolean(scene.inset);
    const align = hasInset ? "start" : (scene.align ?? "center");
    const creditsBlock = scene.credits && (
      <dl
        className={cn(
          "grid gap-6 sm:gap-9",
          scene.creditsFirst ? "mb-6 sm:mb-8" : "mt-8 sm:mt-10",
          scene.credits.length > 2 && "sm:grid-cols-2 sm:gap-x-16",
        )}
      >
        {scene.credits.map((credit, k) => (
          <div key={k} data-film-line>
            {credit.role && <dt className="font-display text-base italic text-gold-hi sm:text-xl">{credit.role}</dt>}
            <dd className="mt-1.5 font-display text-xl leading-snug text-on-shade sm:text-[2rem]">{credit.name}</dd>
          </div>
        ))}
      </dl>
    );
    const words = (
      <div
        className={cn(
          "flex min-w-0 flex-col",
          align === "start" ? "items-start text-start" : "items-center text-center",
        )}
      >
        {scene.creditsFirst ? creditsBlock : null}
        {scene.title && (
          <h2
            data-film-line
            className="font-display text-[2.5rem] leading-[0.98] font-medium tracking-[-0.03em] text-balance sm:text-7xl lg:text-[6rem]"
          >
            {scene.title}
          </h2>
        )}
        {scene.body && (
          <div
            data-film-line
            className="mt-5 max-w-2xl font-display text-lg leading-[1.6] italic text-on-shade/85 sm:mt-7 sm:text-2xl"
          >
            {scene.body}
          </div>
        )}
        {scene.creditsFirst ? null : creditsBlock}
        {scene.extra && (
          <div data-film-line className="mt-8 sm:mt-10">
            {scene.extra}
          </div>
        )}
      </div>
    );
    if (!hasInset) return <div className="mx-auto w-full max-w-5xl px-6">{words}</div>;
    // the print beside the words, alternating sides; stacked on phones
    return (
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 md:items-center md:gap-16",
          i % 2 ? "md:flex-row-reverse" : "md:flex-row",
        )}
      >
        {insetPrint(scene, i, mounted)}
        {words}
      </div>
    );
  };

  if (reduced) {
    return (
      <section aria-label={label} className="bg-shade text-on-shade">
        {scenes.map((scene, i) => (
          <div key={scene.id} className="relative flex min-h-screen items-center overflow-hidden py-24">
            <div className={cn("absolute inset-0", GRADE)}>{picture(scene, i === 0, "(max-width: 767px) 85vw, 100vw")}</div>
            <div className="absolute inset-0 bg-shade" style={{ opacity: scene.dim ?? 0.62 }} aria-hidden />
            <div className="relative w-full">{sceneContent(scene, i, true)}</div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section ref={wrapRef} aria-label={label} className="relative" style={{ height: `${count * SCENE_VH + 100}vh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-shade text-on-shade">
        {/* pictures — only the current scene and its neighbours are mounted */}
        <div className="fx-weave absolute -inset-2">
          {scenes.map((scene, i) => {
            const mounted = Math.abs(i - at) <= 1;
            return (
              <div key={scene.id} data-film-bg className={cn("absolute inset-0 will-change-transform", GRADE)}>
                {mounted && picture(scene, i === 0, "(max-width: 767px) 85vw, 100vw")}
                <div
                  className="absolute inset-0 bg-shade"
                  style={{ opacity: scene.dim ?? (scene.inset ? 0.74 : 0.62) }}
                  aria-hidden
                />
              </div>
            );
          })}
        </div>

        {/* the print: vignette, grain, and on desktop flicker + scratches */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgb(20_11_4/0.9)_100%)]"
        />
        <div aria-hidden className="fx-grain pointer-events-none absolute -inset-1/2 opacity-[0.06] md:opacity-[0.1]" />
        <div aria-hidden className="fx-flicker pointer-events-none absolute inset-0 hidden bg-[#f4e3c2] md:block" />
        <div aria-hidden className="fx-scratches pointer-events-none absolute inset-0 hidden md:block" />

        {/* the scenes */}
        {scenes.map((scene, i) => (
          <div
            key={scene.id}
            data-film-scene
            className="absolute inset-x-0 top-[10vh] bottom-[10vh] flex items-center will-change-transform md:top-[13vh] md:bottom-[13vh]"
          >
            {sceneContent(scene, i, Math.abs(i - at) <= 1)}
          </div>
        ))}

        {/* letterbox — a real scope ratio, not a strip */}
        <div aria-hidden data-film-bar className="pointer-events-none absolute inset-x-0 top-0 h-[10vh] origin-top bg-black md:h-[13vh]" />
        <div aria-hidden data-film-bar className="pointer-events-none absolute inset-x-0 bottom-0 h-[10vh] origin-bottom bg-black md:h-[13vh]" />
      </div>
    </section>
  );
}
