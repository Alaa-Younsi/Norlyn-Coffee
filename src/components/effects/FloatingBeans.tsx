import { useMemo } from "react";
import type { CSSProperties } from "react";
import { CoffeeBeanIcon } from "./CoffeeBeanIcon";
import { cn } from "@/lib/utils";

/**
 * Decorative scatter of gently drifting coffee beans, covering the nearest
 * positioned ancestor. Deterministic layout per seed (no hydration jitter),
 * transform-only animation, pointer-events-none.
 */

interface FloatingBeansProps {
  count?: number;
  /** change the seed to get a different arrangement per section */
  seed?: number;
  className?: string;
}

export function FloatingBeans({ count = 8, seed = 1, className }: FloatingBeansProps) {
  const beans = useMemo(() => {
    const rng = mulberry32(seed * 97 + 13);
    return Array.from({ length: count }, () => ({
      x: 3 + rng() * 94,
      y: 4 + rng() * 90,
      size: 10 + rng() * 18,
      rot: rng() * 360,
      dur: 5 + rng() * 5,
      delay: rng() * 4,
      opacity: 0.07 + rng() * 0.14,
    }));
  }, [count, seed]);

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {beans.map((bean, i) => (
        <CoffeeBeanIcon
          key={i}
          className="fx-float absolute text-brand"
          style={
            {
              insetInlineStart: `${bean.x}%`,
              top: `${bean.y}%`,
              width: bean.size,
              height: bean.size * (64 / 48),
              opacity: bean.opacity,
              "--drift-rot": `${bean.rot}deg`,
              "--drift-dur": `${bean.dur}s`,
              animationDelay: `${bean.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
