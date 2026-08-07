import { next } from "@vercel/edge";

export const config = { matcher: "/product/:slug*" };

const CRAWLER_RE =
  /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|Discordbot|LinkedInBot|Slackbot|Pinterest|vkShare|redditbot/i;

/**
 * Where this response says it lives.
 *
 * Derived from the request the crawler actually made, because that is the one
 * thing here that cannot be wrong: Facebook fetched this URL, so this URL is
 * the page's address. The old hardcoded "https://norlyn.dz" was a domain that
 * is not registered yet — og:url pointed nowhere and og:image 404'd, which is
 * a link preview with no picture on every share.
 *
 * The env override exists for the case where the canonical host differs from
 * the one being hit (a preview deployment that should still name production).
 */
function siteUrl(request: Request): string {
  const configured = process.env.VITE_SITE_URL || process.env.SITE_URL;
  if (configured && configured.trim()) return configured.trim().replace(/\/$/, "");
  return new URL(request.url).origin;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!CRAWLER_RE.test(userAgent)) return next();

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return next();

  const slug = new URL(request.url).pathname.split("/").pop() ?? "";
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return next();

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/products?select=name_fr,description_fr,price,stock,slug,product_images(url,sort_order)&slug=eq.${slug}&status=eq.active&limit=1`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
    );
    if (!res.ok) return next();
    const rows = (await res.json()) as Array<{
      name_fr: string;
      description_fr: string | null;
      price: number;
      stock: number;
      slug: string;
      product_images: Array<{ url: string; sort_order: number }>;
    }>;
    const product = rows[0];
    if (!product) return next();

    const title = escapeHtml(`${product.name_fr} — Norlyn Coffee`);
    const description = escapeHtml(
      product.description_fr ?? "Capsules espresso premium Moriva par Norlyn Coffee.",
    );
    const origin = siteUrl(request);
    // The catalogue's seeded photos are stored as site-relative paths
    // ("/images/capsules/…"); Storage uploads come back absolute. og:image
    // must be absolute either way — a crawler resolving it is best-effort at
    // best, and a preview with no picture is most of the click lost.
    const photo =
      [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ??
      "/og-image.png";
    const image = escapeHtml(photo.startsWith("http") ? photo : `${origin}${photo}`);
    const url = escapeHtml(`${origin}/product/${product.slug}`);
    const availability = product.stock > 0 ? "in stock" : "out of stock";

    const html = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Norlyn Coffee">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="product:price:amount" content="${product.price}">
<meta property="product:price:currency" content="DZD">
<meta property="product:availability" content="${availability}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
</head><body>${title}</body></html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return next();
  }
}
