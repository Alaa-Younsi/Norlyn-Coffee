import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaFlags } from "@/hooks/useMediaFlags";
import { PRODUCT_VIDEO } from "@/data/productVideo";
import { dbSrcSet } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * The espresso loop that fills the column beside the buy form.
 *
 * This is scenery, not media: it runs on its own the moment the page opens and
 * offers nothing to press. No controls, no picture-in-picture, no context
 * menu, no focus stop, and pointer events pass straight through it — a tap
 * lands on the page, never on the film. `onPause` puts it back: the only
 * things that can pause it are the browser's own housekeeping (a background
 * tab, an incoming call), and it should come back running from those.
 *
 * Two audiences are exempt, and both asked to be:
 *
 *   • `prefers-reduced-motion` — a video that loops forever with no way to
 *     stop it is exactly what that setting exists to switch off, and WCAG
 *     2.2.2 requires a pause control for anything that moves past five seconds
 *     otherwise. Honouring the OS setting IS that control, without putting a
 *     button on a page that shouldn't have one.
 *   • Save-Data / 2G — most of this store's traffic is a phone on mobile data
 *     in Algeria, and silently spending it on decoration is the same mistake
 *     as an unskippable ad.
 *
 * Both land on the poster still, which is a real photograph, so the layout is
 * finished either way. That is also where a missing file lands: the film is a
 * drop-in (see `data/productVideo.ts`), so "not shot yet" is an ordinary state
 * and not a black box.
 */
export function EspressoLoop({ className }: { className?: string }) {
  const { reducedMotion, saveData } = useMediaFlags();
  const videoRef = useRef<HTMLVideoElement>(null);
  // The drop-in path promises a file that may not be there. We learn that from
  // the element's own error event and remember WHICH url failed, so a later
  // src is a fresh question answered by comparison rather than by resetting a
  // flag inside an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const ambient = !reducedMotion && !saveData;
  const showFilm = ambient && failedSrc !== PRODUCT_VIDEO.src;

  // Autoplay policies read `muted` off the element, and React sets it as a
  // property rather than an attribute — so a video that mounted before the
  // property landed can be refused. Setting it by hand first keeps the two in
  // step, the same way HeroVideo does.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showFilm) return;
    video.muted = true;
    void video.play().catch(() => {
      /* a blocked autoplay just leaves the poster frame showing */
    });
  }, [showFilm]);

  const resume = useCallback(() => {
    const video = videoRef.current;
    // `ended` never fires on a looping video, so a pause here is either the
    // browser's housekeeping or someone who found a way to press something
    if (video && !video.ended) void video.play().catch(() => {});
  }, []);

  return (
    <div
      className={cn(
        "relative min-h-[20rem] overflow-hidden rounded-3xl border border-line bg-panel",
        className,
      )}
    >
      {showFilm ? (
        <video
          ref={videoRef}
          src={PRODUCT_VIDEO.src}
          poster={PRODUCT_VIDEO.poster}
          className="pointer-events-none h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          tabIndex={-1}
          aria-hidden
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          onContextMenu={(event) => event.preventDefault()}
          onPause={resume}
          onError={() => setFailedSrc(PRODUCT_VIDEO.src)}
        />
      ) : (
        <img
          src={PRODUCT_VIDEO.poster}
          srcSet={dbSrcSet(PRODUCT_VIDEO.poster)}
          sizes="(min-width: 1024px) 45vw, 90vw"
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      )}
      {/* the same warm scrim the rest of the site puts over photography, so
          the film sits in the page instead of punching a hole in it */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent"
        aria-hidden
      />
    </div>
  );
}
