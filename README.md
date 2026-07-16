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

- `src/pages` — storefront (Landing/Shop/Product/Checkout/OrderConfirmation)
  and `admin/` dashboard (products, categories, orders, delivery prices per
  wilaya, reviews, settings).
- `src/components/3d` — capsule scene; `sceneConfig.ts` maps scroll progress
  to the choreography.
- `src/hooks/useScrollStage.ts` — Lenis + master ScrollTrigger writing into
  `lib/scrollProgress.ts` (read by the 3D scene in useFrame, zero re-renders).
- `supabase/migrations` — schema, RLS, and the `place_order` SECURITY DEFINER
  RPC (server-side prices, stock checks, per-phone rate limit, wilaya
  validation, restock-on-cancel trigger) + `get_order_by_number` guest lookup.
- `middleware.ts` — Vercel Edge link previews for social crawlers on
  `/product/:slug`.
- `scripts/` — sitemap generation (wired into build), image optimization,
  OG image generation (one-off).

## Go-live checklist

1. Create a Supabase project; copy `.env.example` → `.env` with the URL +
   anon key. Never commit `.env`.
2. Run the SQL migrations in `supabase/migrations` in order.
3. Create the `product-images` Storage bucket (public read).
4. Create the admin user in Supabase Auth, and **disable public sign-up**
   (Authentication → Settings) — the RLS grants full write access to any
   authenticated session, so this switch is the actual security boundary.
5. Replace seed product photos via the admin (uploads are compressed
   client-side), set real delivery prices per wilaya, add reviews.
6. Free shipping is OFF by default (`free_ship_threshold` NULL). Set it in
   Admin → Paramètres only if the promotion is wanted.
7. Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in the **Vercel project
   env** (the edge middleware reads them). After deploy verify:
   `curl -A "facebookexternalhit/1.1" https://<domain>/product/<slug>`.
8. Update the production domain in `index.html` (canonical/OG), `SITE_URL`
   env, `public/robots.txt`, and `middleware.ts` if it isn't `norlyn.dz`.
9. Meta Pixel: uncomment the snippet in `index.html` and replace
   `YOUR_PIXEL_ID` in **both** places (script + noscript). SPA events
   (PageView per route, ViewContent, AddToCart, InitiateCheckout, Purchase)
   are already wired through `src/lib/pixel.ts`.
10. Before ad spend: place one real test order end-to-end as an anonymous
    visitor (both the cart checkout and the product-page quick buy), confirm
    the confirmation page shows the recap, cancel one order in the admin and
    confirm stock restocks, then delete the test orders. Fuzz `place_order`
    over REST with junk input — every rejection must be an `ERR_*` message.
