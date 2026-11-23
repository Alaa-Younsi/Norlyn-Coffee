import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { CoffeeBeanIcon } from "@/components/effects/CoffeeBeanIcon";
import { safeUrl } from "@/lib/pageBuilder/defaults";
import type { BgFx, Media, MediaFx } from "@/lib/pageBuilder/types";
import { cn } from "@/lib/utils";
import { EASE } from "./motionConfig";

// ------------------------------------------------------------------ media
/** An image or a silent looping video, with an optional motion treatment. */
export function MediaView({
  media,
  fx = "none",
  className,
  fit = "cover",
  controls = false,
  autoplay = true,
  loop = true,
}: {
  media: Media | undefined;
  fx?: MediaFx;
  className?: string;
  fit?: "cover" | "contain";
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
}) {
  const reduced = useReducedMotion();
  const url = safeUrl(media?.url);
  if (!media || !url) {
    return <div className={cn("bg-[var(--pb-surface)]", className)} />;
  }

  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  const inner =
    media.kind === "video" ? (
      <video
        src={url}
        poster={safeUrl(media.poster) || undefined}
        className={cn("h-full w-full", fitClass)}
        autoPlay={autoplay && !reduced}
        muted
        loop={loop}
        playsInline
        controls={controls}
        preload="metadata"
      />
    ) : (
      <img src={url} alt={media.alt ?? ""} loading="lazy" decoding="async" className={cn("h-full w-full", fitClass)} />
    );

  if (reduced || fx === "none") {
    return <div className={cn("overflow-hidden", className)}>{inner}</div>;
  }

  if (fx === "parallax") return <ParallaxBox className={className}>{inner}</ParallaxBox>;
  if (fx === "kenburns") {
    return (
      <div className={cn("overflow-hidden", className)}>
        <div className="pb-kenburns h-full w-full">{inner}</div>
      </div>
    );
  }
  if (fx === "float") {
    return (
      <div className={cn("overflow-visible", className)}>
        <div className="fx-float h-full w-full [--drift-y:-18px]">{inner}</div>
      </div>
    );
  }
  return <TiltBox className={className}>{inner}</TiltBox>;
}

function ParallaxBox({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);
  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div className="h-[118%] w-full -translate-y-[8%]" style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}

/** leans toward a mouse pointer */
function TiltBox({ className, children }: { className?: string; children: ReactNode }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 140, damping: 16 });
  const sry = useSpring(ry, { stiffness: 140, damping: 16 });
  return (
    <div
      className={cn("[perspective:1000px]", className)}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const b = e.currentTarget.getBoundingClientRect();
        ry.set(((e.clientX - b.left) / b.width - 0.5) * 16);
        rx.set(-((e.clientY - b.top) / b.height - 0.5) * 16);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      <motion.div className="h-full w-full overflow-hidden rounded-[inherit]" style={{ rotateX: srx, rotateY: sry }}>
        {children}
      </motion.div>
    </div>
  );
}

// ------------------------------------------------------------- title fx
export type TitleFx = "none" | "kinetic" | "gradient" | "shimmer" | "typewriter" | "glow";

export function FxTitle({ text, fx, className }: { text: string; fx: TitleFx; className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (fx !== "typewriter" || !inView || reduced) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(i);
      if (i >= text.length) window.clearInterval(id);
    }, 45);
    return () => window.clearInterval(id);
  }, [fx, inView, reduced, text]);

  if (reduced || fx === "none") return <span className={className}>{text}</span>;

  if (fx === "kinetic") {
    const words = text.split(" ");
    let n = 0;
    return (
      <span ref={ref} className={cn("inline", className)} aria-label={text}>
        {words.map((word, w) => (
          <span key={w} className="inline-block overflow-hidden pb-[0.12em] align-bottom" aria-hidden>
            {[...word].map((ch) => {
              const i = n++;
              return (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ y: "110%", rotate: 6 }}
                  animate={inView ? { y: 0, rotate: 0 } : undefined}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.028, ease: EASE }}
                >
                  {ch}
                </motion.span>
              );
            })}
            {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        ))}
      </span>
    );
  }
  if (fx === "typewriter") {
    return (
      <span ref={ref} className={className} aria-label={text}>
        <span aria-hidden>{inView ? text.slice(0, typed) : ""}</span>
        <span aria-hidden className="pb-caret ms-0.5 inline-block w-[0.06em] self-stretch bg-[var(--pb-accent)]">
          &nbsp;
        </span>
      </span>
    );
  }
  if (fx === "gradient") {
    return (
      <span
        className={cn(
          "pb-shimmer bg-[linear-gradient(100deg,var(--pb-text),var(--pb-accent)_35%,var(--pb-accent2)_55%,var(--pb-text))] bg-[length:250%_100%] bg-clip-text text-transparent",
          className,
        )}
      >
        {text}
      </span>
    );
  }
  if (fx === "shimmer") {
    return (
      <span
        className={cn(
          "pb-shimmer bg-[linear-gradient(100deg,var(--pb-text)_40%,var(--pb-accent2)_50%,var(--pb-text)_60%)] bg-[length:300%_100%] bg-clip-text text-transparent",
          className,
        )}
      >
        {text}
      </span>
    );
  }
  return (
    <span className={cn("[text-shadow:0_0_28px_color-mix(in_srgb,var(--pb-accent)_70%,transparent)]", className)}>
      {text}
    </span>
  );
}

// ------------------------------------------------------------ count up
export function CountUp({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduced]);
  return (
    <span ref={ref} dir="ltr" className="tabular-nums">
      {prefix}
      {new Intl.NumberFormat("fr-FR").format(shown)}
      {suffix}
    </span>
  );
}

// -------------------------------------------------------- page chrome fx
export function BackgroundFx({ fx }: { fx: BgFx }) {
  if (fx === "none") return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {fx === "beans" &&
        BEANS.map((b, i) => (
          <CoffeeBeanIcon
            key={i}
            className="fx-float absolute text-[var(--pb-accent)]"
            style={
              {
                insetInlineStart: `${b.x}%`,
                top: `${b.y}%`,
                width: b.s,
                opacity: b.o,
                "--drift-rot": `${b.r}deg`,
                "--drift-dur": `${6 + (i % 5)}s`,
                filter: b.blur ? `blur(${b.blur}px)` : undefined,
              } as CSSProperties
            }
          />
        ))}
      {fx === "orbs" && (
        <>
          <div className="pb-orb absolute -top-40 start-[-10%] h-[38rem] w-[38rem] rounded-full bg-[var(--pb-accent)] opacity-[0.16] blur-[120px]" />
          <div className="pb-orb pb-orb-2 absolute top-[35%] end-[-15%] h-[32rem] w-[32rem] rounded-full bg-[var(--pb-accent2)] opacity-[0.12] blur-[120px]" />
          <div className="pb-orb pb-orb-3 absolute bottom-[-10%] start-[25%] h-[28rem] w-[28rem] rounded-full bg-[var(--pb-accent)] opacity-[0.1] blur-[110px]" />
        </>
      )}
      {fx === "aurora" && (
        <div className="pb-aurora absolute inset-x-[-20%] top-[-30%] h-[80rem] bg-[conic-gradient(from_90deg_at_50%_50%,transparent,color-mix(in_srgb,var(--pb-accent)_35%,transparent),transparent_40%,color-mix(in_srgb,var(--pb-accent2)_30%,transparent),transparent_70%)] opacity-50 blur-[90px]" />
      )}
      {fx === "grid" && (
        <div className="absolute inset-0 bg-[linear-gradient(color-mix(in_srgb,var(--pb-text)_7%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--pb-text)_7%,transparent)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      )}
      {fx === "rings" &&
        [12, 46, 78].map((top, i) => (
          <div
            key={top}
            className={cn(
              "pb-spin absolute aspect-square rounded-full border border-dashed border-[color-mix(in_srgb,var(--pb-accent)_22%,transparent)]",
              i === 1 ? "end-[-12%] w-[34rem]" : "start-[-10%] w-[26rem]",
            )}
            style={{ top: `${top}%`, animationDuration: `${60 + i * 25}s` }}
          />
        ))}
      {fx === "spotlight" && (
        <div className="absolute inset-x-0 top-0 h-[60rem] bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_srgb,var(--pb-accent)_22%,transparent),transparent_70%)]" />
      )}
    </div>
  );
}

const BEANS = [
  { x: 4, y: 3, s: 34, r: 30, o: 0.35 },
  { x: 92, y: 6, s: 58, r: -20, o: 0.3, blur: 2 },
  { x: 88, y: 22, s: 26, r: 80, o: 0.4 },
  { x: 2, y: 30, s: 70, r: 140, o: 0.22, blur: 3 },
  { x: 95, y: 41, s: 32, r: -60, o: 0.35 },
  { x: 6, y: 55, s: 28, r: 15, o: 0.35 },
  { x: 90, y: 63, s: 64, r: 200, o: 0.25, blur: 2 },
  { x: 3, y: 76, s: 40, r: -110, o: 0.3 },
  { x: 94, y: 86, s: 30, r: 60, o: 0.35 },
  { x: 8, y: 94, s: 52, r: 100, o: 0.25, blur: 2 },
];

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !ref.current) return;
      const b = host.getBoundingClientRect();
      ref.current.style.setProperty("--gx", `${e.clientX - b.left}px`);
      ref.current.style.setProperty("--gy", `${e.clientY - b.top}px`);
      ref.current.style.opacity = "1";
    };
    host.addEventListener("pointermove", move);
    return () => host.removeEventListener("pointermove", move);
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 [background:radial-gradient(420px_circle_at_var(--gx)_var(--gy),color-mix(in_srgb,var(--pb-accent)_14%,transparent),transparent_70%)]"
    />
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-[0%] bg-[linear-gradient(90deg,var(--pb-accent),var(--pb-accent2))] rtl:origin-[100%]"
      style={{ scaleX }}
    />
  );
}

export function Grain() {
  return <div aria-hidden className="fx-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.09] mix-blend-overlay" />;
}

// ---------------------------------------------------------------- marquee
export function MarqueeTrack({
  children,
  speed,
  reverse,
  className,
}: {
  children: ReactNode;
  speed: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]", className)}>
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className={cn("pb-marquee flex shrink-0 items-center group-hover:[animation-play-state:paused]", reverse && "pb-marquee-rev")}
          style={{ animationDuration: `${Math.max(6, speed)}s` }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
