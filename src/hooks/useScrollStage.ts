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

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);

    // progress 0 = stage top at viewport top, progress 1 = stage bottom at
    // viewport bottom, so an act starting O px into the stage begins at
    // O / (stageHeight - viewportHeight).
    const measure = () => {
      const distance = stage.offsetHeight - window.innerHeight;
      if (distance <= 0) {
        setSceneBounds(DEFAULT_BOUNDS);
        return;
      }
      const stageTop = stage.getBoundingClientRect().top + window.scrollY;
      const at = (act: string, fallback: number): number => {
        const el = stage.querySelector<HTMLElement>(`[data-act="${act}"]`);
        if (!el) return fallback;
        const top = el.getBoundingClientRect().top + window.scrollY;
        return Math.min(1, Math.max(0, (top - stageTop) / distance));
      };
      const next: SceneBounds = {
        story: at("story", DEFAULT_BOUNDS.story),
        variants: at("variants", DEFAULT_BOUNDS.variants),
        tail: at("tail", DEFAULT_BOUNDS.tail),
        outro: at("outro", DEFAULT_BOUNDS.outro),
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
