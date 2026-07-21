import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useLanguage } from "@/i18n/LanguageProvider";

/**
 * Gold hairline pinned above the header that fills with reading progress —
 * a constant, quiet answer to "how much story is left". Writes transform
 * directly from the ScrollTrigger update, no React re-renders.
 */
export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);
  const { dir } = useLanguage();

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const trigger = ScrollTrigger.create({
      start: 0,
      end: () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
      onUpdate: (self) => {
        el.style.transform = `scaleX(${self.progress.toFixed(4)})`;
      },
    });
    return () => trigger.kill();
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] bg-gradient-to-r from-brand via-gold-hi to-brand"
      style={{
        transform: "scaleX(0)",
        transformOrigin: dir === "rtl" ? "100% 50%" : "0% 50%",
      }}
    />
  );
}
