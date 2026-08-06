import { create } from "zustand";
import type { MascotEmotion } from "@/lib/mascot";

/**
 * The mascot's reaction channel.
 *
 * `<ScrollMascot>` normally wears whatever face the section you are reading
 * asked for. This store lets anything on the page interrupt that for a moment —
 * the cup looks up when you add a capsule to the cart, blinks when you flip the
 * theme, winces when a form rejects you — and then goes back to reading along
 * with you.
 *
 * It is one store rather than a prop chain because the callers (a cart action,
 * a theme toggle, a checkout error) are nowhere near the mascot in the tree, and
 * a mascot that only reacts to its own subtree is just a picture.
 *
 * Reactions are deliberately short and deliberately rare. A cup that pops on
 * every click stops being a character and becomes a notification.
 */

const REACTION_MS = 2200;

interface MascotState {
  reaction: MascotEmotion | null;
  /** shows `emotion` for a beat, then hands the face back to the page */
  react: (emotion: MascotEmotion) => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;

export const useMascotStore = create<MascotState>()((set) => ({
  reaction: null,
  react: (emotion) => {
    // a second reaction restarts the clock instead of stacking timers, so two
    // quick adds to the cart read as one continuous glance, not a stutter
    if (timer) clearTimeout(timer);
    set({ reaction: emotion });
    timer = setTimeout(() => {
      timer = undefined;
      set({ reaction: null });
    }, REACTION_MS);
  },
}));

/**
 * Fire a reaction from outside React — stores, event handlers, anywhere. The
 * mascot is decoration, so this is intentionally fire-and-forget: nothing that
 * calls it should ever care whether a mascot is currently mounted.
 */
export function reactMascot(emotion: MascotEmotion): void {
  useMascotStore.getState().react(emotion);
}
