/**
 * Build-time sitemap generation — queries active products from Supabase so
 * product URLs never go stale. Falls back to static routes only when the
 * Supabase env is absent (local builds without .env).
 * Bun loads .env automatically; wired into the "build" script.
 */
import { writeFileSync } from "node:fs";

const SITE_URL = (process.env.SITE_URL ?? "https://norlyn.dz").replace(/\/$/, "");

// Must mirror the public <Route> list in src/App.tsx — never advertise a 404.
const STATIC_ROUTES = ["/", "/shop"];

async function fetchActiveSlugs() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[sitemap] Supabase env missing — static routes only.");
    return [];
  }
  try {
    const res = await fetch(
      `${url}/rest/v1/products?select=slug,updated_at&status=eq.active`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[sitemap] product fetch failed (${err.message}) — static routes only.`);
    return [];
  }
}

const products = await fetchActiveSlugs();
const today = new Date().toISOString().slice(0, 10);

const urls = [
  ...STATIC_ROUTES.map((route) => ({ loc: `${SITE_URL}${route}`, lastmod: today })),
  ...products.map((p) => ({
    loc: `${SITE_URL}/product/${p.slug}`,
    lastmod: (p.updated_at ?? today).slice(0, 10),
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n")}
</urlset>
`;

writeFileSync("public/sitemap.xml", xml);
console.log(`[sitemap] wrote ${urls.length} URLs to public/sitemap.xml`);
