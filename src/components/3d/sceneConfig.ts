import { clamp, lerp, segment } from "@/lib/utils";
import type { SceneBounds } from "@/lib/scrollProgress";

/**
 * Pure mapping from master scroll progress (0..1 across the landing's scroll
 * stage) to 3D targets. Kept free of three.js so the choreography is testable
 * and tweakable.
 *
 * The hero object tells a four-act story as you scroll, always parked on the
 * side OPPOSITE the copy so it mirrors the content instead of covering it:
 *   1. hero               — a porcelain espresso cup, centre stage
 *   2. "La maison Norlyn" — copy on the start side, cup on the end side,
 *                            where it transforms into the Moriva capsule
 *   3. variants           — copy on the end side; the capsule swoops UNDER
 *                            the incoming heading to the start side, cycles
 *                            through the variant colors, then becomes the
 *                            espresso machine ON CAMERA at the last stop and
 *                            starts brewing
 *   4. featured/gallery   — the machine swoops under the featured header and
 *                            settles low on the end side behind the cards
 *   5. "Commande en 3 étapes" — the machine dissolves away
 *
 * Morphs are staggered cross-dissolves, not 50/50 ghost overlaps: the
 * outgoing form implodes and is fully gone by ~55% of the morph, a burst of
 * beans/dust/vortex masks the middle, and the incoming form blooms out over
 * the back half — so at no point do two half-transparent shapes stack.
 */

/** Fraction of the story act spent morphing the cup into the capsule. */
const CUP_MORPH = [0.16, 0.68] as const;
/**
 * The capsule→machine morph plays out on the PINNED variants screen during
 * its last stop, while the object is parked on the empty start side — fully
 * on camera, with the last variant's copy beside it, and it starts brewing
 * the moment it forms. (Fractions of the pinned span: the last variant's
 * copy arrives at 1 − 1/colorCount.) Morphing during the transit to the
 * tail — the old timing — hid the payoff below the fold.
 */
const MACHINE_MORPH = [0.8, 0.99] as const;
/** Fraction of the outro act spent dissolving the machine. */
const EXIT_MORPH = [0.04, 0.5] as const;

/**
 * Per-act scale on phones. Deliberately close to the desktop numbers: the
 * object is the page's centrepiece and the old compact values (0.44 at the
 * hero) drew it at barely a third of the screen width, which read as a thumbnail
 * floating in the copy rather than as the product. The camera is unchanged, so
 * one world unit is always viewportHeight / 3.78 — at 0.66 the saucer spans
 * about 70% of a phone's width.
 */
const COMPACT_SCALE = [0.66, 0.58, 0.5, 0.48, 0.35];

/**
 * The cup+saucer's midpoint in model space, below the group origin (the model
 * runs from the saucer's foot at −0.72 to the lip at +0.21). Centring the
 * GROUP is not centring the cup; this is the difference.
 */
const CUP_CENTROID = -0.2565;

export interface SceneState {
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
  scale: number;
  /** squash-and-stretch on Y, applied on top of scale during a morph */
  stretch: number;
  /** continuous variant color position: 0..colors-1 */
  colorPos: number;
  /** canvas opacity — a final safety fade at the very end of the stage */
  fade: number;
  /** per-model visibility, 0..1; the fades are staggered so they never stack */
  cupWeight: number;
  capsuleWeight: number;
  machineWeight: number;
  /** 0..1 bell peaking mid-morph — drives the burst FX and the spin-up */
  energy: number;
  /** how far the machine's pour has progressed, 0..1 */
  pour: number;
  /**
   * How freely the object turns on its own. A capsule looks good from every
   * angle so it spins; a machine has a front, and showing its back reads as a
   * bug — so this falls to 0 for the machine act.
   */
  spin: number;
  /** base X tilt — looking into the cup, level with the machine */
  tilt: number;
}

export function computeSceneState(
  p: number,
  dirSign: 1 | -1,
  colorCount: number,
  bounds: SceneBounds,
  compact = false,
): SceneState {
  const side = 1.5 * dirSign;

  // per-act local progress
  const storyP = segment(p, bounds.story, bounds.variants);
  const tailP = segment(p, bounds.tail, bounds.outro);
  const outroP = segment(p, bounds.outro, 1);

  // The variants zone's sticky screen unpins one viewport before the zone's
  // bottom — everything that must happen ON that pinned screen (the color
  // cycling, the machine morph) is driven by the pinned span, which is also
  // exactly what the section's own ScrollTrigger uses to switch the copy.
  const pinEnd = Math.max(bounds.variants + 0.001, bounds.tail - bounds.viewport);
  const pinnedP = segment(p, bounds.variants, pinEnd);

  // ── morph weights ────────────────────────────────────────────────────────
  // raw 0..1 morph progress, then per-side easings: the outgoing form is gone
  // by 55%, the incoming one only starts at 45% — minimal ghost overlap, and
  // the energy burst covers the handover.
  const m1 = segment(storyP, CUP_MORPH[0], CUP_MORPH[1]);
  const m2 = segment(pinnedP, MACHINE_MORPH[0], MACHINE_MORPH[1]);
  const m3 = segment(outroP, EXIT_MORPH[0], EXIT_MORPH[1]);

  const fadeOut = (m: number) => 1 - easeInOut(segment(m, 0, 0.55));
  const fadeIn = (m: number) => easeInOut(segment(m, 0.45, 1));

  const cupWeight = fadeOut(m1);
  const capsuleWeight = fadeIn(m1) * fadeOut(m2);
  // The machine forms at full strength, then settles into a background
  // presence once the product cards arrive: at 1440px there is no clear
  // gutter beside a max-w-7xl grid, so it deliberately brews behind the
  // frosted panels rather than competing with them.
  const presence = lerp(1, 0.5, easeInOut(segment(tailP, 0.18, 0.5)));
  // how fully the machine exists before that background fade — the pose
  // (spin, tilt, pour) follows this, not the visual weight
  const machineFormed = fadeIn(m2) * fadeOut(m3);
  const machineWeight = machineFormed * presence;
  const energy = Math.max(bell(m1), bell(m2), bell(m3));

  // ── placement ────────────────────────────────────────────────────────────
  // Every move completes BEFORE the copy it mirrors is being read:
  //  - the cup slides to the end side while the story section scrolls in,
  //  - the capsule crosses to the start side while the variants zone arrives,
  //    swooping down UNDER the incoming heading (bell dip),
  //  - the formed machine swoops under the featured header to its low
  //    end-side spot behind the frosted cards.
  const approach = segment(p, bounds.story * 0.45, bounds.story);
  const crossStep = segment(
    p,
    lerp(bounds.story, bounds.variants, 0.5),
    lerp(bounds.variants, bounds.tail, 0.01),
  );
  const crossArc = bell(easeInOut(crossStep));
  // leaves while the unpinned variants screen scrolls out, arrives just after
  // the featured section settles — never lingering over its header
  const transitStep = segment(p, lerp(pinEnd, bounds.tail, 0.5), lerp(bounds.tail, bounds.outro, 0.16));
  const transitArc = bell(easeInOut(transitStep));

  // compact (phone): no room at the sides — the object stays centred-ish and
  // rides the top of the viewport so the copy underneath stays readable
  const x = compact
    ? track([0, side * 0.14, side * -0.1, side * 0.08, side * 0.08], [approach, crossStep, transitStep, outroP])
    : track([0, side * 1.02, -side, side * 1.12, side * 1.02], [approach, crossStep, transitStep, outroP]);

  const yBase = compact
    ? // The hero value is not a taste call: the canvas is fixed, so world y = 0
      // is the exact centre of the viewport, and the cup's own centre of mass
      // sits CUP_CENTROID below its origin. Cancelling that offset is what puts
      // the cup in the middle of the phone screen rather than a little above
      // it. The story value drops it clear of the stat cards instead of leaving
      // it half-buried behind them, and the last three ride the top band the
      // variants and featured sections reserve on mobile.
      track(
        [0.02 - CUP_CENTROID * COMPACT_SCALE[0], -0.95, 1.25, 0.95, 1.5],
        [approach, crossStep, transitStep, outroP],
      )
    : // ends low enough in the tail act that its base and drip tray clear the
      // bottom of the tall gallery tiles — the machine reads as standing under
      // the section rather than as a smudge hidden entirely behind glass
      track([0.05, 0.08, 0.02, -1.02, 0.28], [approach, crossStep, transitStep, outroP]);
  const y = yBase - crossArc * (compact ? 0.3 : 0.85) - transitArc * (compact ? 0.15 : 0.5);

  const baseScale = compact
    ? track(COMPACT_SCALE, [approach, crossStep, transitStep, outroP])
    : track([0.72, 0.82, 0.9, 0.58, 0.44], [approach, crossStep, transitStep, outroP]);

  // The three models are not the same size: the machine stands roughly 1.7×
  // the capsule's height. Desktop parks it in a side gutter where that reads as
  // presence, but a phone has no gutter — at the act scale that framed the
  // capsule the machine lands on the section heading. Shrink it as it forms,
  // on phones only.
  const machineFit = compact ? lerp(1, 0.62, machineFormed) : 1;

  // a morph pinches the object in slightly, then it springs back out; the
  // crossing also shrinks it mid-flight so the swoop reads as depth
  const scale = baseScale * machineFit * (1 - energy * 0.16) * (1 - crossArc * 0.22);
  const stretch = 1 + energy * 0.3;

  // one graceful turn per act, a barrel roll through the crossing, a turn per
  // variant stop, and a fast spin-up through each morph that sells the
  // transformation.
  const rotYRaw =
    storyP * Math.PI +
    easeInOut(crossStep) * Math.PI +
    pinnedP * Math.PI * Math.max(1, colorCount - 1) +
    (easeInOut(m1) + easeInOut(m2) + easeInOut(m3)) * Math.PI * 2;
  // The accumulated turns can leave the machine settling with its back to the
  // camera (an odd multiple of π, depending on the variant count) — ease in a
  // constant correction as it forms so it always lands facing front.
  const TAU = Math.PI * 2;
  const formedTurns = Math.PI * (6 + Math.max(1, colorCount - 1));
  const faceCorrection = Math.round(formedTurns / TAU) * TAU - formedTurns;
  const rotY = rotYRaw + faceCorrection * machineFormed;
  // banks into the turn while crossing, like something flown rather than slid
  const rotZ =
    Math.sin(p * Math.PI * 2) * 0.06 + energy * 0.12 * dirSign - crossArc * 0.32 * dirSign;

  const spin = 1 - machineFormed;
  // +0.3 leans a cup/capsule's top toward the camera; the machine wants to be
  // read straight on, so the tilt flattens out as it forms
  const tilt = lerp(0.3, 0.05, machineFormed);

  // same normalization as the section's own trigger, so the capsule recolors
  // exactly when the copy switches
  const colorPos = clamp(pinnedP * colorCount - 0.0001, 0, colorCount - 1);

  // the machine starts pouring as soon as it has formed — still parked on the
  // sticky variants screen, so the brew happens in full view
  const pour = clamp(segment(m2, 0.75, 1) * (1 - easeInOut(segment(m3, 0, 0.4))), 0, 1);

  const fade = 1 - segment(p, 0.995, 1);

  return {
    x,
    y,
    z: 0,
    rotY,
    rotZ,
    scale,
    stretch,
    colorPos,
    fade,
    cupWeight,
    capsuleWeight,
    machineWeight,
    energy,
    pour,
    spin,
    tilt,
  };
}

/**
 * Walks per-act keyframe values, each step driven by its own local progress,
 * so a value only travels toward the next keyframe once that move is under
 * way — a plain lerp over global progress would drift during long acts.
 * `steps[i]` advances `stops[i]` → `stops[i + 1]`.
 */
function track(stops: number[], steps: number[]): number {
  let value = stops[0];
  for (let i = 0; i < steps.length; i++) {
    value = lerp(value, stops[i + 1] ?? value, easeInOut(steps[i]));
  }
  return value;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** 0 at the edges of a morph, 1 at its midpoint. */
function bell(t: number): number {
  return Math.sin(clamp(t, 0, 1) * Math.PI);
}
