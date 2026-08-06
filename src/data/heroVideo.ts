import { mediaSrc, MEDIA } from "@/lib/media";

/**
 * The hero's video screen.
 *
 * There are two ways to fill it, checked in this order:
 *
 *  1. **Admin → Contenu & médias** — a hero slide of kind `video`. Nothing to
 *     deploy, and the client can swap the film whenever they like.
 *  2. **This drop-in path** — put the file at `public/videos/hero.mp4` and it
 *     shows up on the next build. Nothing else to change.
 *
 * Until one of those exists the screen renders its poster state on purpose: a
 * still frame with a "film coming" plate. A `<video>` pointed at a file that
 * isn't there is a broken black box, so the component treats the missing file
 * as a designed state rather than an error.
 */
export const HERO_VIDEO = {
  src: "/videos/hero.mp4",
  /**
   * Shown before the first frame decodes, and on its own for as long as there
   * is no film. A real photograph, not a grey placeholder — the hero has to
   * look finished on the day the client first opens it.
   */
  poster: mediaSrc(MEDIA.life.espressoGlass),
} as const;
