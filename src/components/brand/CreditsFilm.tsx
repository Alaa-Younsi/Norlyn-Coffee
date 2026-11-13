import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * A page told as a film's credit sequence, played by the scroll.
 *
 * The section pins one full screen (CSS sticky inside a tall wrapper) and a
 * single GSAP timeline, scrubbed to the scroll, plays every scene in turn:
 *
 *   - the scene's photograph dissolves in full-bleed and slowly pushes in
 *     (a Ken Burns move), then dissolves out into the next;
 *   - its credits ROLL — the block rises through the frame like end credits,
 *     each line arriving on its own beat — and fade at the top;
 *   - cinema letterbox bars frame it all, with the scene number and a running
 *     timecode (HH:MM:SS:FF at 24 fps) in the bottom bar.
 *
 * The first scene is on screen at once (it is the page's title card) and the
 * last one settles in the centre and stays, so its actions can be used.
 * Scenes use `autoAlpha` (opacity + visibility), so a scene that is not on
 * screen is not clickable either.
 *
 * Reduced motion: no pin, no timeline — the same scenes, stacked as plain
 * full-height panels over their pictures.
 */

export interface Credit {
  /** the small line above, set in the gold italic — the "role" */
  role?: string;
  /** the large line — the "name" */
  name: ReactNode;
}

export interface FilmScene {
  id: string;
  /** a managed image slot, or a raw URL (article covers) */
  slot?: string;
  src?: string;
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

const FPS = 24;

function timecode(seconds: number): string {
  const total = Math.max(0, seconds);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = Math.floor(total % 60);
  const ff = Math.floor((total % 1) * FPS);
  return [hh, mm, ss, ff].map((n) => String(n).padStart(2, "0")).join(":");
}

export function CreditsFilm({
  scenes,
  label,
  /** the running length the timecode counts up to, in seconds */
  runtime = 252,
}: {
  scenes: FilmScene[];
  label: string;
  runtime?: number;
}) {
  const { lang } = useLanguage();
  const wrapRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLSpanElement>(null);
  const codeRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const count = scenes.length;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reduced || count === 0) return;

    const ctx = gsap.context(() => {
      const bgs = gsap.utils.toArray<HTMLElement>("[data-film-bg]");
      const blocks = gsap.utils.toArray<HTMLElement>("[data-film-scene]");
      const last = count - 1;

      // everything but the title card starts hidden
      gsap.set(bgs.slice(1), { autoAlpha: 0 });
      gsap.set(blocks.slice(1), { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          onUpdate: (self) => {
            const at = Math.min(last, Math.floor(self.progress * count));
            if (sceneRef.current) sceneRef.current.textContent = String(at + 1).padStart(2, "0");
            if (codeRef.current) codeRef.current.textContent = timecode(self.progress * runtime);
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
          },
        },
      });

      blocks.forEach((block, i) => {
        const bg = bgs[i];
        const lines = block.querySelectorAll<HTMLElement>("[data-film-line]");
        const isFirst = i === 0;
        const isLast = i === last;

        // the picture: dissolve in, push in for the whole scene, dissolve out
        if (bg) {
          if (!isFirst) tl.fromTo(bg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22 }, i);
          tl.fromTo(bg, { scale: 1.16 }, { scale: 1.02, duration: 1 }, i);
          if (!isLast) tl.to(bg, { autoAlpha: 0, duration: 0.22 }, i + 0.86);
        }

        // the credits roll: the block rises through the frame…
        tl.fromTo(
          block,
          { yPercent: isFirst ? 0 : 38 },
          { yPercent: isLast ? 0 : -38, duration: 1 },
          i,
        );
        // …arriving and leaving on a dissolve…
        if (!isFirst) tl.fromTo(block, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 }, i + 0.04);
        if (!isLast) tl.to(block, { autoAlpha: 0, duration: 0.16 }, i + 0.82);
        // …and its lines catch up one after another
        if (!isFirst && lines.length) {
          tl.from(lines, { y: 70, duration: 0.3, stagger: 0.05, ease: "power2.out" }, i + 0.04);
        }
      });
      // a little held time on the end card before the section releases
      tl.to({}, { duration: 0.35 });
    }, wrap);

    return () => ctx.revert();
  }, [reduced, count, runtime, lang]);

  /* ---------------------------------------------------------------- render */
  const sceneContent = (scene: FilmScene) => {
    const creditsBlock = (
      <>
      {scene.credits && (
            <dl
              className={cn(
                "grid gap-9",
                scene.creditsFirst ? "mb-8" : "mt-10",
                scene.credits.length > 2 && "sm:grid-cols-2 sm:gap-x-16",
              )}
            >
              {scene.credits.map((credit, i) => (
                <div key={i} data-film-line>
                  {credit.role && (
                    <dt className="font-display text-lg italic text-gold-hi sm:text-xl">{credit.role}</dt>
                  )}
                  <dd className="mt-1.5 font-display text-2xl leading-snug text-on-shade sm:text-[2rem]">{credit.name}</dd>
                </div>
              ))}
            </dl>
          )}
          </>
    );
    return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-col px-6",
        scene.align === "start" ? "items-start text-start" : "items-center text-center",
      )}
    >
      {scene.creditsFirst ? creditsBlock : null}
      {scene.title && (
        <h2
          data-film-line
          className="font-display text-[2.8rem] leading-[0.98] font-medium tracking-[-0.03em] text-balance sm:text-7xl lg:text-[6.5rem]"
        >
          {scene.title}
        </h2>
      )}
      {scene.body && (
        <div data-film-line className="mt-7 max-w-2xl font-display text-xl leading-[1.6] italic text-on-shade/80 sm:text-2xl">
          {scene.body}
        </div>
      )}
      {scene.creditsFirst ? null : creditsBlock}
      {scene.extra && (
        <div data-film-line className="mt-10">
          {scene.extra}
        </div>
      )}
    </div>
    );
  };

  const picture = (scene: FilmScene, priority: boolean) =>
    scene.slot ? (
      <ImageSlot slot={scene.slot} fill flat rounded="rounded-none" priority={priority} sizes="100vw" />
    ) : scene.src ? (
      <img src={scene.src} alt="" className="h-full w-full object-cover" loading={priority ? "eager" : "lazy"} decoding="async" />
    ) : null;

  if (reduced) {
    return (
      <section aria-label={label} className="bg-shade text-on-shade">
        {scenes.map((scene, i) => (
          <div key={scene.id} className="relative flex min-h-screen items-center overflow-hidden py-24">
            <div className="absolute inset-0">{picture(scene, i === 0)}</div>
            <div className="absolute inset-0 bg-shade" style={{ opacity: scene.dim ?? 0.62 }} aria-hidden />
            <div className="relative w-full">{sceneContent(scene)}</div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section ref={wrapRef} aria-label={label} className="relative" style={{ height: `${count * 100 + 35}vh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-shade text-on-shade">
        {/* pictures */}
        {scenes.map((scene, i) => (
          <div key={scene.id} data-film-bg className="absolute inset-0 will-change-transform">
            {picture(scene, i === 0)}
            <div className="absolute inset-0 bg-shade" style={{ opacity: scene.dim ?? 0.62 }} aria-hidden />
          </div>
        ))}
        {/* vignette + grain, over every picture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(var(--c-shade)/0.85)_100%)]"
        />
        <div aria-hidden className="fx-grain pointer-events-none absolute -inset-1/2 hidden opacity-[0.07] md:block" />

        {/* credits */}
        {scenes.map((scene) => (
          <div key={scene.id} data-film-scene className="absolute inset-0 flex items-center will-change-transform">
            {sceneContent(scene)}
          </div>
        ))}

        {/* letterbox, with the scene counter and the timecode in the lower bar */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[7vh] bg-black" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[7vh] items-center bg-black px-6">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-6 font-mono text-[11px] tracking-[0.25em] text-on-shade/60">
            <span aria-hidden>
              <span className="text-gold-hi">SC</span> <span ref={sceneRef}>01</span> / {String(count).padStart(2, "0")}
            </span>
            <span aria-hidden className="relative h-px flex-1 bg-on-shade/15">
              <span ref={barRef} className="absolute inset-0 origin-left scale-x-0 bg-gold-hi/70 rtl:origin-right" />
            </span>
            <span aria-hidden ref={codeRef} dir="ltr">
              00:00:00:00
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
