import { useMemo } from "react";
import { motion } from "framer-motion";

/** the same seeded burst every time — pure, so it can live outside render */
function burst(count: number) {
  let seed = 31;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.5;
    const power = 160 + rand() * 220;
    return {
      x: Math.cos(angle) * power,
      y: Math.sin(angle) * power,
      fall: 260 + rand() * 260,
      spin: (rand() - 0.5) * 900,
      size: 10 + rand() * 12,
      delay: rand() * 0.15,
      tone: rand() > 0.5 ? "#5a3219" : "#3a1f0f",
    };
  });
}

/**
 * A one-shot burst of roasted beans out of a point — the order confirmation's
 * celebration. Each bean flies out on its own arc, tumbling, then falls away;
 * seeded so it is the same burst every time. Decoration only (aria-hidden),
 * and absent under reduced motion.
 */
export function BeanConfetti({ count = 22 }: { count?: number }) {
  const beans = useMemo(() => burst(count), [count]);

  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }

  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0">
      {beans.map((bean, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 12 16"
          className="absolute -ml-2 -mt-2"
          style={{ width: bean.size, height: bean.size * 1.33 }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.4 }}
          animate={{
            x: [0, bean.x, bean.x * 1.15],
            y: [0, bean.y, bean.y + bean.fall],
            rotate: [0, bean.spin * 0.6, bean.spin],
            scale: [0.4, 1, 0.9],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 2.2, delay: 0.35 + bean.delay, ease: [0.2, 0.7, 0.3, 1], times: [0, 0.4, 1] }}
        >
          <ellipse cx="6" cy="8" rx="5.6" ry="7.6" fill={bean.tone} />
          <path d="M6 1.2c-1.6 2.4 1.6 5 0 6.8s-1.6 4.6 0 6.8" fill="none" stroke="#c99a45" strokeWidth="1" strokeLinecap="round" />
        </motion.svg>
      ))}
    </div>
  );
}
