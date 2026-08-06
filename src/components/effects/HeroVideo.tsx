import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useMediaSlides } from "@/hooks/useSiteContent";
import { useMediaFlags } from "@/hooks/useMediaFlags";
import { Mascot } from "@/components/mascot/Mascot";
import { HERO_VIDEO } from "@/data/heroVideo";
import { pickLang } from "@/lib/localized";
import { dbSrcSet } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * The hero's end-side column: one video screen, framed like the rest of the
 * site's cards.
 *
 * It plays the way a hero film has to play — muted, looping, inline and with
 * no chrome — because it is scenery, not a thing anyone came here to watch.
 * The two controls it does show (play/pause, sound) exist because a video that
 * moves forever with no way to stop it is an accessibility failure, and
 * because a muted autoplay with no unmute is a film nobody ever hears.
 *
 * The source is resolved at runtime, so "the client sends the video later" is
 * an ordinary state and not a redeploy — see `src/data/heroVideo.ts`.
 */
export function HeroVideo({ className }: { className?: string }) {
  const { t, lang } = useLanguage();
  const { data: slides } = useMediaSlides("hero");
  const { reducedMotion, saveData } = useMediaFlags();
  const videoRef = useRef<HTMLVideoElement>(null);

  // an admin-uploaded film wins over the drop-in file; the first hero image is
  // the poster when that film brought none of its own
  const videoSlide = slides?.find((slide) => slide.kind === "video");
  const firstImage = slides?.find((slide) => slide.kind === "image");
  const src = videoSlide?.url ?? HERO_VIDEO.src;
  const poster = videoSlide?.poster_url ?? firstImage?.url ?? HERO_VIDEO.poster;
  const title = pickLang(lang, videoSlide?.title_fr, videoSlide?.title_ar);
  const subtitle = pickLang(lang, videoSlide?.subtitle_fr, videoSlide?.subtitle_ar);

  // The drop-in path is a promise about a file that may not be there yet, so
  // "missing" is a state we arrive at from the element's own error event. We
  // remember WHICH url failed rather than a boolean: a new src is then a new
  // question, answered by a comparison instead of by resetting a flag in an
  // effect (which is both a cascading render and a lint error here).
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  // reduced motion and a metered connection both mean "don't move until asked"
  const ambient = !reducedMotion && !saveData;
  // starts false even when autoplay is wanted: a blocked autoplay fires no
  // event at all, and a Pause button over a still frame is a lie
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const missing = failedSrc === src;

  // React assigns `muted` as a property, and autoplay policies read it back off
  // the element; mirroring it here keeps the two from drifting apart
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  }, []);

  const toggleMuted = useCallback(() => setMuted((previous) => !previous), []);

  return (
    <div className={cn("relative", className)}>
      {/* the frame is the design: a gold-hairline screen floating on the cream */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-brand/25 bg-panel-2/70 shadow-[0_40px_90px_-40px_rgb(var(--c-ink)/0.45)]">
        {missing ? (
          <PosterState poster={poster} />
        ) : (
          <>
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              className="h-full w-full object-cover"
              autoPlay={ambient}
              loop
              muted={muted}
              playsInline
              // the poster carries the frame until someone asks for the film
              preload={ambient ? "metadata" : "none"}
              onError={() => setFailedSrc(src)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              aria-label={title ?? t("hero.videoLabel")}
            />

            {/* a scrim only where the caption and controls sit, so the film
                keeps its own contrast everywhere else */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent"
              aria-hidden
            />

            {(title || subtitle) && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-start">
                {title && <p className="font-display text-lg text-cream">{title}</p>}
                {subtitle && <p className="mt-0.5 text-sm text-cream/80">{subtitle}</p>}
              </div>
            )}

            <div className="absolute end-4 bottom-4 flex items-center gap-2">
              <ScreenButton
                label={playing ? t("hero.videoPause") : t("hero.videoPlay")}
                onClick={togglePlay}
              >
                {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
              </ScreenButton>
              <ScreenButton
                label={muted ? t("hero.videoUnmute") : t("hero.videoMute")}
                onClick={toggleMuted}
              >
                {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </ScreenButton>
            </div>
          </>
        )}
      </div>
    </div>
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
      <img
        src={poster}
        srcSet={dbSrcSet(poster)}
        sizes="(min-width: 1024px) 32vw, 90vw"
        alt=""
        className="h-full w-full object-cover"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[1px]" aria-hidden />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-cream/40 bg-ink/40 text-cream backdrop-blur">
          <Film size={22} strokeWidth={1.5} />
        </span>
        {/* both lines are PUBLIC copy. How to fill this screen belongs in the
            handoff notes, not on the customer's hero — telling a shopper to
            "add it from the admin area" is the tell of an unfinished site. */}
        <p className="font-display text-lg text-cream">{t("hero.videoSoon")}</p>
        <p className="max-w-[16rem] text-xs text-cream/70">{t("hero.videoSoonHint")}</p>
        {/* the cup is what makes the wait feel intentional rather than unfinished */}
        <Mascot emotion="sleepy" palette={["sleepy"]} size={72} className="mt-1" />
      </div>
    </div>
  );
}

function ScreenButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/25 bg-ink/50 text-cream backdrop-blur transition-colors cursor-pointer hover:border-cream/60 hover:bg-ink/70"
    >
      {children}
    </button>
  );
}
