import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The site's picture frame — one mount for every photograph and every film.
 *
 * A photograph is the only rectangle on this page that isn't made of cream and
 * gold, and butting one straight against the background is what makes it read
 * as pasted on rather than placed. So a picture gets MOUNTED the way a print
 * is: a warm gilded mat cut from the same surface as `Panel`, a gold hairline
 * on both edges of it, and the image held a few millimetres inside.
 *
 * Three layers, and each one earns its place:
 *
 *   • the MAT — `Panel`'s gradient, blur and long low shadow, so a framed
 *     picture belongs to the same family as every card on the site;
 *   • the WASH — a flat tint of the brand's gold over the image, pulling a
 *     photograph's cold whites toward the page's warmth. Deliberately uniform:
 *     `soft-light` at this strength tints without darkening, and there is no
 *     gradient and no direction to it, so it never reads as a scrim;
 *   • the INNER HAIRLINE — the gold line again on the picture's own edge,
 *     which is what makes the mat read as a mat rather than as padding.
 *
 * `flat` drops the mat for the cases that already sit inside a frame (a
 * picture at the top of a Panel, a fill inside a positioned parent) and keeps
 * only the wash and the hairline, so those don't double up their borders.
 */
export function MediaFrame({
  children,
  className,
  innerClassName,
  rounded = "rounded-3xl",
  /** the picture's own corner — one notch tighter than the mat's, as a mount is */
  innerRounded = "rounded-[1.4rem]",
  flat = false,
  /** the mat's thickness; the hero's film screen wears a wider one */
  pad = "p-2",
  style,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  rounded?: string;
  innerRounded?: string;
  flat?: boolean;
  pad?: string;
  style?: React.CSSProperties;
}) {
  const picture = (
    <div
      className={cn("relative overflow-hidden", flat ? rounded : innerRounded, innerClassName)}
      style={flat ? style : undefined}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-brand/20 via-transparent to-gold-hi/15 mix-blend-soft-light"
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold-hi/25",
          flat ? rounded : innerRounded,
        )}
        aria-hidden
      />
    </div>
  );

  if (flat) return picture;

  return (
    <div
      className={cn(
        "relative border border-brand/30 bg-gradient-to-b from-panel/80 to-panel-2/55 shadow-[0_30px_70px_-40px_rgb(var(--c-ink)/0.5)] backdrop-blur-md",
        rounded,
        pad,
        className,
      )}
      style={style}
    >
      {picture}
    </div>
  );
}
