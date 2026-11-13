import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Content that rises out of a blur the first time it scrolls into view.
 * Framer drives it from an IntersectionObserver, so "the trigger mis-measured
 * and the block is stuck invisible" is not a state it can reach; `once`, so
 * after it has played it is plain DOM again. Pass `index` to stagger siblings.
 */
export function Reveal({
  children,
  className,
  index = 0,
  y = 36,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  y?: number;
  as?: "div" | "li" | "p" | "section" | "article";
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay: index * 0.08, ease: EASE }}
    >
      {children}
    </Component>
  );
}
