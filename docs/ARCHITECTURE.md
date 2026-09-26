# Architecture notes

Maintainer reference for the Norlyn Coffee — Moriva codebase: where things
live, which files must stay in sync, and the load-bearing entries in the
deployment headers. For the project overview see the [README](../README.md);
for launching a new environment see [DEPLOYMENT.md](DEPLOYMENT.md).

## Structure

- `src/pages` — storefront (Landing/Shop/Product/About/Journal/Article/Contact/
  Checkout/OrderConfirmation) and `admin/` dashboard: products, categories,
  orders (Excel export + delete-all), delivery prices per wilaya, reviews,
  content & media (hero slider + named image slots), journal, contact inbox,
  website finances, physical-shop ledger + till, Meta pixels, team, settings,
  account.
- `src/lib/adminSections.ts` — the ONE source of truth for the admin nav, the
  route→section map and the owner's grant checklist. Its keys must stay in sync
  with the `has_section('…')` strings in the migrations and with
  `ALLOWED_SECTIONS` in `supabase/functions/create-worker`.
- `src/i18n` — `translations.ts` merges the `.admin` and `.site` modules and
  compiler-enforces that AR and EN carry every FR key. `langs.ts` owns the
  switcher cycle. FR is the source language and the only NOT NULL one. Since
  migration 0012 every localized table also carries `*_en` (products,
  categories, articles, slides, image slots, order lines), and
  `lib/localized.ts`'s `pickLang` reads it — falling back to FR for a row the
  client added without English, so a half-translated catalogue is a partly
  French page and never a blank one.
- `src/lib/finance.ts` — the pure aggregation engine shared by both ledgers
  (ranges, totals, per-product/customer breakdowns, chart series). No Supabase.
- `src/lib/metaPixel.ts` + `src/components/MetaPixelProvider.tsx` — DB-driven
  multi-pixel tracking; every event goes out via `trackSingle`, never `track`.
- `src/lib/imageSlots.ts` — the named picture slots the design declares and the
  client fills from Admin → Contenu & médias.
- `src/lib/videoSlots.ts` — the same for the two fixed films (the hero screen
  and the product-page espresso loop). A slot resolves to the client's upload,
  then to a file committed at `public/videos/…`, then to a still photograph, so
  "the video is coming later" is an ordinary state and never a black box.
- `src/lib/media.ts` + `src/components/ui/Photo.tsx` — the typed index of the
  shipped photography and the one way to render it: capped srcSet, explicit
  width/height, lazy by default. `dbSrcSet`/`dbSize` do the same for URLs that
  came from the database (local seed paths get renditions, Storage uploads
  don't). Files are produced by `scripts/optimize-images.mjs` from
  `assets-src/raw/` — 115 MB of originals in, 3.5 MB of WebP out. The raw
  folder is gitignored: keep your own backup of it.
- `src/lib/mascot.ts` + `src/components/mascot/` — the brand cup. Nine drawings
  of one character that differ only in the face, so stacked frames cross-fade
  into an expression change instead of a sticker swap. `<ScrollMascot>` reads
  `data-mascot="<emotion>"` off sections (same pattern as `data-reveal`) and
  shows the cup only inside the tagged run.
- `src/lib/contrast.ts` — `readableAccent` treats a product's `accent_color` as
  a hue, clamping lightness into a band that passes contrast on the active
  theme. Without it the near-black Noir headline renders invisible on dark.
- `src/components/3d` — capsule scene; `sceneConfig.ts` maps scroll progress
  to the choreography.
- `src/hooks/useScrollStage.ts` — Lenis + master ScrollTrigger writing into
  `lib/scrollProgress.ts` (read by the 3D scene in useFrame, zero re-renders).
- `supabase/migrations` — schema, RLS, and the `place_order` SECURITY DEFINER
  RPC (server-side prices, stock checks, per-phone rate limit, wilaya
  validation, restock-on-cancel trigger) + `get_order_by_number` guest lookup;
  then `0004` staff accounts + per-section RLS, `0005` Meta pixels, `0006` the
  business suite (`create_store_sale` till RPC, cost snapshot trigger), `0007`
  site content (`submit_contact_message` RPC), `0008` EN as a third order
  language (replaces `place_order` verbatim except its language clamp), `0009`
  the real catalogue (2 categories × 4 variants, product images, filled image
  slots, hero slides and the five launch Journal articles — all ordinary rows
  the client can edit afterwards; the four invented 0001 variants are deleted),
  `0010` newsletter, `0011` Storage buckets + admin-gated write policies,
  `0012` `*_en` content columns, `0013` site videos, `0014` the 69 wilayas,
  `0015` hardening (10-char order numbers, global order burst breaker,
  newsletter throttle, atomic `apply_stock_delta`), `0016`/`0017` order and
  message notification claims, `0018` seed reviews, `0019` notification-claim
  grants locked to the service role.
- `supabase/functions/create-worker` — service-role edge function for staff
  account creation (verifies the caller is the owner, re-validates the section
  list, rolls back the auth user if the profile insert fails).
  `update-worker-password` is its owner-only sibling; `notify` pings staff on a
  new order or contact message through the replay-proof claim RPCs.
- `middleware.ts` — Vercel Edge link previews for social crawlers on
  `/product/:slug` and `/journal/:slug`.
- `scripts/` — sitemap generation (wired into build), image optimization
  (`node scripts/optimize-images.mjs`, idempotent, re-run after adding raw
  photography), OG image generation (one-off).
- `src/components/layout/SplashScreen.tsx` + `src/store/splash.ts` — the
  opening curtain. It is not a timed animation: it holds until the webfont has
  swapped, the catalogue has landed and the WebGL canvas has drawn a real
  frame, because all three change the geometry the scroll choreography is
  measured against. One `ScrollTrigger.refresh()` fires as it lifts, so every
  trigger is measured against the layout the visitor actually scrolls. A floor
  stops it flashing, a 6 s cap means it can never trap anyone, and the
  pre-React shell in `index.html` is drawn to match it pixel for pixel so the
  handoff has no seam — change one, change the other.

## Headers

`vercel.json` carries the security headers and the cache policy, and two
entries there are load-bearing:

- **Content-Security-Policy** enumerates every origin the site may touch:
  Supabase (REST, realtime over `wss`, and Storage for photography and video)
  and Meta's pixel — which `src/lib/metaPixel.ts` installs at runtime, so no
  pixel ID is ever inlined. Fonts are self-hosted (`@fontsource`, imported in
  `src/main.tsx`), so there is no `fonts.googleapis.com` / `fonts.gstatic.com`
  entry and `font-src` is just `'self'`. `style-src` keeps `'unsafe-inline'`
  because framer-motion and GSAP write to the style attribute on every animated
  frame; `script-src` deliberately does not, so the only inline script that can
  run is the pre-paint theme/language read in `index.html`, allowed by an
  explicit `sha256-`. **Edit that script and the hash must be recomputed** —
  otherwise it is blocked and the dark-mode / RTL flash comes back. Get the new
  value from the built file:

  ```bash
  bun run build
  node -e "const h=require('crypto').createHash('sha256');const m=require('fs').readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/);h.update(m[1]);console.log('sha256-'+h.digest('base64'))"
  ```

- **`/videos/` caching.** The films autoplay and `hero.mp4` is ~1.9 MB. With
  no rule they fall through to Vercel's revalidate-every-request default,
  which is the whole file downloaded again on every visit by a shopper on
  mobile data.

**Env vars must be absent or complete, never empty.** `lib/supabase.ts` and
the sitemap script both coerce `""` to "missing" for exactly this reason — an
empty `VITE_SUPABASE_URL` used to crash the app at import, and an empty
`SITE_URL` produced a sitemap of relative `<loc>`s that crawlers drop.

