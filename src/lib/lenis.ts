import type Lenis from 'lenis'

let instance: Lenis | null = null

export const setLenisInstance = (lenis: Lenis | null): void => {
  instance = lenis
  // Lenis owns the scroll position on the landing page and re-applies its own
  // animated value every frame, so window.scrollTo cannot drive it. Expose the
  // instance in dev only, so scripted checks (headless screenshots of the
  // scroll choreography) can jump to an exact offset with `immediate: true`.
  if (import.meta.env.DEV) {
    ;(window as unknown as { __lenis?: Lenis | null }).__lenis = lenis
  }
}

export const getLenisInstance = (): Lenis | null => instance
