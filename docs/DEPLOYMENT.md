# Deployment & go-live checklist

Everything a human has to do once, in order, to take the store live on a new
Supabase project and Vercel deployment. Architecture background lives in
[ARCHITECTURE.md](ARCHITECTURE.md).

## Checklist

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
4. Storage: migration 0011 creates the two public-read buckets —
   `product-images` (product photos, review photos, article covers, hero
   slides, site image slots) and `product-videos` (hero/product video uploads)
   — with writes gated on `is_admin()`. Confirm both exist after the
   migrations run.
5. Migration 0009 already ships the catalogue, the product photos, the hero
   slides, every named image slot and the launch articles, all pointing at the
   WebP in `/public/images` — nothing has to be uploaded to go live. What DOES
   need a human: **the eight prices are placeholders** (Admin → Produits), and
   so is the **contact phone number** — it and the email both live in
   `src/lib/contact.ts`, which is the only place either one appears. Set real
   delivery prices per wilaya, and add real reviews (the three fallback ones
   only show without Supabase). Anything the client later uploads in
   **Contenu & médias** overrides the seed — 0009 never overwrites an
   existing row.
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
