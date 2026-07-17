import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Coffee cup stain — irregular dashed rings, like a mug left on paper.
 * Position and size it via className; pair with fx-spin-slow for a
 * barely-perceptible rotation.
 */
export function CoffeeRing({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("pointer-events-none absolute text-brand", className)}
      style={style}
      aria-hidden
      fill="none"
      stroke="currentColor"
    >
      <circle
        cx="100"
        cy="100"
        r="86"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="120 40 200 30 90 55"
        opacity="0.5"
      />
      <circle
        cx="100"
        cy="100"
        r="72"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="60 90 160 40 80 70"
        opacity="0.35"
      />
      <circle
        cx="100"
        cy="100"
        r="94"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="30 140 80 90"
        opacity="0.25"
      />
    </svg>
  );
}
