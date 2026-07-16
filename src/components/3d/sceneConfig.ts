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

export function computeSceneState(p: number, dirSign: 1 | -1, colorCount: number): SceneState {
  const side = 1.5 * dirSign;

  // hero → story: drift to the inline-end side while the story text enters
  const toStory = segment(p, HERO_END * 0.75, STORY_END * 0.85);
  // story → variants: swing across to the other side
  const toVariants = segment(p, STORY_END * 0.9, STORY_END + 0.08);
  const variantsP = segment(p, STORY_END, 1);

  const x = lerp(lerp(0, side, easeInOut(toStory)), -side, easeInOut(toVariants));
  const y = lerp(0.08, 0.1, easeInOut(toStory));
  const scale = lerp(lerp(0.95, 0.78, easeInOut(toStory)), 0.92, easeInOut(toVariants));

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
