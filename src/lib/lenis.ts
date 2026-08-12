import type Lenis from 'lenis'

let instance: Lenis | null = null
let locked = false

export const setLenisInstance = (lenis: Lenis | null): void => {
  instance = lenis
  // A lock taken before this instance existed still applies to it. That is the
  // whole reason the flag lives here: <SplashScreen> mounts and locks BEFORE
  // <Landing> mounts and constructs Lenis, so a lock that only reached the
  // instance it could see at the time reached nothing at all on a cold load.
  if (lenis && locked) lenis.stop()
  // Lenis owns the scroll position on the landing page and re-applies its own
  // animated value every frame, so window.scrollTo cannot drive it. Expose the
  // instance in dev only, so scripted checks (headless screenshots of the
  // scroll choreography) can jump to an exact offset with `immediate: true`.
  if (import.meta.env.DEV) {
    ;(window as unknown as { __lenis?: Lenis | null }).__lenis = lenis
  }
}

export const getLenisInstance = (): Lenis | null => instance

/**
 * Hold the page still — used by the splash screen while the curtain is up.
 *
 * `overflow: hidden` on <html> is not enough on its own, and that gap is
 * exactly what it looked like from the outside: "when I refresh, it scrolls a
 * little bit." Lenis does not scroll the document by letting the browser
 * scroll it. It listens for `wheel`, accumulates its own target, and writes the
 * position every frame — so the document's overflow is not a rule it is subject
 * to. A single trackpad nudge behind the curtain, or the tail of an inertial
 * scroll still gliding through the reload, was being banked and then applied
 * the instant the splash lifted, dropping the visitor a few hundred pixels into
 * a choreography that is supposed to start at its first frame.
 *
 * Stopped, Lenis discards those events instead of banking them, so there is
 * nothing left to apply when the page is handed back.
 */
export const lockScroll = (): void => {
  locked = true
  instance?.stop()
}

export const unlockScroll = (): void => {
  locked = false
  instance?.start()
}

/**
 * Put the page back at the top, now, with no animation.
 *
 * The splash screen makes a promise — refresh and you begin at the beginning —
 * and this is the line that keeps it, rather than trusting that every path by
 * which a few pixels of scroll could survive a reload has been found and shut.
 * There are a lot of them: a trackpad still gliding through the navigation, the
 * browser's own restoration, an anchor, a focused element, a late-loading image
 * changing the height above the fold. Asserting the position costs nothing on a
 * page that is already at 0 and is exact on one that is not.
 *
 * BOTH calls are needed. `window.scrollTo` moves the document; Lenis keeps its
 * own animated value and would write it straight back on the next frame. And
 * `force` is required because Lenis refuses `scrollTo` while it is stopped —
 * which, when the splash calls this, it is.
 */
export const resetScroll = (): void => {
  window.scrollTo(0, 0)
  instance?.scrollTo(0, { immediate: true, force: true })
}
