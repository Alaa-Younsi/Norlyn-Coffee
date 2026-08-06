import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { mascotFrame, type MascotEmotion } from "@/lib/mascot";
import { cn } from "@/lib/utils";

/**
 * The character itself.
 *
 * Every frame of the `palette` is rendered stacked and only the active one is
 * opaque. That is the whole trick: swapping a single <img src> would blank the
 * cup for as long as the next file takes to arrive, whereas stacked frames
 * cross-dissolve instantly and the body — identical in all nine drawings —
 * never moves. The palette is the caller's promise about which faces this
 * mascot can ever wear, so nothing unused is downloaded.
 *
 * On each change the cup pops: a real character reacts with its whole body,
 * not just its eyebrows.
 */
export function Mascot({
  emotion,
  palette,
  size = 96,
  sizeClassName,
  className,
  frameSize = "md",
  float = true,
}: {
  emotion: MascotEmotion;
  /** every emotion this instance can show — all of them get preloaded */
  palette: MascotEmotion[];
  /** rendered box in px, and the intrinsic hint on every frame */
  size?: number;
  /** responsive alternative to `size` for the box (e.g. "h-16 w-16 sm:h-24 sm:w-24") */
  sizeClassName?: string;
  className?: string;
  frameSize?: "md" | "lg";
  /** the idle bob; turn it off where the mascot sits inside moving content */
  float?: boolean;
}) {
  const controls = useAnimationControls();
  const frames = palette.includes(emotion) ? palette : [...palette, emotion];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void controls.start({
      scale: [1, 1.12, 0.97, 1],
      rotate: [0, -5, 3, 0],
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], times: [0, 0.3, 0.6, 1] },
    });
  }, [emotion, controls]);

  return (
    <motion.div
      animate={controls}
      className={cn("relative shrink-0", float && "fx-float", sizeClassName, className)}
      style={sizeClassName ? undefined : { width: size, height: size }}
      aria-hidden
    >
      {frames.map((frame) => (
        <img
          key={frame}
          src={mascotFrame(frame, frameSize)}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className={cn(
            "absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-out",
            frame === emotion ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </motion.div>
  );
}
