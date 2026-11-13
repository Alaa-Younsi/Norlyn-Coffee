import { useEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "@/lib/gsap";

/**
 * The element leans toward the cursor while it's near, and springs back when
 * it leaves — a "magnetic" CTA. Writes only x/y through GSAP, so put it on a
 * WRAPPER and keep any hover transform on the child (one owner per transform).
 * Pointer-fine devices only; reduced motion opts out.
 */
export function useMagnetic(ref: RefObject<HTMLElement | null>, strength = 0.35): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      xTo((e.clientX - (rect.left + rect.width / 2)) * strength);
      yTo((e.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [ref, strength]);
}
