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
 * Children marked `data-fade` rise and fade in once, as they first come into
 * view — the site's general-purpose entrance, for headings, paragraphs and
 * anything that is not a card in a grid.
 *
 * This is the ONE place opacity is animated on content, and it is only safe
 * because of `immediateRender: false`. Every other effect in this file is a
 * scrubbed `fromTo`, which applies its from-state the moment it is created —
 * fine for a transform (worst case a card sits 56px low) and unacceptable for
 * opacity, because a trigger that mis-measures would leave real copy at zero
 * and the page would ship with holes in it. Deferring the from-state means the
 * element renders completely normally until its tween actually starts, so a
 * trigger that never fires costs the animation and nothing else.
 *
 * `once` for the same reason: after it has played, the tween is done and the
 * content is plain visible DOM again, with no state left to get stuck in.
 */
export function useFadeUp(ref: RefObject<HTMLElement | null>, deps: unknown[] = []): void {
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-fade]"));
    if (items.length === 0) return;

    const tweens = items.map((el) =>
      gsap.fromTo(
        el,
        { opacity: 0, y: Number(el.dataset.fade) || 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: "power2.out",
          immediateRender: false,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      ),
    );

    return () => {
      tweens.forEach((tween) => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
      // whatever state the tweens were mid-way through, the content ends up
      // visible — this hook must never be the reason something isn't on screen
      gsap.set(items, { clearProps: "opacity,transform" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);
}

/**
 * Cards marked `data-tilt` lean toward the cursor — the site's 3D hover.
 *
 * It writes ONLY `rotationX`/`rotationY`, which is what lets it share an
 * element with the parallax and reveal tweens above: those drive `y`, and GSAP
 * composes the two into one matrix without either clobbering the other. Put it
 * on an element that already carries `data-reveal` and it will fight that
 * tween's own `rotateX` — the wrapper is the place for it.
 *
 * Pointer-fine only. A tilt keyed to cursor position has no meaning on a
 * touchscreen, where the finger is on the card it is supposedly tilting.
 */
export function useTiltCards(ref: RefObject<HTMLElement | null>, deps: unknown[] = []): void {
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-tilt]"));
    if (cards.length === 0) return;

    const cleanups = cards.map((card) => {
      const strength = Number(card.dataset.tilt) || 7;
      gsap.set(card, { transformPerspective: 900, transformOrigin: "center" });
      const rotateX = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
      const rotateY = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });

      // measured once per hover, not per move: a getBoundingClientRect on every
      // pointermove is a forced layout on a page that is also scrolling
      let box: DOMRect | null = null;
      const onEnter = () => (box = card.getBoundingClientRect());
      const onMove = (event: PointerEvent) => {
        if (!box) box = card.getBoundingClientRect();
        const px = (event.clientX - box.left) / box.width - 0.5;
        const py = (event.clientY - box.top) / box.height - 0.5;
        rotateX(-py * strength);
        rotateY(px * strength * 1.2);
      };
      const onLeave = () => {
        box = null;
        rotateX(0);
        rotateY(0);
      };

      card.addEventListener("pointerenter", onEnter);
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      return () => {
        card.removeEventListener("pointerenter", onEnter);
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
        gsap.set(card, { rotationX: 0, rotationY: 0 });
      };
    });

    return () => cleanups.forEach((off) => off());
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
 *
 * Phones sit this out, and not to save frames. The effect works by making
 * neighbours disagree: you read the depth because the tile beside this one is
 * somewhere else. Collapse that grid to one column — which every grid on this
 * site does under 768px — and there is no neighbour left to disagree with, so
 * the same tween stops reading as depth and starts reading as items that
 * failed to line up. Which is exactly what it looked like.
 */
export function useParallaxItems(ref: RefObject<HTMLElement | null>, deps: unknown[] = []): void {
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;

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
    // Touch scrolling never goes through Lenis (see useScrollStage), so its
    // velocity is a flat 0 on a phone and this whole loop shears the grid by
    // exactly nothing — while still costing a ticker callback and a transform
    // write every frame, on the device that can least afford one.
    if (!window.matchMedia("(pointer: fine)").matches) return;

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
