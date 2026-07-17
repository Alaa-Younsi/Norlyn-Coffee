import { cn } from "@/lib/utils";

/**
 * Looping espresso extraction: portafilter spout, a live coffee stream,
 * and a cup with pulsing crema. Pure SVG + CSS, theme-aware.
 */
export function EspressoPour({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none relative", className)} aria-hidden>
      <svg viewBox="0 0 120 150" className="h-auto w-full">
        {/* portafilter spout */}
        <path d="M38 6 h44 v10 l-13 11 h-18 l-13 -11 Z" fill="rgb(var(--c-ink) / 0.75)" />
        <rect x="52" y="24" width="16" height="6" rx="3" fill="rgb(var(--c-ink) / 0.75)" />
        {/* coffee stream */}
        <rect
          x="57"
          y="29"
          width="6"
          height="56"
          rx="3"
          fill="rgb(var(--c-brand))"
          className="fx-pour-stream"
        />
        {/* cup */}
        <path
          d="M35 84 C 37 106, 45 114, 60 114 C 75 114, 83 106, 85 84 Z"
          fill="rgb(var(--c-panel))"
          stroke="rgb(var(--c-brand))"
          strokeWidth="2.5"
        />
        <path
          d="M85 90 C 98 88, 98 104, 83 105"
          fill="none"
          stroke="rgb(var(--c-brand))"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* crema */}
        <ellipse cx="60" cy="84" rx="25" ry="5" fill="rgb(var(--c-gold-hi))" className="fx-crema" />
        <ellipse cx="60" cy="84" rx="25" ry="5" fill="none" stroke="rgb(var(--c-brand))" strokeWidth="2" />
        {/* saucer */}
        <ellipse cx="60" cy="124" rx="38" ry="6.5" fill="rgb(var(--c-brand) / 0.22)" />
      </svg>
    </div>
  );
}
