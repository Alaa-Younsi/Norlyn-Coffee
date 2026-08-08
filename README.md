# Norlyn Coffee — Moriva

Storefront + admin for **Norlyn Coffee** (Algiers). Moriva is the espresso
capsule line: **two families of four**.

- **Espresso 100 % bio** — Noir (robusta-led, max intensity), Brun, Vert
  (balanced), Or (arabica-led, finest). Natural, 0 % sugar, sealed in pure
  food-grade aluminium with certified experts.
- **Capsules aromatisées** — noisette, vanille, caramel, chocolat.

Tea and espresso machines are future lines; the machines already appear on
La Maison as a "coming soon" band. Cash-on-delivery across the 69 wilayas,
FR + AR (RTL) + EN.

3D scroll-driven landing (React Three Fiber + GSAP/Lenis): a procedural
faceted capsule floats over the page, drifts between sections and recolors
per variant as you scroll. Mobile / save-data / reduced-motion visitors get a
2D fallback — three.js never downloads for them.

## Stack

Bun · Vite · React 19 · TypeScript (strict) · TailwindCSS v4 (data-theme
tokens, light/dark) · React Three Fiber + drei · GSAP ScrollTrigger + Lenis ·
framer-motion · Zustand (cart) · TanStack Query · react-hook-form + zod ·
Supabase (DB, Auth, Storage) · Vercel (SPA + edge middleware).

## Develop

```bash
bun install
bun run dev        # works without Supabase — serves the fallback catalogue
bun run typecheck
bun run lint
bun run build      # regenerates sitemap, typechecks, bundles
```

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
  the client can edit afterwards; the four invented 0001 variants are deleted).
- `supabase/functions/create-worker` — service-role edge function for staff
  account creation (verifies the caller is the owner, re-validates the section
  list, rolls back the auth user if the profile insert fails).
- `middleware.ts` — Vercel Edge link previews for social crawlers on
  `/product/:slug`.
- `scripts/` — sitemap generation (wired into build), image optimization
  (`node scripts/optimize-images.mjs`, idempotent, re-run after adding raw
  photography), OG image generation (one-off).

**Env vars must be absent or complete, never empty.** `lib/supabase.ts` and
the sitemap script both coerce `""` to "missing" for exactly this reason — an
empty `VITE_SUPABASE_URL` used to crash the app at import, and an empty
`SITE_URL` produced a sitemap of relative `<loc>`s that crawlers drop.

## Go-live checklist

1. Create a Supabase project; copy `.env.example` → `.env` with the URL +
   anon key. Never commit `.env`.
2. Create the admin user in Supabase Auth **first** (migration 0004 seeds it as
   the owner), and **disable public sign-up** (Authentication → Settings).
3. Open `supabase/migrations/0004_admin_permissions.sql` and replace
   `OWNER_EMAIL_PLACEHOLDER` with that admin's real email, then run every
   migration in `supabase/migrations` in order.
   **After 0004 runs, only seeded admins can write** — that is the point: it
   replaces the old blanket `TO authenticated` grant, so a self-registered
   account is powerless. If the email didn't match, the migration's safety net
   promotes the existing auth users instead; check Admin → Équipe afterwards.
4. Create two public-read Storage buckets: `product-images` (product photos,
   review photos, article covers, hero slides, site image slots) and
   `product-videos` (hero/product video uploads). Both are authenticated-write.
5. Migration 0009 already ships the catalogue, the product photos, the hero
   slides, every named image slot and the launch articles, all pointing at the
   WebP in `/public/images` — nothing has to be uploaded to go live. What DOES
   need a human: **the eight prices are placeholders** (Admin → Produits) and
   so are the contact phone number in `src/pages/Contact.tsx` /
   `src/components/layout/Footer.tsx`. Set real delivery prices per wilaya, and
   add real reviews (the three fallback ones only show without Supabase).
   Anything the client later uploads in **Contenu & médias** overrides the
   seed — 0009 never overwrites an existing row.
6. Free shipping is OFF by default (`free_ship_threshold` NULL). Set it in
   Admin → Paramètres only if the promotion is wanted.
7. Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in the **Vercel project
   env** (the edge middleware reads them). After deploy verify:
   `curl -A "facebookexternalhit/1.1" https://<domain>/product/<slug>`.
8. Update the production domain in `index.html` (canonical/OG), `SITE_URL`
   env, `public/robots.txt`, and `middleware.ts` if it isn't `norlyn.dz`.
9. Meta Pixels are entered by the client in **Admin → Pixels Meta** — no
   snippet, no redeploy, several campaigns at once. Confirm at least one
   `active` row exists at launch and check in Events Manager that each pixel
   only receives its own pages' events. Never paste a pixel ID into
   `index.html`.
10. Staff: `supabase functions deploy create-worker`, then create a throwaway
    worker in Admin → Équipe granted a single section and verify from *their*
    login that (a) the nav shows only that section, (b) typing another
    section's URL redirects to `/admin`, and (c) a direct PostgREST write to a
    table they weren't granted changes nothing — judge by re-reading the row,
    not by the absence of an error. Deactivate the account afterwards.
11. Business suite: enter **buy prices for every product** in Finances →
    Prix d'achat *before* the first real order. Cost is snapshotted onto each
    order line at sale time, so prices entered later do not fix earlier orders'
    profit — until they're filled in, profit equals revenue and every margin
    reads 100 %. Explain the booked-vs-delivered toggle in the same sitting;
    on COD that is the difference between ordered and actually collected. The
    two ledgers never share a number: `/admin/finance` is the website,
    `/admin/store` is the shop. Deleting a website order does NOT restock
    (cancel it instead); deleting a shop sale DOES.
12. Before ad spend: place one real test order end-to-end as an anonymous
    visitor (both the cart checkout and the product-page quick buy), confirm
    the confirmation page shows the recap, cancel one order in the admin and
    confirm stock restocks, then delete the test orders. Fuzz `place_order`
    over REST with junk input — every rejection must be an `ERR_*` message.
13. Typography: the site is wired for **Gourmand** with Fraunces as the
    fallback. Drop `Gourmand-Regular.woff2` / `Gourmand-Italic.woff2` into
    `public/fonts/` and uncomment the `@font-face` block at the top of
    `src/index.css` — nothing else changes.
