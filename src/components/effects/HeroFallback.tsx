import type { CSSProperties } from "react";

/**
 * 2D hero art for mobile / save-data / reduced-motion visitors — the 3D
 * canvas is never mounted for them. CSS float only; opacity stays 1.
 */
export function HeroFallback() {
  return (
    <div className="pointer-events-none relative mx-auto aspect-square w-full max-w-xs" aria-hidden>
      <div className="fx-podium absolute inset-x-6 bottom-2 h-16 rounded-[50%]" />
      <img
        src="/images/capsules/lungo-dore-lg.webp"
        alt=""
        width={1000}
        height={1000}
        fetchPriority="high"
        className="fx-float relative h-full w-full object-contain drop-shadow-[0_30px_35px_rgb(var(--c-ink)/0.35)]"
        style={{ "--drift-y": "-10px", "--drift-dur": "5s" } as CSSProperties}
      />
    </div>
  );
}
