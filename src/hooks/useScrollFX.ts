import { useEffect } from "react";
import type { RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenisInstance } from "@/lib/lenis";
import { clamp } from "@/lib/utils";

/**
 * Scroll-linked motion for the DOM sections, so the page reacts to the same
 * gesture that drives the 3D object instead of sitting still behind it.
 *
 * Deliberately transform-only — opacity is never animated on content here.
 * If these effects ever fail to run, the elements stay laid out and readable
 * at their `from` state rather than stuck invisible.
 */

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Cards marked `data-reveal` rise, un-tilt and settle as they scroll into
 * view, scrubbed to the scroll position and staggered by their column so a
 * grid deals itself out rather than snapping in as a block.
 */
export function useRevealOnScroll(ref: RefObject<HTMLElement | null>, deps: unknown[] = []): void {
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (items.length === 0) return;

    const tweens = items.map((el, i) =>
      gsap.fromTo(
        el,
        { y: 56, rotateX: -9, scale: 0.965 },
        {
          y: 0,
          rotateX: 0,
          scale: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: `top ${92 + (i % 4) * 2}%`,
            end: "top 58%",
            scrub: 0.6,
          },
        },
      ),
    );

    return () => {
      tweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);
}

/**
 * Drifts an element against the scroll — used on section headers and decor so
 * they separate in depth from the 3D object passing behind them.
 * `strength` is in pixels of total travel across the element's pass.
 */
export function useParallax(ref: RefObject<HTMLElement | null>, strength = 60): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const tween = gsap.fromTo(
      el,
      { y: strength * 0.5 },
      {
        y: -strength * 0.5,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [ref, strength]);
}

/**
 * Children marked `data-parallax="<px>"` each drift at their own speed while
 * the container passes through the viewport — adjacent tiles separating in
 * depth is what makes a flat grid read as layered. Negative values drift
 * against the scroll.
 */
export function useParallaxItems(ref: RefObject<HTMLElement | null>, deps: unknown[] = []): void {
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    if (items.length === 0) return;

    const tweens = items.map((el) => {
      const strength = Number(el.dataset.parallax) || 40;
      return gsap.fromTo(
        el,
        { y: strength * 0.5 },
        {
          y: -strength * 0.5,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });

    return () => {
      tweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);
}

/**
 * Slides a copy block in laterally from the side the 3D object just left,
 * scrubbed to its entrance — the content and the object mirror each other
 * around the centreline instead of ignoring one another. `from` is a logical
 * side ("start"/"end") so RTL flips automatically.
 */
export function useDriftIn(
  ref: RefObject<HTMLElement | null>,
  from: "start" | "end" = "start",
  distance = 80,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const rtl = getComputedStyle(el).direction === "rtl";
    const sign = (from === "start" ? -1 : 1) * (rtl ? -1 : 1);

    const tween = gsap.fromTo(
      el,
      { x: sign * distance },
      {
        x: 0,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", end: "top 52%", scrub: 0.7 },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [ref, from, distance]);
}

/**
 * Shears an element with the live scroll velocity — fast flicks bend the
 * grid a few degrees and it relaxes as the scroll settles, which makes the
 * page feel like it has mass. Reads Lenis's smoothed velocity on the GSAP
 * ticker; no-ops quietly when Lenis isn't running (non-landing pages).
 */
export function useVelocitySkew(ref: RefObject<HTMLElement | null>, maxDeg = 2.4): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const setSkew = gsap.quickSetter(el, "skewY", "deg");
    let current = 0;
    const tick = () => {
      const velocity = getLenisInstance()?.velocity ?? 0;
      const target = clamp(velocity * 0.06, -maxDeg, maxDeg);
      current += (target - current) * 0.12;
      // snap the last fraction of a degree so it settles at exactly 0
      if (Math.abs(current) < 0.02 && Math.abs(target) < 0.02) current = 0;
      setSkew(current);
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      gsap.set(el, { skewY: 0 });
    };
  }, [ref, maxDeg]);
}

/** Re-measure after async content changes the page height. */
export function refreshScrollFX(): void {
  ScrollTrigger.refresh();
}
