/**
 * The Norlyn cup — the brand's mascot.
 *
 * The client's artwork is nine drawings of the SAME cup: identical body,
 * identical handle, identical steam, only the face changes. That is what makes
 * an animation possible instead of a sticker set — cross-dissolving two frames
 * reads as one character changing expression, because everything except the
 * face is pixel-identical between them.
 *
 * Frame files come from scripts/optimize-images.mjs (MASCOT map). Renaming an
 * emotion here means renaming it there.
 */

export const MASCOT_EMOTIONS = [
  "happy",
  "calm",
  "excited",
  "wink",
  "love",
  "sleepy",
  "surprised",
  "determined",
  "playful",
] as const;

export type MascotEmotion = (typeof MASCOT_EMOTIONS)[number];

/**
 * `md` (240px) covers every in-page use at 2× — the mascot is never rendered
 * above ~120 CSS px there. `lg` (440px) is for the few hero-scale placements.
 */
export function mascotFrame(emotion: MascotEmotion, size: "md" | "lg" = "md"): string {
  return `/images/mascot/${emotion}-${size}.webp`;
}

export function isMascotEmotion(value: string | undefined): value is MascotEmotion {
  return !!value && (MASCOT_EMOTIONS as readonly string[]).includes(value);
}

/**
 * The landing's reaction track, in scroll order. Sections opt in by tagging
 * themselves `data-mascot="<emotion>"`; this list only tells <ScrollMascot>
 * which frames to preload so a swap never flashes an empty box.
 *
 * The arc is deliberate — curious on the story, thrilled at the collection,
 * smitten by the ritual, resolute on the delivery promise. A mascot that wore
 * the same grin throughout would be wallpaper.
 */
export const LANDING_PALETTE: MascotEmotion[] = ["calm", "excited", "love", "determined"];

/**
 * The faces the cup can pull in answer to something you DID, as opposed to
 * something you scrolled past. Every <ScrollMascot> preloads these on top of
 * its own palette, so a reaction never waits on a download — the whole point
 * of a reaction is that it lands at the same moment as the click.
 *
 * Kept short on purpose: the fewer faces a reaction can wear, the more each
 * one means. See `src/store/mascot.ts` for who fires them.
 */
export const REACTION_PALETTE: MascotEmotion[] = ["excited", "surprised", "wink", "playful"];

/** La Maison walks the same character through the manufacturing claims. */
export const ABOUT_PALETTE: MascotEmotion[] = [
  "happy",
  "determined",
  "surprised",
  "love",
  "playful",
];
