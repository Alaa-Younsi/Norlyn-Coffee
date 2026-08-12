import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ScrollProgressBar } from "@/components/effects/ScrollProgressBar";
import { ScrollMascot } from "@/components/mascot/ScrollMascot";
import { HeroSection } from "@/sections/HeroSection";
import { StorySection } from "@/sections/StorySection";
import { VariantsSection } from "@/sections/VariantsSection";
import { FeaturedSection } from "@/sections/FeaturedSection";
import { GallerySection } from "@/sections/GallerySection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { ReviewsSection } from "@/sections/ReviewsSection";
import { NewsletterSection } from "@/sections/NewsletterSection";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useMediaFlags } from "@/hooks/useMediaFlags";
import { useProducts } from "@/hooks/useProducts";
import { useScrollStage } from "@/hooks/useScrollStage";
import { useSeo } from "@/hooks/useSeo";
import { ScrollTrigger } from "@/lib/gsap";
import { LANDING_PALETTE } from "@/lib/mascot";
import { useSplashHold } from "@/store/splash";

// three.js only downloads for visitors who actually get the 3D hero
const Scene = lazy(() =>
  import("@/components/3d/Scene").then((m) => ({ default: m.Scene })),
);

export function Landing() {
  const { dir, t } = useLanguage();
  const flags = useMediaFlags();
  const { data: products, isPending: productsPending } = useProducts({ featuredOnly: true });
  const stageRef = useRef<HTMLDivElement>(null);
  useScrollStage(stageRef);

  useSeo({ title: t("home.metaTitle"), description: t("home.metaDesc") });

  const variants = (products ?? []).slice(0, 4);
  const show3D = flags.allow3D && variants.length > 0;

  /**
   * The 2D capsule art belongs to visitors who will NEVER get the canvas —
   * reduced motion, save-data, or a store with nothing to show. It is not a
   * loading state: `show3D` is also false for the beat between first paint and
   * the catalogue landing, and painting the capsule there is exactly the
   * flash-then-swap the client sees on every cold load. So the hero's middle
   * column stays empty (it already reserves its height) until we know which of
   * the two heroes this visitor gets.
   */
  const showHeroArt = !flags.allow3D || (!productsPending && variants.length === 0);

  /*
    What the splash is waiting for on this page, and nothing more.

    The catalogue, because the variants zone's height — and therefore every act
    boundary measured below it — is a function of how many products came back.
    The canvas, because a hero whose centre column is still empty is not a
    finished page. Both are "settled", not "succeeded": a store with no products
    and a browser with no WebGL are ordinary outcomes that resolve the wait
    exactly like the happy path does, or the curtain would sit there until the
    cap for visitors whose site is working perfectly.
  */
  const [sceneDrawn, setSceneDrawn] = useState(false);
  const onFirstFrame = useCallback(() => setSceneDrawn(true), []);

  /*
    And a bound on the canvas specifically. `allow3D` says the visitor has not
    asked us not to animate — it does not say their browser will hand out a
    WebGL context, and when it refuses, nothing ever draws a first frame and
    this hold would sit there until the splash's own hard cap. Four seconds is
    long enough for the three.js chunk to arrive on a slow connection and short
    enough that a machine which simply cannot render it is not made to stare at
    a curtain. The scene is decoration either way: lifting without it costs a
    cup that fades in a moment later, not a broken page.
  */
  const [sceneWaitOver, setSceneWaitOver] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSceneWaitOver(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useSplashHold("landing", productsPending || (show3D && !sceneDrawn && !sceneWaitOver));

  // products arrive async — the variants zone only gets its 440vh height
  // after they load, so every trigger's start/end must be re-measured or the
  // master progress overshoots and the capsule choreography runs early.
  useEffect(() => {
    if (variants.length === 0) return;
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [variants.length]);
  const colors = variants.map((p) => p.accent_color ?? "#b08439");

  return (
    <>
      <ScrollProgressBar />
      {/* fixed 3D layer UNDER the copy (z-10 vs stage z-20) so text and CTAs
          always stay readable and clickable above the capsule */}
      {show3D && (
        <div className="pointer-events-none fixed inset-0 z-10" aria-hidden>
          <Suspense fallback={null}>
            <Scene
              colors={colors}
              dirSign={dir === "rtl" ? -1 : 1}
              compact={flags.isMobile}
              onFirstFrame={onFirstFrame}
            />
          </Suspense>
        </div>
      )}

      {/* Scroll stage — the zone the master ScrollTrigger maps to 0..1, and
          the span the hero object's four acts play out over. The `data-act`
          markers are measured (not hardcoded) into the act boundaries: the
          variants zone's height depends on how many products loaded, so every
          fraction below it moves. Nothing in here may set an opaque
          background — the machine acts play out behind these sections. */}
      {/* the brand cup reacts to whichever section is being read (data-mascot) */}
      <ScrollMascot palette={LANDING_PALETTE} refreshKey={variants.length} />

      <div ref={stageRef} className="relative z-20">
        <HeroSection show3D={show3D} showArt={showHeroArt} />
        <div data-act="story" data-mascot="calm">
          <StorySection />
        </div>
        <div data-act="variants" data-mascot="excited">
          <VariantsSection products={variants} show3D={show3D} />
        </div>
        <div data-act="tail" data-mascot="love">
          <FeaturedSection products={products ?? []} />
          <GallerySection />
        </div>
        {/* The exit act needs scroll room to play out: progress hits 1 when the
            stage's bottom reaches the viewport's bottom, so if the stage ended
            at "Commande en 3 étapes" that act would span (its height − one
            viewport) ≈ 0px and the machine would vanish instantly. Reviews
            rides along to give the dissolve somewhere to happen — but it
            renders nothing until the store has reviews, so useScrollStage
            reserves the last act's span rather than trusting the measurement. */}
        <div data-act="outro" data-mascot="determined">
          <HowItWorksSection />
        </div>
        <ReviewsSection />
      </div>

      {/* OUTSIDE the stage on purpose. useScrollStage measures the stage
          element's own offsetHeight, so anything added inside it would shift
          every measured act boundary and re-time the whole morph. After it,
          the object has already dissolved and this is the last thing before
          the footer. */}
      <NewsletterSection />
    </>
  );
}
