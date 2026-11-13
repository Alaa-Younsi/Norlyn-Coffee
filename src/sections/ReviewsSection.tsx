import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import { RevealHeading } from "@/components/brand/RevealHeading";
import { Mascot } from "@/components/mascot/Mascot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useReviews } from "@/hooks/useReviews";
import { gsap } from "@/lib/gsap";
import type { MascotEmotion } from "@/lib/mascot";
import { cn } from "@/lib/utils";

/** the cup reads the rating back — five stars is love, one is a bad night */
const FACE_FOR_STARS: Record<number, MascotEmotion> = {
  5: "love",
  4: "happy",
  3: "calm",
  2: "surprised",
  1: "sleepy",
};

/** resting tilt per card — a pinboard, not a grid */
const TILTS = ["-rotate-2", "rotate-[1.5deg]", "-rotate-1", "rotate-2", "-rotate-[1.5deg]", "rotate-1"];

/**
 * Reviews as the stamps on the Moriva posters: perforated paper, a strip of
 * tape holding each one up, the cup's face in the corner reading the rating.
 * The paper is theme-invariant — it is paper in daylight and in the dark —
 * so it lifts off the fully-roasted page the way the posters lift off beans.
 *
 * Entrance: each stamp tumbles in from below with its own spin, scrubbed to
 * the scroll, onto the WRAPPER (the resting tilt lives on the child, so the
 * two transforms never fight).
 */
export function ReviewsSection() {
  const { t } = useLanguage();
  const { data: reviews } = useReviews();
  const gridRef = useRef<HTMLDivElement>(null);
  const count = reviews?.length ?? 0;

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || count === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-stamp]");
      cards.forEach((card, i) => {
        gsap.from(card, {
          y: 160,
          rotate: i % 2 === 0 ? -14 : 12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 100%",
            end: "top 62%",
            scrub: 0.8,
          },
        });
      });
    }, grid);
    return () => ctx.revert();
  }, [count]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="relative overflow-clip py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <RevealHeading className="max-w-2xl font-display text-[2.6rem] leading-[1.02] font-medium tracking-[-0.02em] sm:text-6xl">
          {t("reviews.title")}
        </RevealHeading>

        <div ref={gridRef} className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((review, i) => (
            <div key={review.id} data-stamp>
              <figure
                className={cn(
                  // the shadow lives here: on the stamp itself the perforation mask would cut it off
                  "relative transition-transform duration-500 hover:rotate-0 hover:-translate-y-1 md:drop-shadow-[0_18px_30px_rgb(0_0_0/0.35)]",
                  TILTS[i % TILTS.length],
                )}
              >
                {/* tape */}
                <span
                  aria-hidden
                  className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rotate-[-3deg] bg-[#e4d3ad]/85 shadow-sm"
                />
                <div className="fx-stamp bg-[#f7f0e4]">
                  <div className="relative border border-dashed border-[#2b1d16]/15 p-6 text-[#2b1d16]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-0.5 text-[#a97c37]" aria-label={`${review.stars}/5`}>
                        {Array.from({ length: 5 }, (_, k) => (
                          <Star
                            key={k}
                            size={14}
                            fill={k < review.stars ? "currentColor" : "none"}
                            className={k < review.stars ? "" : "text-[#2b1d16]/20"}
                          />
                        ))}
                      </div>
                      <Mascot
                        emotion={FACE_FOR_STARS[review.stars] ?? "happy"}
                        palette={[FACE_FOR_STARS[review.stars] ?? "happy"]}
                        size={48}
                        float={false}
                        className="-mt-2 -me-2"
                      />
                    </div>
                    <blockquote className="mt-3 font-display text-lg leading-relaxed">
                      “{review.review_text}”
                    </blockquote>
                    <figcaption className="mt-5 text-sm font-semibold tracking-wide text-[#2b1d16]/60">
                      — {review.client_name}
                    </figcaption>
                  </div>
                </div>
              </figure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
