/**
 * The origin this build should call itself, for the handful of places that
 * need an ABSOLUTE url: canonical, og:image, the sitemap, robots.
 *
 * It used to be the string "https://norlyn.dz" in four files. That domain is
 * not registered yet — the store runs on its Vercel hostname — so every one of
 * those tags pointed at a host that does not resolve: link previews on
 * Instagram and WhatsApp could not fetch their image, and the canonical told
 * Google the real page lived somewhere that answers nothing.
 *
 * The chain below needs no configuration in the normal case, and no edit on
 * launch day:
 *
 *   1. `VITE_SITE_URL` / `SITE_URL` — an explicit override, for when the
 *      canonical host is not the one Vercel thinks is production.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — set automatically on every Vercel
 *      build. Today that is the *.vercel.app hostname; the day a custom domain
 *      is assigned as production, Vercel changes this value and the tags
 *      follow with no code change. Deliberately NOT `VERCEL_URL`, which is the
 *      per-deployment hostname and changes on every push — a canonical that
 *      moves every deploy is worse than no canonical.
 *   3. Nothing — return "", which leaves the tags ROOT-RELATIVE ("/og-image.png").
 *      Relative is resolved against whatever origin actually served the page,
 *      so it is always right about where it is. An absolute guess can be
 *      wrong; a relative one cannot.
 */
export function resolveSiteUrl() {
  const explicit = process.env.VITE_SITE_URL || process.env.SITE_URL;
  if (explicit && explicit.trim()) return explicit.trim().replace(/\/$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production && production.trim()) return `https://${production.trim().replace(/\/$/, "")}`;

  return "";
}
