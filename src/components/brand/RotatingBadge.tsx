import { useId } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A round seal of text turning slowly around an arrow — the scroll cue, set
 * like the stamp on a coffee sack instead of a mouse icon. The ring of words
 * is an SVG textPath (real text, selectable, translatable); the spin is the
 * CSS `fx-spin-badge` keyframe and stops under reduced motion. On hover the
 * centre swells and the arrow drops.
 */
export function RotatingBadge({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  const pathId = useId();
  // once around, spaced to close the circle exactly (2π·38 ≈ 238.8)
  const ring = `${label} • `;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn("group relative block h-28 w-28 shrink-0 cursor-pointer text-ink", className)}
    >
      <svg viewBox="0 0 100 100" aria-hidden className="fx-spin-badge absolute inset-0 h-full w-full">
        <defs>
          <path id={pathId} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current font-sans text-[9px] font-semibold uppercase">
          <textPath href={`#${pathId}`} textLength="238" lengthAdjust="spacing">
            {ring}
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-[30%] flex items-center justify-center rounded-full bg-brand text-cream transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110">
        <ArrowDown size={18} className="transition-transform duration-500 group-hover:translate-y-0.5" />
      </span>
    </button>
  );
}
