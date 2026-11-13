import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MorivaLogo } from "@/components/brand/Logos";

const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * The curtain between pages. On every navigation (not the first load — the
 * splash owns that) an espresso panel is already covering the new page, the
 * gold Moriva mark sits in its centre, and the panel lifts away upward while
 * the mark rises out with it. Reveal-only: the next page renders at once
 * underneath, so a transition never delays navigation.
 *
 * Keyed on the router's per-navigation `location.key`, so there is no effect
 * and no state to sync: a curtain exists for every key after the first one
 * until its own animation reports that it finished.
 *
 * Reduced motion and /admin: no curtain.
 */
export function PageTransition() {
  const location = useLocation();
  // the key of the page the visit started on — the splash covers that one
  const [initialKey] = useState(location.key);
  const [doneFor, setDoneFor] = useState<string | null>(null);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const show =
    !reduced &&
    !location.pathname.startsWith("/admin") &&
    location.key !== initialKey &&
    doneFor !== location.key;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={location.key}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-shade"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
          onAnimationComplete={() => setDoneFor(location.key)}
        >
          <motion.div
            initial={{ y: 0, scale: 1 }}
            animate={{ y: -60, scale: 0.92 }}
            transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
          >
            <MorivaLogo className="w-48 text-on-shade sm:w-64" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
