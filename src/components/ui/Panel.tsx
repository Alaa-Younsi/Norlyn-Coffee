import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Warm bento panel — the site-wide surface primitive. */
export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // frosted on desktop only — see Header for why phones get a solid fill
        "rounded-3xl border border-line bg-panel/95 shadow-[0_18px_50px_-24px_rgb(var(--c-ink)/0.25)] md:bg-panel/80 md:backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
