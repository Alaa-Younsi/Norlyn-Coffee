import { useEffect } from "react";
import type { RefObject } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenisInstance } from "@/lib/lenis";
import { setScrollProgress } from "@/lib/scrollProgress";

/**
 * Landing-only scroll bridge: GSAP ticker drives Lenis (autoRaf false),
 * Lenis scroll → ScrollTrigger.update(), one master ScrollTrigger over the
 * scroll stage writes progress into the singleton the 3D scene reads in
 * useFrame — zero React re-renders on scroll.
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

    const master = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setScrollProgress(self.progress),
    });

    return () => {
      master.kill();
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenisInstance(null);
      setScrollProgress(0);
    };
  }, [stageRef]);
}
