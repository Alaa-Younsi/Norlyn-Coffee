export const scrollProgress = { current: 0 }

export const setScrollProgress = (v: number): void => {
  scrollProgress.current = v
}

/**
 * Normalized act boundaries within the master scroll stage, measured from the
 * real section offsets rather than hardcoded — the variants zone's height
 * depends on how many products loaded, so every fraction below it shifts.
 * Written by useScrollStage on every ScrollTrigger refresh, read in useFrame.
 */
export interface SceneBounds {
  /** progress at which the story ("La maison Norlyn") section reaches the top */
  story: number
  /** progress at which the variants zone reaches the top */
  variants: number
  /** progress at which the post-variants sections (featured/gallery) begin */
  tail: number
  /** progress at which "Commande en 3 étapes" begins — the exit act */
  outro: number
  /**
   * One viewport height expressed in progress units (vh / scrollable
   * distance). Needed to know where the variants zone's sticky screen
   * unpins: its pin releases one viewport before the zone's bottom.
   */
  viewport: number
}

/** Sensible fallbacks used until the first measurement lands. */
export const DEFAULT_BOUNDS: SceneBounds = {
  story: 0.11,
  variants: 0.22,
  tail: 0.7,
  outro: 0.86,
  viewport: 0.09,
}

export const sceneBounds: SceneBounds = { ...DEFAULT_BOUNDS }

export const setSceneBounds = (next: SceneBounds): void => {
  Object.assign(sceneBounds, next)
}
