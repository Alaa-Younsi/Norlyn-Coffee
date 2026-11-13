import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * The gold-dust spray printed on the Moriva box: dense, larger dots massed in
 * one corner thinning out into fine specks. Drawn once as a static SVG (no
 * canvas, no animation loop) so it costs a paint and nothing per frame; a
 * handful of dots twinkle through the `fx-twinkle` keyframe in CSS.
 *
 * Seeded, so the same pattern renders on every visit and on the server-side
 * snapshot — a random spray that rearranges itself on each mount reads as a
 * glitch.
 */

type Corner = "top-start" | "top-end" | "bottom-start" | "bottom-end";

interface GoldDustProps {
  className?: string;
  seed?: number;
  count?: number;
  /** where the spray is densest — logical, so RTL mirrors it */
  corner?: Corner;
}

interface Dot {
  x: number;
  y: number;
  r: number;
  o: number;
  twinkle: boolean;
}

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function GoldDust({ className, seed = 11, count = 220, corner = "bottom-end" }: GoldDustProps) {
  const dots = useMemo<Dot[]>(() => {
    const rand = rng(seed);
    const out: Dot[] = [];
    for (let i = 0; i < count; i++) {
      // distance from the dense corner, biased toward it
      const d = rand() ** 1.6;
      const a = rand() * (Math.PI / 2);
      const x = Math.cos(a) * d * 140;
      const y = Math.sin(a) * d * 100;
      // fine glitter, a little fuller toward the corner — never bokeh blobs
      const r = Math.max(0.12, (1 - d) * 0.75 * (0.35 + rand() * 0.9));
      out.push({ x, y, r, o: 0.25 + (1 - d) * 0.6, twinkle: rand() < 0.12 });
    }
    return out;
  }, [seed, count]);

  // the pattern is authored for the bottom-end corner; the others are flips
  const flip = cn(
    corner.startsWith("top") && "-scale-y-100",
    corner.endsWith("start") ? "-scale-x-100 rtl:scale-x-100" : "rtl:-scale-x-100",
  );

  return (
    <svg
      viewBox="0 0 140 100"
      // meet, anchored to the dense corner: the dots keep their size on a tall
      // phone (slice scaled them into blobs) and the spray stays a corner
      // spray, as printed — the rest of the box is simply clear
      preserveAspectRatio="xMaxYMax meet"
      aria-hidden
      className={cn("pointer-events-none absolute", flip, className)}
    >
      <defs>
        <radialGradient id={`gd-${seed}`} cx="35%" cy="35%" r="65%">
          <stop offset="0" stopColor="#f3dca0" />
          <stop offset="0.55" stopColor="#c99a45" />
          <stop offset="1" stopColor="#7a5016" />
        </radialGradient>
      </defs>
      {dots.map((dot, i) => (
        <circle
          key={i}
          cx={140 - dot.x}
          cy={100 - dot.y}
          r={dot.r}
          fill={`url(#gd-${seed})`}
          opacity={dot.o}
          className={dot.twinkle ? "fx-twinkle" : undefined}
        />
      ))}
    </svg>
  );
}
