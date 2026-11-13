import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * The ritual, as a film you scroll.
 *
 * The client's own footage (Outro/IMG_2351: a slow push across the table while
 * the espresso pours and the crema builds) was stabilised (ffmpeg vidstab, two
 * passes, smoothing 200 — residual jitter 0.3 px vs 2.2 px in the source,
 * measured by phase correlation), lightly graded, and cut into 120 still
 * frames — 1600×900 for desktop, a native 608×1080 crop on the machine for
 * phones (public/sequence/pour/{d,m}). The
 * section pins for several screens and the scroll position picks the frame, so
 * the visitor drives the pour with their own thumb, forwards and back.
 *
 * Loading is progressive and late: nothing is fetched until the section is
 * within a couple of screens, then a coarse pass (every 8th frame) so the
 * scrub works at once, then the gaps fill in. The canvas always draws the
 * nearest frame it actually has, so a slow connection gets a choppier film,
 * never a blank one.
 */

const FRAMES = 120;
const FILL_ORDER = [8, 4, 2, 1];

function frameUrl(set: "d" | "m", index: number): string {
  return `/sequence/pour/${set}/${String(index + 1).padStart(3, "0")}.webp`;
}

/** where each chapter caption owns the screen, as fractions of the scrub */
const CHAPTERS = [
  { from: 0.04, to: 0.3, key: "gallery.caption2" },
  { from: 0.38, to: 0.66, key: "gallery.caption1" },
  { from: 0.74, to: 0.97, key: "gallery.caption3" },
] as const;

export function CinematicPour() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  // under reduced motion there is no scrub: the one still shows the pour's caption
  const [chapter, setChapter] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : -1,
  );

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const set: "d" | "m" = window.matchMedia("(max-width: 767px)").matches ? "m" : "d";
    /*
      Two tiers of frame storage.

      `blobs` — every frame as its compressed WebP (≈25–70 KB each), fetched
      once. Cheap to hold all 120.

      `bitmaps` — a small WINDOW of fully decoded ImageBitmaps around the frame
      on screen. They are decoded with createImageBitmap(blob), which runs OFF
      the main thread, and a decoded bitmap draws for almost nothing.

      Why not just draw <img> elements: a canvas drawImage of an HTMLImageElement
      decodes it lazily, ON the main thread, at draw time — even after
      img.decode(). A trace of the phone scroll showed 3.2 s of
      "Decode LazyPixelRef" on the main thread in an 8 s scrub: that was the
      stutter. Why not decode all 120: 120 × 608×1080×4 bytes is ~315 MB on a
      phone. The window keeps it to a couple dozen frames.
    */
    const blobs: Array<Blob | null> = new Array(FRAMES).fill(null);
    const bitmaps = new Map<number, ImageBitmap>();
    const decoding = new Set<number>();
    const WINDOW = set === "m" ? 10 : 7;
    let current = 0;
    let drawn = -1;
    let started = false;
    let disposed = false;

    const size = () => {
      // phones: 1.5× is already past the frames' own resolution (608px wide
      // drawn across ~390 CSS px) — a 2× canvas only adds resampling cost
      const dpr = Math.min(set === "m" ? 1.5 : 2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      drawn = -1;
      draw(current);
    };

    // the nearest DECODED frame — never a blank canvas, never a main-thread decode
    const nearest = (index: number): ImageBitmap | null => {
      for (let d = 0; d <= WINDOW * 2; d++) {
        const back = bitmaps.get(index - d);
        if (back) return back;
        const fwd = bitmaps.get(index + d);
        if (fwd) return fwd;
      }
      return null;
    };

    function draw(index: number) {
      const bmp = nearest(index);
      if (!bmp || !ctx || !canvas) return;
      // object-fit: cover, by hand
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = set === "m" ? "medium" : "high";
      const scale = Math.max(canvas.width / bmp.width, canvas.height / bmp.height);
      const w = bmp.width * scale;
      const h = bmp.height * scale;
      ctx.drawImage(bmp, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      drawn = index;
    }

    // decode the window around `center`, free what has drifted far away
    const ensureWindow = (center: number) => {
      for (const [i, bmp] of bitmaps) {
        if (Math.abs(i - center) > WINDOW * 2) {
          bmp.close();
          bitmaps.delete(i);
        }
      }
      for (let d = 0; d <= WINDOW; d++) {
        for (const i of d === 0 ? [center] : [center + d, center - d]) {
          const blob = blobs[i];
          if (i < 0 || i >= FRAMES || !blob || bitmaps.has(i) || decoding.has(i)) continue;
          decoding.add(i);
          createImageBitmap(blob)
            .then((bmp) => {
              decoding.delete(i);
              if (disposed || Math.abs(i - current) > WINDOW * 2) {
                bmp.close();
                return;
              }
              bitmaps.set(i, bmp);
              // a frame closer to the one we want than what's on screen → show it
              if (Math.abs(i - current) < Math.abs(drawn - current) || drawn < 0) draw(current);
            })
            .catch(() => decoding.delete(i));
        }
      }
    };

    const load = async (index: number) => {
      if (blobs[index] || disposed) return;
      try {
        const res = await fetch(frameUrl(set, index));
        if (!res.ok) return;
        blobs[index] = await res.blob();
        if (Math.abs(index - current) <= WINDOW) ensureWindow(current);
      } catch {
        // a missing frame is simply skipped — its neighbours stand in
      }
    };

    const start = async () => {
      if (started) return;
      started = true;
      if (reduced) {
        // one still from the heart of the pour, no scrub
        current = 60;
        await load(60);
        ensureWindow(60);
        return;
      }
      for (const step of FILL_ORDER) {
        const batch: Promise<void>[] = [];
        for (let i = 0; i < FRAMES; i += step) batch.push(load(i));
        await Promise.all(batch);
        if (disposed) return;
      }
    };

    // fetch only once the film is close
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void start();
          io.disconnect();
        }
      },
      { rootMargin: "200% 0px" },
    );
    io.observe(section);

    size();
    window.addEventListener("resize", size);

    let trigger: ScrollTrigger | null = null;
    if (!reduced) {
      const state = { frame: 0 };
      const tween = gsap.to(state, {
        frame: FRAMES - 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
        },
        onUpdate: () => {
          const index = Math.round(state.frame);
          const progress = state.frame / (FRAMES - 1);
          if (index !== current) {
            current = index;
            ensureWindow(index);
            draw(index);
          }
          if (counterRef.current) counterRef.current.textContent = String(index + 1).padStart(3, "0");
          if (barRef.current) barRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
          const next = CHAPTERS.findIndex((c) => progress >= c.from && progress <= c.to);
          setChapter((prev) => (prev === next ? prev : next));
        },
      });
      trigger = tween.scrollTrigger ?? null;
    }

    return () => {
      disposed = true;
      for (const bmp of bitmaps.values()) bmp.close();
      bitmaps.clear();
      io.disconnect();
      window.removeEventListener("resize", size);
      trigger?.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label={t("gallery.title")}
      // the scroll room the film plays out over; one screen of it is the pin
      className="relative h-[460vh] motion-reduce:h-screen"
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-shade text-on-shade">
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
        {/* letterbox + floor shade so type always reads on the footage */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgb(var(--c-shade)/0.75)_0%,transparent_22%,transparent_55%,rgb(var(--c-shade)/0.9)_100%)]"
        />

        {/* the title rides the top of the frame for the whole film */}
        <div className="absolute inset-x-0 top-24 mx-auto flex max-w-7xl items-start justify-between gap-6 px-6 sm:top-28">
          <h2 className="font-display text-3xl font-medium tracking-[-0.02em] sm:text-5xl">
            {t("gallery.title")}
          </h2>
          {/* a film counter: frame / total, and the reel's progress */}
          <div className="hidden text-end font-mono text-xs tracking-[0.2em] text-on-shade/70 sm:block" aria-hidden>
            <span ref={counterRef}>001</span>
            <span className="text-on-shade/40"> / {FRAMES}</span>
            <span className="mt-2 block h-px w-40 bg-on-shade/15">
              <span ref={barRef} className="block h-full w-full origin-left scale-x-0 bg-gold-hi rtl:origin-right" />
            </span>
          </div>
        </div>

        {/* chapter captions — each one owns a stretch of the pour */}
        <div className="absolute inset-x-0 bottom-16 mx-auto max-w-7xl px-6 sm:bottom-20">
          <div className="relative h-40 sm:h-48">
            {CHAPTERS.map((c, i) => (
              <p
                key={c.key}
                aria-hidden={chapter !== i}
                className={cn(
                  "absolute bottom-0 max-w-3xl font-display text-4xl leading-[1.05] italic tracking-[-0.01em] transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(.22,1,.36,1)] sm:text-6xl lg:text-7xl",
                  chapter === i
                    ? "translate-y-0 opacity-100 blur-0"
                    : "pointer-events-none translate-y-10 opacity-0 blur-sm",
                )}
              >
                <span className="me-4 align-top font-sans text-xs not-italic tabular-nums tracking-[0.3em] text-gold-hi sm:text-sm">
                  0{i + 1}
                </span>
                {t(c.key)}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
