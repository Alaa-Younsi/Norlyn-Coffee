import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * A picture that opens as it arrives: the frame wipes open from the bottom
 * (clip-path) while the image inside settles from a slow push-in, and then
 * keeps a gentle parallax for as long as it is on screen. Wrap any <img>,
 * <video> or slot in it; the child should fill the frame.
 *
 * Everything is transform / clip-path, so it never lays out. Reduced motion:
 * the picture is simply there.
 */
export function ClipReveal({
  children,
  className,
  from = "bottom",
  parallax = 40,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  from?: "bottom" | "start";
  /** px of drift across the frame's pass through the viewport; 0 = none */
  parallax?: number;
  delay?: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rtl = document.documentElement.dir === "rtl";
    const closed =
      from === "bottom" ? "inset(100% 0% 0% 0%)" : rtl ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";

    const ctx = gsap.context(() => {
      gsap.fromTo(
        frame,
        { clipPath: closed },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.4,
          delay,
          ease: "expo.inOut",
          scrollTrigger: { trigger: frame, start: "top 90%", once: true },
        },
      );
      gsap.fromTo(
        inner,
        { scale: 1.28 },
        {
          scale: 1.06,
          duration: 1.8,
          delay,
          ease: "expo.out",
          scrollTrigger: { trigger: frame, start: "top 90%", once: true },
        },
      );
      if (parallax) {
        gsap.fromTo(
          inner,
          { yPercent: -parallax / 20 },
          {
            yPercent: parallax / 20,
            ease: "none",
            scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      }
    }, frame);
    return () => ctx.revert();
  }, [from, parallax, delay]);

  return (
    <div ref={frameRef} className={cn("relative overflow-hidden", className)}>
      <div ref={innerRef} className="absolute inset-0 will-change-transform [&>*]:h-full [&>*]:w-full">
        {children}
      </div>
    </div>
  );
}
