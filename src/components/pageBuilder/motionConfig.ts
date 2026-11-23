import type { Variants } from "framer-motion";
import type { Anim, Speed } from "@/lib/pageBuilder/types";

export const EASE = [0.22, 1, 0.36, 1] as const;

export function duration(speed: Speed): number {
  return speed === "calm" ? 1.1 : speed === "snappy" ? 0.45 : 0.75;
}

export function variantsFor(anim: Anim, dir: "ltr" | "rtl", speed: Speed, delay = 0): Variants {
  const d = duration(speed);
  const side = dir === "rtl" ? -1 : 1;
  const shown = { opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0, filter: "blur(0px)", clipPath: "inset(0% 0% 0% 0%)" };
  const hidden: Record<Anim, Record<string, number | string>> = {
    none: {},
    fade: { opacity: 0 },
    "fade-up": { opacity: 0, y: 44 },
    "slide-start": { opacity: 0, x: -70 * side },
    "slide-end": { opacity: 0, x: 70 * side },
    zoom: { opacity: 0, scale: 0.86 },
    blur: { opacity: 0, filter: "blur(16px)", scale: 1.04 },
    clip: { clipPath: "inset(0% 0% 100% 0%)" },
    tilt: { opacity: 0, rotateX: 22, y: 40 },
    flip: { opacity: 0, rotateY: -40 * side },
    rise: { opacity: 0, y: 110, scale: 0.94 },
  };
  if (anim === "none") return { hidden: {}, shown: {} };
  return {
    hidden: hidden[anim],
    shown: { ...shown, transition: { duration: d, delay, ease: EASE } },
  };
}

