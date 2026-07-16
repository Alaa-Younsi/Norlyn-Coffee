import { next } from "@vercel/edge";

export const config = { matcher: "/product/:slug*" };

const CRAWLER_RE =
  /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|Discordbot|LinkedInBot|Slackbot|Pinterest|vkShare|redditbot/i;

const SITE_URL = "https://norlyn.dz";

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
    const image = escapeHtml(
      [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ??
        `${SITE_URL}/og-image.png`,
    );
    const url = escapeHtml(`${SITE_URL}/product/${product.slug}`);
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
