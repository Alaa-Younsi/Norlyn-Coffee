import { cn } from "@/lib/utils";

/**
 * Espresso cup on a saucer with a pulsing golden crema and rising steam —
 * theme-aware SVG art, no image download.
 */
export function CoffeeCupArt({
  className,
  steam = true,
}: {
  className?: string;
  steam?: boolean;
}) {
  return (
    <div className={cn("pointer-events-none relative", className)} aria-hidden>
      {steam && (
        <div className="absolute -top-[45%] start-1/2 h-[55%] w-12 -translate-x-1/2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="fx-steam absolute bottom-0 w-[3px] rounded-full bg-gradient-to-t from-transparent via-ink/25 to-transparent blur-[1px]"
              style={{
                insetInlineStart: `${22 + i * 24}%`,
                height: "90%",
                animationDelay: `${i * 1.1}s`,
                animationDuration: `${3.6 + i * 0.8}s`,
              }}
            />
          ))}
        </div>
      )}
      <svg viewBox="0 0 120 92" className="h-auto w-full">
        {/* saucer */}
        <ellipse cx="55" cy="80" rx="42" ry="7" fill="rgb(var(--c-brand) / 0.22)" />
        <ellipse cx="55" cy="78" rx="34" ry="5.5" fill="rgb(var(--c-panel-2))" stroke="rgb(var(--c-brand) / 0.6)" strokeWidth="1.5" />
        {/* handle */}
        <path
          d="M88 38 C 104 35, 104 56, 85 58"
          fill="none"
          stroke="rgb(var(--c-brand))"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* cup body */}
        <path
          d="M22 30 C 24 58, 36 70, 55 70 C 74 70, 86 58, 88 30 Z"
          fill="rgb(var(--c-panel))"
          stroke="rgb(var(--c-brand))"
          strokeWidth="2.5"
        />
        {/* crema */}
        <ellipse cx="55" cy="30" rx="33" ry="6.5" fill="rgb(var(--c-gold-hi))" className="fx-crema" />
        <ellipse cx="55" cy="30" rx="33" ry="6.5" fill="none" stroke="rgb(var(--c-brand))" strokeWidth="2" />
        {/* crema swirl */}
        <path
          d="M42 30 q 6 -2.5 13 0 q 7 2.5 14 0"
          fill="none"
          stroke="rgb(var(--c-brand) / 0.55)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
