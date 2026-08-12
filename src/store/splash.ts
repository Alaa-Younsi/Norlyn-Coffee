import { create } from "zustand";
import { useEffect } from "react";

/**
 * The curtain over the site while it gets itself ready.
 *
 * The landing page is not a document — it is a scroll-driven choreography that
 * measures the DOM once and then plays back against those measurements. Three
 * things have to be true before that measurement is worth taking:
 *
 *   1. the webfont has swapped in (Fraunces changes every line box on the page,
 *      and a ScrollTrigger measured against Georgia is measuring a layout that
 *      is about to stop existing),
 *   2. the catalogue has landed (the variants zone's height is a function of
 *      how many products came back, and every act boundary below it moves with
 *      it), and
 *   3. the WebGL canvas has drawn its first frame (three.js is a ~240 kB
 *      chunk, and until it paints, the hero's middle column is an empty hole).
 *
 * Without a curtain the visitor watches all three happen. With one they see a
 * mark, and then a finished page — which is the actual promise being made here:
 * when the splash lifts, the animation is primed and the scroll is honest.
 *
 * This store is only the bookkeeping. `<SplashScreen>` owns the timing rules
 * (a minimum so it never flashes, a maximum so it can never trap anyone) and
 * the pixels.
 */

interface SplashState {
  /** the curtain is up and the page behind it is not to be scrolled */
  open: boolean;
  /**
   * Keys that still have work to finish. The curtain may only come down when
   * this is empty — a set rather than a boolean because the holds are
   * registered by components that know nothing about each other.
   */
  holds: readonly string[];
  /** raise the curtain again — a fresh entry to the landing */
  arm: () => void;
  hold: (key: string) => void;
  release: (key: string) => void;
  /** curtain down; nothing may raise it again except `arm` */
  lift: () => void;
}

export const useSplashStore = create<SplashState>()((set) => ({
  open: true,
  holds: [],
  arm: () => set({ open: true }),
  hold: (key) =>
    set((state) => (state.holds.includes(key) ? state : { holds: [...state.holds, key] })),
  release: (key) =>
    set((state) =>
      state.holds.includes(key) ? { holds: state.holds.filter((k) => k !== key) } : state,
    ),
  lift: () => set({ open: false, holds: [] }),
}));

/**
 * Hold the curtain for as long as `pending` is true, and always let go on
 * unmount.
 *
 * Deliberately order-independent: the hold is registered from the holder's own
 * render rather than handed to it, so it cannot matter whether the thing being
 * waited for became ready before or after the splash decided to wait for it.
 * A component that mounts already-ready simply never holds.
 */
export function useSplashHold(key: string, pending: boolean): void {
  useEffect(() => {
    const { hold, release } = useSplashStore.getState();
    if (pending) hold(key);
    else release(key);
    return () => useSplashStore.getState().release(key);
  }, [key, pending]);
}
