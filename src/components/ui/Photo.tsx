import { cn } from "@/lib/utils";
import { mediaSrc, mediaSrcSet, type Media } from "@/lib/media";

/**
 * The one way this site renders a picture from `lib/media.ts`.
 *
 * It always emits width/height (no layout shift), always a capped srcSet, and
 * defaults to lazy + async decoding — `priority` opts a picture into eager
 * loading, which only the LCP image of a page should ever ask for.
 *
 * `sizes` matters: without it the browser assumes 100vw and downloads the
 * largest candidate for a thumbnail. Every caller passes the CSS width the
 * picture actually occupies.
 */
export function Photo({
  media,
  alt,
  sizes = "100vw",
  className,
  priority = false,
  fit = "cover",
}: {
  media: Media;
  /** "" marks the picture as decorative — the copy beside it carries the meaning */
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
}) {
  return (
    <img
      src={mediaSrc(media)}
      srcSet={mediaSrcSet(media)}
      sizes={sizes}
      alt={alt}
      width={media.w}
      height={media.h}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={cn(fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}
