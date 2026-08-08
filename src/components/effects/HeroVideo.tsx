import { useCallback, useEffect, useRef, useState } from "react";
import { Film } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useMediaSlides, useVideoSlot } from "@/hooks/useSiteContent";
import { useMediaFlags } from "@/hooks/useMediaFlags";
import { Mascot } from "@/components/mascot/Mascot";
import { HERO_VIDEO_SLOT } from "@/lib/videoSlots";
import { pickLang } from "@/lib/localized";
import { dbSrcSet } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * The hero's end-side column: one video screen, framed like the rest of the
 * site's cards.
 *
 * This is scenery, not media — the same bargain `EspressoLoop` makes on the
 * product pages. It runs from the moment the page opens and offers nothing to
 * press: no buttons, no picture-in-picture, no context menu, no focus stop, and
 * pointer events pass straight through, so a tap lands on the page behind it.
 * `onPause` puts it back, because the only things that can stop it are the
 * browser's own housekeeping (a backgrounded tab, an incoming call) and it
 * should come back running from those.
 *
 * It plays muted and has no way to unmute, which costs nothing: the film is a
 * loop of a cup filling, and the masters delivered so far carry a track of pure
 * digital silence that `scripts/optimize-videos.mjs` strips on the way in.
 *
 * WCAG 2.2.2 wants a pause control for anything that moves past five seconds,
 * and there isn't one. What answers it instead is `prefers-reduced-motion` —
 * honouring the OS setting IS that control, and it is the better one, because
 * the people who need it have already asked once and system-wide rather than
 * per-video. Save-Data joins it: most of this store's traffic is a phone on
 * mobile data in Algeria, and spending it on decoration without being asked is
 * the same mistake as an unskippable ad. Both land on the still, which is a
 * real photograph, so the column is finished either way.
 *
 * The source is resolved at runtime, so "the client sends the video later" is
 * an ordinary state and not a redeploy — see `src/lib/videoSlots.ts`.
 */
export function HeroVideo({ className }: { className?: string }) {
  const { lang } = useLanguage();
  const { data: slides } = useMediaSlides("hero");
  const { reducedMotion, saveData } = useMediaFlags();
  const videoRef = useRef<HTMLVideoElement>(null);

  /*
    Three ways this screen can be filled, and they are checked in the order of
    how deliberate each one is:

      1. the `home.hero` VIDEO SLOT — Admin → Contenu & médias → Vidéos. This
         is the one the client is pointed at, and the only one that is about
         this screen and nothing else.
      2. a hero SLIDE of kind `video` — the older mechanism, kept because a
         store that already configured one must not lose its film to this
         change. It is a slider concept, so it also carries the caption.
      3. the committed drop-in at /videos/hero.mp4.

    (1) and (3) are what `useVideoSlot` returns; `custom` distinguishes them.
  */
  const slot = useVideoSlot(HERO_VIDEO_SLOT);
  const videoSlide = slides?.find((slide) => slide.kind === "video");
  const firstImage = slides?.find((slide) => slide.kind === "image");

  const src = slot.custom ? slot.src : (videoSlide?.url ?? slot.src);
  // the first hero photograph stands in as the still — but only when the film
  // playing is not the client's own upload, which brings its own poster
  const poster = slot.custom
    ? slot.poster
    : (videoSlide?.poster_url ?? firstImage?.url ?? slot.poster);

  const title = pickLang(lang, videoSlide?.title_fr, videoSlide?.title_ar, videoSlide?.title_en);
  const subtitle = pickLang(
    lang,
    videoSlide?.subtitle_fr,
    videoSlide?.subtitle_ar,
    videoSlide?.subtitle_en,
  );
  const caption = Boolean(title || subtitle);

  // The drop-in path is a promise about a file that may not be there yet, so
  // "missing" is a state we arrive at from the element's own error event. We
  // remember WHICH url failed rather than a boolean: a new src is then a new
  // question, answered by a comparison instead of by resetting a flag in an
  // effect (which is both a cascading render and a lint error here).
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  // reduced motion and a metered connection both mean "don't move"
  const ambient = !reducedMotion && !saveData;
  const missing = failedSrc === src;
  const showFilm = ambient && !missing;

  // Autoplay policies read `muted` off the element, and React sets it as a
  // property rather than an attribute — so a video that mounted before the
  // property landed can be refused. Setting it by hand first keeps the two in
  // step, the same way EspressoLoop does.
  // `src` is in the deps because it genuinely changes: the slot resolves to the
  // committed drop-in on first paint and swaps to the client's upload when the
  // site_videos query lands. Without it the new file would sit on its poster.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showFilm) return;
    video.muted = true;
    void video.play().catch(() => {
      /* a blocked autoplay just leaves the poster frame showing */
    });
  }, [showFilm, src]);

  const resume = useCallback(() => {
    const video = videoRef.current;
    // `ended` never fires on a looping video, so a pause here is either the
    // browser's housekeeping or someone who found a way to press something
    if (video && !video.ended) void video.play().catch(() => {});
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* warm bloom leaking from behind the frame, so the dark film sits ON the
          cream rather than punching a hole in it */}
      <div className="fx-screen-glow pointer-events-none absolute -inset-6" aria-hidden />

      {/*
        The mat. A film is the one dark rectangle on a page made of cream and
        gold hairlines, and butting the footage straight against that was what
        made it read as pasted on. So it gets mounted the way a photograph is:
        a warm gilded surround with the site's own panel gradient, its blur and
        its long low shadow — the same surface `Panel` and the gallery tiles
        are cut from — and the picture held a few millimetres inside it.
        `fx-sheen` is the site-wide hover motif; the screen answers a cursor
        like every other card does.
      */}
      <div className="fx-sheen relative rounded-[2.25rem] border border-brand/30 bg-gradient-to-b from-panel/80 to-panel-2/55 p-2.5 shadow-[0_40px_90px_-45px_rgb(var(--c-ink)/0.5)] backdrop-blur-md">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.65rem] bg-panel-2">
          {missing ? (
            <PosterState poster={poster} />
          ) : showFilm ? (
            <video
              ref={videoRef}
              src={src}
              poster={poster}
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
              onError={() => setFailedSrc(src)}
            />
          ) : (
            <Still poster={poster} />
          )}

          {/* A wash of the brand's own gold, pulling the footage's cold whites
              and greys toward the page's warmth. `soft-light` at this strength
              tints; it does not darken — the complaint about the old overlay
              was that it shaded half the picture, and this deliberately has no
              gradient, no direction and nothing to hide behind it. */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-brand/25 via-transparent to-gold-hi/20 mix-blend-soft-light"
            aria-hidden
          />
          {/* the gold hairline again, on the inside edge — the glass in the frame */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.65rem] ring-1 ring-inset ring-gold-hi/25"
            aria-hidden
          />

          {/* The scrim is the caption's background, and nothing else — with no
              controls left down there, a film with no words to read is just a
              film with a shadow on it. So it arrives WITH the text or not at
              all, and the picture keeps its own contrast the rest of the time. */}
          {caption && !missing && (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-shade/75 via-shade/25 to-transparent"
                aria-hidden
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-start">
                {title && <p className="font-display text-lg text-on-shade">{title}</p>}
                {subtitle && <p className="mt-0.5 text-sm text-on-shade/80">{subtitle}</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** The photograph on its own — the film's first frame before it plays, and the
 *  whole screen for anyone who asked not to be moved. */
function Still({ poster }: { poster: string }) {
  return (
    <img
      src={poster}
      srcSet={dbSrcSet(poster)}
      sizes="(min-width: 1024px) 32vw, 90vw"
      alt=""
      aria-hidden
      className="h-full w-full object-cover"
      loading="eager"
      fetchPriority="high"
      decoding="async"
    />
  );
}

/**
 * What the screen looks like before there is a film: the still, dimmed just
 * enough to read a plate over it, and the cup waiting for the show to start.
 */
function PosterState({ poster }: { poster: string }) {
  const { t } = useLanguage();
  return (
    <div className="relative h-full w-full">
      <Still poster={poster} />
      <div className="absolute inset-0 bg-shade/45 backdrop-blur-[1px]" aria-hidden />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-on-shade/40 bg-shade/40 text-on-shade backdrop-blur">
          <Film size={22} strokeWidth={1.5} />
        </span>
        {/* both lines are PUBLIC copy. How to fill this screen belongs in the
            handoff notes, not on the customer's hero — telling a shopper to
            "add it from the admin area" is the tell of an unfinished site. */}
        <p className="font-display text-lg text-on-shade">{t("hero.videoSoon")}</p>
        <p className="max-w-[16rem] text-xs text-on-shade/70">{t("hero.videoSoonHint")}</p>
        {/* the cup is what makes the wait feel intentional rather than unfinished */}
        <Mascot emotion="sleepy" palette={["sleepy"]} size={72} className="mt-1" />
      </div>
    </div>
  );
}
