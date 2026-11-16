import { useEffect, useId, useRef } from "react";
import type { CSSProperties } from "react";
import { gsap } from "@/lib/gsap";
import { CoffeeRing } from "./CoffeeRing";
import { cn } from "@/lib/utils";

/**
 * Product-page backdrop: shaded coffee beans, cup-ring stains and a line-art
 * coffee branch filling the empty gutters around the stage and the details.
 *
 * Two motions on separate elements so they never fight over `transform`:
 * the outer layer travels with the page scroll (each at its own depth, so
 * near beans outrun far ones), the inner one keeps the idle CSS bob.
 * Pointer-events-none and aria-hidden throughout — it's decoration.
 */

type Kind = "bean" | "ring" | "branch";

interface Piece {
  kind: Kind;
  /** inline-start / top, in % of the page */
  x: number;
  y: number;
  /** width in px */
  size: number;
  rot: number;
  /** px travelled over the whole page scroll (negative = rises faster) */
  depth: number;
  /** extra degrees turned over the whole page scroll */
  spin: number;
  opacity: number;
  /** depth-of-field blur, px */
  blur?: number;
  /** hidden on phones, where the gutters don't exist */
  wide?: boolean;
}

const PIECES: Piece[] = [
  // cup rings: big, faint, slow
  { kind: "ring", x: 62, y: 1, size: 560, rot: 20, depth: -180, spin: 50, opacity: 0.07, wide: true },
  { kind: "ring", x: -10, y: 38, size: 420, rot: 140, depth: -320, spin: -40, opacity: 0.08 },
  { kind: "ring", x: 70, y: 74, size: 360, rot: 260, depth: -220, spin: 35, opacity: 0.06, wide: true },
  // line-art branch on the right edge
  { kind: "branch", x: 88, y: 22, size: 210, rot: -8, depth: -260, spin: 14, opacity: 0.22, wide: true },
  { kind: "branch", x: -2, y: 60, size: 180, rot: 168, depth: -200, spin: -12, opacity: 0.16 },
  // beans: near (big, blurred, fast) and far (small, sharp, slow)
  { kind: "bean", x: 93, y: 5, size: 74, rot: 28, depth: -520, spin: 90, opacity: 0.55, blur: 3 },
  { kind: "bean", x: 96, y: 15, size: 40, rot: -40, depth: -160, spin: -60, opacity: 0.5 },
  { kind: "bean", x: 2.5, y: 12, size: 52, rot: 70, depth: -300, spin: 120, opacity: 0.5 },
  { kind: "bean", x: 97, y: 27, size: 32, rot: 10, depth: -120, spin: 45, opacity: 0.4 },
  { kind: "bean", x: 91, y: 36, size: 64, rot: -110, depth: -420, spin: -100, opacity: 0.5, blur: 1.5 },
  { kind: "bean", x: 4, y: 30, size: 92, rot: 150, depth: -640, spin: 70, opacity: 0.4, blur: 4, wide: true },
  { kind: "bean", x: 1.5, y: 45, size: 38, rot: 5, depth: -180, spin: -80, opacity: 0.45 },
  { kind: "bean", x: 94, y: 52, size: 46, rot: 60, depth: -260, spin: 110, opacity: 0.45 },
  { kind: "bean", x: 46, y: 47, size: 30, rot: -20, depth: -240, spin: 60, opacity: 0.3, wide: true },
  { kind: "bean", x: 5, y: 66, size: 60, rot: -70, depth: -380, spin: -90, opacity: 0.45 },
  { kind: "bean", x: 92, y: 68, size: 80, rot: 200, depth: -560, spin: 80, opacity: 0.4, blur: 3, wide: true },
  { kind: "bean", x: 30, y: 82, size: 26, rot: 100, depth: -200, spin: -70, opacity: 0.35, wide: true },
  { kind: "bean", x: 95, y: 88, size: 44, rot: -150, depth: -300, spin: 100, opacity: 0.45 },
  { kind: "bean", x: 3, y: 92, size: 50, rot: 35, depth: -340, spin: -60, opacity: 0.4 },
];

export function ProductBackdrop({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // progress across the whole page, so it stays right when the gallery,
    // films or related products change the page height after mount
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => {
        gsap.to(el, {
          y: Number(el.dataset.depth),
          rotation: Number(el.dataset.spin),
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: 0,
            end: "max",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {PIECES.map((p, i) => (
        <div
          key={i}
          data-depth={p.depth}
          data-spin={p.spin}
          className={cn("absolute will-change-transform", p.wide && "max-md:hidden")}
          style={{ insetInlineStart: `${p.x}%`, top: `${p.y}%`, width: p.size, opacity: p.opacity }}
        >
          <div
            className={cn(p.kind === "bean" && "fx-float", p.kind === "ring" && "relative aspect-square")}
            style={
              {
                "--drift-rot": `${p.rot}deg`,
                "--drift-dur": `${6 + (i % 5)}s`,
                transform: p.kind === "bean" ? undefined : `rotate(${p.rot}deg)`,
                animationDelay: `${(i % 4) * 0.9}s`,
                filter: p.blur ? `blur(${p.blur}px)` : undefined,
              } as CSSProperties
            }
          >
            {p.kind === "bean" && <ShadedBean />}
            {p.kind === "ring" && <CoffeeRing className="inset-0 h-full w-full" />}
            {p.kind === "branch" && <CoffeeBranch />}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A roasted bean with a lit shoulder and a dark crease — reads as an object, not an icon. */
function ShadedBean() {
  const id = useId();
  return (
    <svg viewBox="0 0 48 64" className="block h-auto w-full drop-shadow-[0_6px_10px_rgb(0_0_0/0.45)]">
      <defs>
        <radialGradient id={`${id}b`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#8a5a34" />
          <stop offset="0.45" stopColor="#5a3820" />
          <stop offset="1" stopColor="#24150b" />
        </radialGradient>
      </defs>
      <ellipse cx="24" cy="32" rx="21" ry="29" fill={`url(#${id}b)`} />
      <path d="M24 5 C 12 20, 36 40, 24 59" fill="none" stroke="#160c06" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M22 7 C 11 21, 34 40, 22 57" fill="none" stroke="#b07a4a" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="15" cy="20" rx="4" ry="8" fill="#e8c48f" fillOpacity="0.16" transform="rotate(-18 15 20)" />
    </svg>
  );
}

/** Line-art coffee branch: leaves along a curved stem, cherries at the nodes. */
function CoffeeBranch() {
  return (
    <svg viewBox="0 0 120 260" className="block h-auto w-full text-brand" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M60 255 C 52 200, 70 150, 58 100 S 62 30, 70 4" />
      {/* leaves: an almond outline with a midrib */}
      {[
        { x: 57, y: 210, r: -55 },
        { x: 62, y: 172, r: 50 },
        { x: 58, y: 128, r: -60 },
        { x: 60, y: 88, r: 55 },
        { x: 63, y: 50, r: -50 },
        { x: 67, y: 20, r: 45 },
      ].map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r})`}>
          <path d="M0 0 C 10 -10, 34 -10, 44 0 C 34 10, 10 10, 0 0 Z" />
          <path d="M3 0 L 40 0" strokeWidth="0.7" />
        </g>
      ))}
      {[
        [52, 192],
        [47, 198],
        [68, 150],
        [73, 156],
        [51, 108],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5" />
      ))}
    </svg>
  );
}
