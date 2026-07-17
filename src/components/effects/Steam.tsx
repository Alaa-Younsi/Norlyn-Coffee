import { cn } from "@/lib/utils";

/** Rising steam wisps — pure CSS, sits above the capsule/hero art. */
const WISPS = [
  { start: 18, width: 3, height: 78, delay: 0, duration: 3.8 },
  { start: 38, width: 5, height: 90, delay: 1.3, duration: 4.5 },
  { start: 58, width: 4, height: 84, delay: 2.4, duration: 5.2 },
  { start: 76, width: 3, height: 70, delay: 0.7, duration: 4.1 },
] as const;

export function Steam({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none relative h-28 w-24", className)} aria-hidden>
      {WISPS.map((wisp, i) => (
        <span
          key={i}
          className="fx-steam absolute bottom-0 rounded-full bg-gradient-to-t from-transparent via-ink/20 to-transparent blur-[1.5px]"
          style={{
            insetInlineStart: `${wisp.start}%`,
            width: wisp.width,
            height: `${wisp.height}%`,
            animationDelay: `${wisp.delay}s`,
            animationDuration: `${wisp.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
