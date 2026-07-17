import { clamp, lerp, segment } from "@/lib/utils";

/**
 * Pure mapping from master scroll progress (0..1 across the landing's
 * "scroll stage": hero → story → 4 variant stops) to 3D targets.
 * Kept free of three.js so the choreography is testable and tweakable.
 */

export const HERO_END = 0.16;
export const STORY_END = 0.33;

export interface SceneState {
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
  scale: number;
  /** continuous variant color position: 0..colors-1 */
  colorPos: number;
  /** canvas opacity — fades out as the stage hands off to the DOM sections */
  fade: number;
}

export function computeSceneState(
  p: number,
  dirSign: 1 | -1,
  colorCount: number,
  compact = false,
): SceneState {
  const side = 1.5 * dirSign;

  // hero → story: drift to the inline-end side while the story text enters
  const toStory = segment(p, HERO_END * 0.75, STORY_END * 0.85);
  // story → variants: swing across to the other side
  const toVariants = segment(p, STORY_END * 0.9, STORY_END + 0.08);
  const variantsP = segment(p, STORY_END, 1);

  // compact (phone): no room at the sides — the capsule rises to the top of
  // the viewport and shrinks so the copy stays readable underneath it
  const x = compact
    ? lerp(lerp(0, side * 0.32, easeInOut(toStory)), 0, easeInOut(toVariants))
    : lerp(lerp(0, side, easeInOut(toStory)), -side, easeInOut(toVariants));
  const y = compact
    ? lerp(lerp(0.42, 1.3, easeInOut(toStory)), 1.22, easeInOut(toVariants))
    : lerp(0.02, 0.1, easeInOut(toStory));
  const scale = compact
    ? lerp(lerp(0.4, 0.36, easeInOut(toStory)), 0.46, easeInOut(toVariants))
    : lerp(lerp(0.85, 0.78, easeInOut(toStory)), 0.92, easeInOut(toVariants));

  // one graceful extra turn per phase change + a turn per variant stop
  const rotY = toStory * Math.PI + toVariants * Math.PI + variantsP * Math.PI * (colorCount - 1);
  const rotZ = Math.sin(p * Math.PI * 2) * 0.07;

  const colorPos = clamp(variantsP * colorCount - 0.0001, 0, colorCount - 1);

  const fade = 1 - segment(p, 0.965, 1);

  return { x, y, z: 0, rotY, rotZ, scale, colorPos, fade };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
