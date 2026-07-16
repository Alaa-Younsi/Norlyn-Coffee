import { cn } from "@/lib/utils";

/** Rising steam wisps — pure CSS, sits above the capsule/hero art. */
export function Steam({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none relative h-28 w-20", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="fx-steam absolute bottom-0 w-[3px] rounded-full bg-gradient-to-t from-transparent via-ink/20 to-transparent"
          style={{
            insetInlineStart: `${28 + i * 18}%`,
            height: "85%",
            animationDelay: `${i * 1.3}s`,
            animationDuration: `${3.8 + i * 0.7}s`,
          }}
        />
      ))}
    </div>
  );
}
