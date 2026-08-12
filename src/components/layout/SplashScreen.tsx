import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { lockScroll, resetScroll, unlockScroll } from "@/lib/lenis";
import { ScrollTrigger } from "@/lib/gsap";
import { useSplashStore, useSplashHold } from "@/store/splash";

/**
 * The Norlyn curtain.
 *
 * It is up on the first paint and comes down when the page underneath is
 * actually finished — see `store/splash.ts` for what "finished" is holding on.
 * Two numbers bracket that wait:
 *
 *   MIN  — a curtain that lifts in 80 ms is not a curtain, it is a flash. On a
 *          warm cache everything below is ready before the first frame, so
 *          without a floor this would strobe on every visit to the home page.
 *   MAX  — nothing here is allowed to cost someone the site. A hung font
 *          request, a GPU that refuses a context, a catalogue that never
 *          answers: at the cap the curtain lifts anyway and the visitor gets
 *          whatever did load, which is always more than a locked screen.
 *
 * Re-entering the landing raises it again with the shorter floor. The heavy
 * work is cached by then, but the canvas genuinely does remount and redraw, and
 * covering that is the whole point.
 */
const MIN_BOOT_MS = 950;
const MIN_REENTRY_MS = 420;
const MAX_MS = 6000;

/** Matches the pre-React shell in index.html, so the handoff has no seam. */
const LOGO_WIDTH = 190;

export function SplashScreen() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const reducedMotion = useReducedMotion();
  const open = useSplashStore((s) => s.open);
  const holds = useSplashStore((s) => s.holds);

  // First mount is the cold boot; every later raise is a re-entry. A ref
  // rather than state: it is read by the effect that arms the timers, on the
  // render that arming causes, so putting it through a setState would only add
  // a round trip to a value that is already settled by then.
  const booted = useRef(false);
  const minMs = useRef(MIN_BOOT_MS);

  /*
    The webfont is a layout input, not a paint detail. Fraunces has different
    metrics from the Georgia it falls back to, so every heading, every line
    box and therefore every section's offsetTop changes the moment it swaps —
    and the scroll choreography is nothing but a set of measured offsets.
    Waiting for it here is what makes ScrollTrigger's refresh below meaningful.
  */
  const [fontsReady, setFontsReady] = useState(() => !document.fonts);
  useEffect(() => {
    if (!document.fonts) return;
    let alive = true;
    void document.fonts.ready.then(() => {
      if (alive) setFontsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  useSplashHold("fonts", !fontsReady);

  // ------------------------------------------------------------ re-entry
  // Landing is the only route with anything to prepare; the rest are ordinary
  // pages and a curtain over them would just be a delay someone has to sit
  // through. `<Landing>` registers its own hold, so all this does is raise.
  useEffect(() => {
    if (!booted.current) {
      booted.current = true;
      return;
    }
    if (pathname !== "/") return;
    minMs.current = MIN_REENTRY_MS;
    useSplashStore.getState().arm();
  }, [pathname]);

  // ------------------------------------------------------------- lifting
  /*
    One effect, driven off the store's own subscription rather than off React
    state. "Every hold is clear AND the floor has passed" is a race between an
    external event stream and a clock, and mirroring either into component
    state would only produce a render whose entire job is to schedule the next
    render. So the effect subscribes, re-checks on each change, and re-arms
    itself for whatever the remaining wait is.
  */
  useEffect(() => {
    if (!open) return;
    const floor = minMs.current;
    const startedAt = Date.now();
    let retry: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      const state = useSplashStore.getState();
      if (!state.open) return;
      // still working — the next store change will call this again
      if (state.holds.length > 0) return;
      const remaining = floor - (Date.now() - startedAt);
      if (remaining > 0) {
        clearTimeout(retry);
        retry = setTimeout(check, remaining);
        return;
      }
      state.lift();
    };

    const unsubscribe = useSplashStore.subscribe(check);
    const ceiling = setTimeout(() => useSplashStore.getState().lift(), MAX_MS);
    check();

    return () => {
      unsubscribe();
      clearTimeout(retry);
      clearTimeout(ceiling);
    };
  }, [open]);

  const ready = holds.length === 0;

  // ------------------------------------------------- what the page may do
  /*
    Scrolling behind the curtain is the one thing that would defeat it. The
    landing's acts are keyed to absolute scroll offsets, so a visitor who
    flicks the wheel while the mark is still up arrives at a page already
    playing act two — the exact "it loaded wrong" the splash exists to prevent.

    It takes both locks, because they stop different things. `overflow: hidden`
    stops the BROWSER scrolling the document (touch, keyboard, scrollbar).
    `lockScroll()` stops LENIS, which does not scroll the document at all — it
    banks wheel deltas into a target of its own and writes the position every
    frame, so the overflow rule simply does not apply to it. See lib/lenis.ts
    for why that lock lives there rather than being called on the instance here.
  */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    lockScroll();
    // Both ends of the curtain assert the top, because they answer different
    // things. This one clears whatever the page arrived already scrolled to —
    // an in-app browser that restores anyway, a fragment in the URL — before
    // it can be painted behind the splash. The one in the cleanup answers
    // anything that moved WHILE the curtain was up.
    resetScroll();
    return () => {
      root.style.overflow = previous;
      // Top first, and while Lenis is still stopped so it cannot write its own
      // value back over ours on the next frame. The curtain only ever goes up
      // on a fresh arrival at the landing, so the top is always where this
      // should be — and being anywhere else means the choreography starts
      // mid-act, which is the whole thing the splash exists to prevent.
      resetScroll();
      unlockScroll();
      /*
        And the payoff. Everything the curtain was waiting for changes the
        page's geometry — the font swapped, the catalogue filled the variants
        zone, the canvas took its size. ScrollTrigger cached the old numbers
        as each trigger was created. One refresh at the moment the page
        becomes scrollable re-measures all of them against the layout the
        visitor is actually about to scroll, which is the difference between
        the cup arriving with the section and arriving a screen early.
      */
      ScrollTrigger.refresh();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // above the cart drawer (z-50) and the mobile menu (z-[60]) — while
          // this is up it is the only thing on the screen
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-bg px-6"
          initial={false}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
          transition={{ duration: reducedMotion ? 0.2 : 0.55, ease: [0.4, 0, 0.2, 1] }}
          // the visitor is being made to wait — say so once, don't narrate it
          role="status"
          aria-live="polite"
          aria-label={t("splash.loading")}
        >
          {/* the same gold bloom the hero sits in, so the curtain belongs to
              the page it opens onto rather than being a grey interstitial */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgb(var(--c-gold-hi) / 0.30), rgb(var(--c-brand) / 0.10) 45%, transparent 70%)",
            }}
          />

          <motion.img
            src="/images/norlyn-logo.webp"
            alt="Norlyn Coffee"
            width={640}
            height={237}
            // preloaded in index.html: the mark that covers the loading must
            // never itself be a thing that is loading
            fetchPriority="high"
            decoding="sync"
            className="norlyn-logo relative h-auto max-w-[62vw]"
            style={{ width: LOGO_WIDTH }}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* A rail rather than a spinner. A spinner says "something is
              happening"; a rail that fills says "and it is nearly done", which
              is the honest message — the wait has a known end, either the last
              hold clearing or MAX_MS. */}
          <div
            aria-hidden
            className="relative h-px w-40 max-w-[52vw] overflow-hidden rounded-full bg-line"
          >
            <motion.span
              className="absolute inset-y-0 start-0 block bg-brand"
              initial={{ width: "8%" }}
              // 82% is where an unfinished load parks: the bar must not sit
              // full while the page behind it is still assembling, or the next
              // second of waiting reads as a hang
              animate={{ width: ready ? "100%" : "82%" }}
              transition={{ duration: ready ? 0.35 : 1.6, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
