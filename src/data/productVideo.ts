import { mediaSrc, MEDIA } from "@/lib/media";

/**
 * The espresso loop that runs beside every product.
 *
 * Unlike the hero film this one is fixed: the same shot on every product page,
 * so it is a deployed asset rather than something the client swaps per page
 * from the admin. Drop the file at `public/videos/espresso.mp4` and it appears
 * on the next build — nothing else to change.
 *
 * Until that file exists the slot renders the poster on its own. A still of
 * espresso pulling is a finished-looking thing in a way an empty box or a
 * broken `<video>` is not, so "no film yet" costs the page nothing.
 */
export const PRODUCT_VIDEO = {
  src: "/videos/espresso.mp4",
  poster: mediaSrc(MEDIA.life.espressoGlass),
} as const;
