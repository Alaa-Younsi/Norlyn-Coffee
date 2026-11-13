import { useEffect, useRef, useState } from "react";
import { MorivaLogo } from "@/components/brand/Logos";
import { useSplashStore } from "@/store/splash";
import { cn } from "@/lib/utils";

const MASK_SRC = "/images/logo/moriva-mask.svg";
/** the mask's viewBox aspect (486.5 × 113.75) */
const ASPECT = 113.75 / 486.5;
const DURATION = 2100;

type Phase = "assembling" | "done";

interface Grain {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  delay: number;
  r: number;
  tone: number;
}

const TONES = ["#7a5016", "#a97c37", "#c99a45", "#e3c27d", "#f3dca0"];

function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The hero's signature: the Moriva mark condenses out of the gold-dust spray
 * printed on the box.
 *
 * The real logo's silhouette (a single-colour mask extracted from the client's
 * Illustrator file) is rasterised once to an offscreen canvas and sampled on a
 * grid; each sample becomes a grain that flies in from the dense corner of the
 * spray and settles on its spot. When the grains land, the crisp vector logo
 * takes over and the canvas is dropped — the loop runs for about two seconds
 * in a visitor's whole session and never again.
 *
 * The vector logo is the real content (it carries the accessible name). It is
 * only held hidden while the canvas is actually drawing, with a hard timeout,
 * so a canvas that fails or a tab that stalls can never leave the hero blank.
 */
export function GoldDustLogo({ className, title }: { className?: string; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const splashOpen = useSplashStore((s) => s.open);
  const [phase, setPhase] = useState<Phase>("assembling");

  useEffect(() => {
    if (splashOpen || phase === "done") return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx || prefersReducedMotion()) {
      setPhase("done");
      return;
    }

    let raf = 0;
    let cancelled = false;
    // whatever happens below, the logo is back within four seconds
    const failSafe = window.setTimeout(() => setPhase("done"), 4000);

    const image = new Image();
    image.decoding = "async";
    image.src = MASK_SRC;

    image.onload = () => {
      if (cancelled) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = wrap.clientWidth;
      const height = width * ASPECT;
      // room around the mark for grains to arrive from
      const padX = width * 0.35;
      const padY = height * 1.2;
      canvas.width = Math.round((width + padX * 2) * dpr);
      canvas.height = Math.round((height + padY * 2) * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // rasterise the mask small and sample it
      const sampleW = Math.round(width);
      const sampleH = Math.round(height);
      const off = document.createElement("canvas");
      off.width = sampleW;
      off.height = sampleH;
      const octx = off.getContext("2d");
      if (!octx) {
        setPhase("done");
        return;
      }
      octx.drawImage(image, 0, 0, sampleW, sampleH);
      const { data } = octx.getImageData(0, 0, sampleW, sampleH);

      const step = width > 480 ? 3 : 2.4;
      let seed = 97;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      const grains: Grain[] = [];
      const rtl = document.documentElement.dir === "rtl";
      for (let y = 0; y < sampleH; y += step) {
        for (let x = 0; x < sampleW; x += step) {
          const alpha = data[(Math.floor(y) * sampleW + Math.floor(x)) * 4 + 3];
          if (alpha < 128) continue;
          // the spray's dense corner is bottom-end, like on the box
          const spread = rand() ** 0.7;
          const cornerX = rtl ? 0 : width + padX * 2;
          grains.push({
            sx: cornerX + (rtl ? 1 : -1) * spread * (width + padX) * rand(),
            sy: height + padY * 2 - spread * (height + padY) * rand(),
            tx: padX + x + (rand() - 0.5) * 0.8,
            ty: padY + y + (rand() - 0.5) * 0.8,
            // grains nearer the start edge land first — the mark writes itself
            delay: (rtl ? 1 - x / sampleW : x / sampleW) * 0.45 + rand() * 0.18,
            r: 0.55 + rand() * 0.75,
            tone: Math.floor(rand() * TONES.length),
          });
        }
      }

      const start = performance.now();
      const draw = (now: number) => {
        if (cancelled) return;
        const elapsed = (now - start) / DURATION;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let settled = true;
        for (const g of grains) {
          const local = Math.min(1, Math.max(0, (elapsed - g.delay) / (1 - 0.63)));
          if (local < 1) settled = false;
          const e = easeOutQuart(local);
          // a slight arc on the way in, like dust caught in a draught
          const arc = Math.sin(local * Math.PI) * 18;
          const x = g.sx + (g.tx - g.sx) * e;
          const y = g.sy + (g.ty - g.sy) * e - arc;
          ctx.fillStyle = TONES[g.tone];
          ctx.globalAlpha = 0.25 + 0.75 * Math.min(1, local * 2.2);
          ctx.beginPath();
          ctx.arc(x, y, g.r * (1.6 - 0.6 * e), 0, Math.PI * 2);
          ctx.fill();
        }
        if (settled) {
          window.clearTimeout(failSafe);
          setPhase("done");
          return;
        }
        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
    };
    image.onerror = () => setPhase("done");

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(failSafe);
    };
  }, [splashOpen, phase]);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <MorivaLogo
        title={title}
        className={cn(
          "w-full transition-opacity duration-700",
          phase === "done" ? "opacity-100" : "opacity-0",
        )}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-x-[35%] -inset-y-[120%] h-[340%] w-[170%] transition-opacity duration-700",
          phase === "done" ? "opacity-0" : "opacity-100",
        )}
      />
    </div>
  );
}
