import { useEffect } from "react";
import type { RefObject } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenisInstance } from "@/lib/lenis";
import { DEFAULT_BOUNDS, setSceneBounds, setScrollProgress } from "@/lib/scrollProgress";
import type { SceneBounds } from "@/lib/scrollProgress";

/**
 * Landing-only scroll bridge: GSAP ticker drives Lenis (autoRaf false),
 * Lenis scroll → ScrollTrigger.update(), one master ScrollTrigger over the
 * scroll stage writes progress into the singleton the 3D scene reads in
 * useFrame — zero React re-renders on scroll.
 *
 * It also measures where each act starts. The stage now runs all the way to
 * the end of "Commande en 3 étapes" (the object morphs cup → capsule →
 * machine → out across it), and the variants zone's height depends on how
 * many products loaded, so the boundaries have to be measured, not guessed.
 */
export function useScrollStage(stageRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const lenis = new Lenis({ autoRaf: false, lerp: 0.11 });
    setLenisInstance(lenis);

    /*
      Lenis smooths the WHEEL; touch scrolling stays native on purpose (a
      synthetic touch scroll fights the browser's own momentum). Native scroll
      events on Android are dispatched off the frame cadence, though, so a
      scene that only reads progress when one arrives renders a value that is
      one or two frames stale — the object visibly trails the finger and then
      catches up in steps.

      The fix for that used to be `ScrollTrigger.update()` on every frame, and
      it was far too big a hammer. That call walks EVERY trigger on the page —
      the master, the variants zone, and one for each of the several dozen
      reveal, parallax and drift tweens — recomputing each one's start, end and
      progress. Sixty times a second, on a phone that is also rendering a WebGL
      scene, that was most of the jank: the object was locked to the finger and
      the page it sat on stuttered underneath it.

      What the SCENE actually needs is one number, and it can be had for one
      property read against geometry that only changes on resize. So the frame
      loop now samples that directly, and the DOM effects go back to updating
      on scroll events like everywhere else on the site — which is exactly what
      they were designed for, and where being a frame late is invisible because
      they are scrubbed and damped anyway.
    */
    const sampleEveryFrame = window.matchMedia("(pointer: coarse)").matches;
    // measured in `measure()` below, read every frame by the sampler
    let stageTop = 0;
    let distance = 0;

    const tick = (time: number) => {
      lenis.raf(time * 1000);
      if (sampleEveryFrame && distance > 0) {
        const raw = (window.scrollY - stageTop) / distance;
        setScrollProgress(raw < 0 ? 0 : raw > 1 ? 1 : raw);
      }
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);

    // progress 0 = stage top at viewport top, progress 1 = stage bottom at
    // viewport bottom, so an act starting O px into the stage begins at
    // O / (stageHeight - viewportHeight).
    const measure = () => {
      distance = stage.offsetHeight - window.innerHeight;
      stageTop = stage.getBoundingClientRect().top + window.scrollY;
      if (distance <= 0) {
        setSceneBounds(DEFAULT_BOUNDS);
        return;
      }
      const at = (act: string, fallback: number): number => {
        const el = stage.querySelector<HTMLElement>(`[data-act="${act}"]`);
        if (!el) return fallback;
        const top = el.getBoundingClientRect().top + window.scrollY;
        return Math.min(1, Math.max(0, (top - stageTop) / distance));
      };
      // The exit act needs somewhere to play out, and the section that gives it
      // that room (ReviewsSection) renders nothing until the store has reviews.
      // Its marker then measures at — or past — the stage's scrollable end, and
      // the dissolve is handed a zero-width span. Keep the last act's share
      // reserved and every act ordered, whatever the DOM ends up measuring.
      const MIN_OUTRO = 0.08;
      const EPSILON = 0.01;
      const outro = Math.min(at("outro", DEFAULT_BOUNDS.outro), 1 - MIN_OUTRO);
      const tail = Math.min(at("tail", DEFAULT_BOUNDS.tail), outro - EPSILON);
      const variants = Math.min(at("variants", DEFAULT_BOUNDS.variants), tail - EPSILON);
      const story = Math.min(at("story", DEFAULT_BOUNDS.story), variants - EPSILON);

      const next: SceneBounds = {
        story,
        variants,
        tail,
        outro,
        viewport: Math.min(0.5, window.innerHeight / distance),
      };
      setSceneBounds(next);
    };

    const master = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setScrollProgress(self.progress),
      onRefresh: measure,
    });
    measure();

    return () => {
      master.kill();
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenisInstance(null);
      setScrollProgress(0);
      setSceneBounds(DEFAULT_BOUNDS);
    };
  }, [stageRef]);
}
