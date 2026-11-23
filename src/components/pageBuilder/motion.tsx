import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { duration, variantsFor } from "./motionConfig";
import type { ReactNode } from "react";
import type { Anim, Speed } from "@/lib/pageBuilder/types";
import { cn } from "@/lib/utils";

/**
 * Entrance vocabulary for the page builder. Framer `whileInView` (not GSAP):
 * these pages are isolated from the landing's ScrollTrigger choreography, and
 * a block that is already on screen when it mounts simply plays at once.
 */

interface RevealProps {
  anim: Anim;
  dir: "ltr" | "rtl";
  speed: Speed;
  delay?: number;
  /** children that are <RevealItem> enter one after another */
  stagger?: boolean;
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "li";
}

export function Reveal({ anim, dir, speed, delay = 0, stagger, className, children }: RevealProps) {
  const reduced = useReducedMotion();
  if (reduced || anim === "none") return <div className={className}>{children}</div>;
  const v = variantsFor(anim, dir, speed, delay);
  const variants: Variants = stagger
    ? {
        hidden: {},
        shown: { transition: { staggerChildren: duration(speed) * 0.14, delayChildren: delay } },
      }
    : v;
  return (
    <motion.div
      className={cn("[transform-style:preserve-3d] [perspective:1100px]", className)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

/** A child of a staggered <Reveal>: inherits hidden/shown from the parent. */
export function RevealItem({
  anim,
  dir,
  speed,
  className,
  children,
}: {
  anim: Anim;
  dir: "ltr" | "rtl";
  speed: Speed;
  className?: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  if (reduced || anim === "none") return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={variantsFor(anim, dir, speed)}>
      {children}
    </motion.div>
  );
}
