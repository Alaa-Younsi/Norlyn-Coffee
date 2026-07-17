import { CoffeeBeanIcon } from "./CoffeeBeanIcon";
import { cn } from "@/lib/utils";

/** Section divider: fading gold lines meeting a trio of beans. */
export function CoffeeDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none flex items-center justify-center gap-3", className)}
      aria-hidden
    >
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-brand/50 sm:w-28" />
      <CoffeeBeanIcon className="w-3 -rotate-12 text-brand/60" />
      <CoffeeBeanIcon className="w-4.5 text-brand" />
      <CoffeeBeanIcon className="w-3 rotate-12 text-brand/60" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-brand/50 sm:w-28" />
    </div>
  );
}
