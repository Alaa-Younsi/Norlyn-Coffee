# Norlyn Coffee — Moriva

Storefront + admin for **Norlyn Coffee** (Algiers). Moriva is the espresso
capsule line — 4 variants (Espresso Intenso, Ristretto Noir, Lungo Doré,
Decaf Verde). Cash-on-delivery across the 58 wilayas, FR + AR (RTL).

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
- `src/lib/finance.ts` — the pure aggregation engine shared by both ledgers
  (ranges, totals, per-product/customer breakdowns, chart series). No Supabase.
- `src/lib/metaPixel.ts` + `src/components/MetaPixelProvider.tsx` — DB-driven
  multi-pixel tracking; every event goes out via `trackSingle`, never `track`.
- `src/lib/imageSlots.ts` — the named picture slots the design declares and the
  client fills from Admin → Contenu & médias.
- `src/components/3d` — capsule scene; `sceneConfig.ts` maps scroll progress
  to the choreography.
- `src/hooks/useScrollStage.ts` — Lenis + master ScrollTrigger writing into
  `lib/scrollProgress.ts` (read by the 3D scene in useFrame, zero re-renders).
- `supabase/migrations` — schema, RLS, and the `place_order` SECURITY DEFINER
  RPC (server-side prices, stock checks, per-phone rate limit, wilaya
  validation, restock-on-cancel trigger) + `get_order_by_number` guest lookup;
  then `0004` staff accounts + per-section RLS, `0005` Meta pixels, `0006` the
  business suite (`create_store_sale` till RPC, cost snapshot trigger), `0007`
  site content (`submit_contact_message` RPC).
- `supabase/functions/create-worker` — service-role edge function for staff
  account creation (verifies the caller is the owner, re-validates the section
  list, rolls back the auth user if the profile insert fails).
- `middleware.ts` — Vercel Edge link previews for social crawlers on
  `/product/:slug`.
- `scripts/` — sitemap generation (wired into build), image optimization,
  OG image generation (one-off).

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
5. Replace seed product photos via the admin (uploads are compressed
   client-side), set real delivery prices per wilaya, add reviews. Fill the
   hero slider and the named picture slots in **Contenu & médias** — every
   empty slot renders a designed placeholder until then.
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
