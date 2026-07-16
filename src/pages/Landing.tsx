import { lazy, Suspense, useEffect, useRef } from "react";
import { HeroSection } from "@/sections/HeroSection";
import { StorySection } from "@/sections/StorySection";
import { VariantsSection } from "@/sections/VariantsSection";
import { FeaturedSection } from "@/sections/FeaturedSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { ReviewsSection } from "@/sections/ReviewsSection";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useMediaFlags } from "@/hooks/useMediaFlags";
import { useProducts } from "@/hooks/useProducts";
import { useScrollStage } from "@/hooks/useScrollStage";
import { useSeo } from "@/hooks/useSeo";
import { ScrollTrigger } from "@/lib/gsap";

// three.js only downloads for visitors who actually get the 3D hero
const Scene = lazy(() =>
  import("@/components/3d/Scene").then((m) => ({ default: m.Scene })),
);

export function Landing() {
  const { dir } = useLanguage();
  const flags = useMediaFlags();
  const { data: products } = useProducts({ featuredOnly: true });
  const stageRef = useRef<HTMLDivElement>(null);
  useScrollStage(stageRef);

  useSeo({
    title: "Norlyn Coffee — Moriva, capsules espresso premium en Algérie",
    description:
      "Moriva par Norlyn Coffee — capsules espresso premium compatibles Nespresso. 4 intensités, livraison 58 wilayas, paiement à la livraison.",
  });

  const variants = (products ?? []).slice(0, 4);
  const show3D = flags.allow3D && variants.length > 0;

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
      {/* fixed 3D layer above the copy (capsule overlaps the headline like the
          reference art), pointer-events-none so everything stays clickable */}
      {show3D && (
        <div className="pointer-events-none fixed inset-0 z-20" aria-hidden>
          <Suspense fallback={null}>
            <Scene colors={colors} dirSign={dir === "rtl" ? -1 : 1} />
          </Suspense>
        </div>
      )}

      {/* scroll stage — the zone the master ScrollTrigger maps to 0..1 */}
      <div ref={stageRef} className="relative">
        <HeroSection show3D={show3D} />
        <StorySection />
        <VariantsSection products={variants} show3D={show3D} />
      </div>

      <div className="relative z-10 bg-bg">
        <FeaturedSection products={products ?? []} />
        <HowItWorksSection />
        <ReviewsSection />
      </div>
    </>
  );
}
