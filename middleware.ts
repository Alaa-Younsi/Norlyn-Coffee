import { next } from "@vercel/edge";

// Prerender-style OG tags for the two link surfaces a shopper actually shares:
// a product page and a Journal article. Everything else falls through to the
// SPA shell (index.html), whose static tags describe the store as a whole.
export const config = { matcher: ["/product/:slug*", "/journal/:slug*"] };

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

/**
 * Crawler-supplied `Accept-Language` is the only per-request locale signal
 * available here (the site's own language lives in the visitor's localStorage,
 * which an edge crawler never sends). Facebook/WhatsApp usually omit it, so FR
 * stays the default; when a crawler does say `ar`, honour it.
 */
function prefersArabic(request: Request): boolean {
  return /^ar\b/i.test(request.headers.get("accept-language") ?? "");
}

interface OgData {
  title: string;
  description: string;
  image: string; // site-relative or absolute
  ogType: "product" | "article";
  priceAmount?: string;
  availability?: string;
}

async function fetchProduct(
  supabaseUrl: string,
  anonKey: string,
  slug: string,
  ar: boolean,
): Promise<OgData | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/products?select=name_fr,name_ar,description_fr,description_ar,price,stock,slug,product_images(url,sort_order)&slug=eq.${slug}&status=eq.active&limit=1`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{
    name_fr: string;
    name_ar: string | null;
    description_fr: string | null;
    description_ar: string | null;
    price: number;
    stock: number;
    slug: string;
    product_images: Array<{ url: string; sort_order: number }>;
  }>;
  const p = rows[0];
  if (!p) return null;

  const name = (ar && p.name_ar) || p.name_fr;
  const description =
    (ar ? p.description_ar : p.description_fr) ??
    p.description_fr ??
    "Capsules espresso premium Moriva par Norlyn Coffee.";
  const photo =
    [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? "/og-image.png";

  return {
    title: `${name} — Norlyn Coffee`,
    description,
    image: photo,
    ogType: "product",
    priceAmount: String(p.price),
    availability: p.stock > 0 ? "in stock" : "out of stock",
  };
}

async function fetchArticle(
  supabaseUrl: string,
  anonKey: string,
  slug: string,
  ar: boolean,
): Promise<OgData | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/articles?select=title_fr,title_ar,excerpt_fr,excerpt_ar,cover_url,slug&slug=eq.${slug}&status=eq.published&limit=1`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{
    title_fr: string;
    title_ar: string | null;
    excerpt_fr: string | null;
    excerpt_ar: string | null;
    cover_url: string | null;
    slug: string;
  }>;
  const a = rows[0];
  if (!a) return null;

  const title = (ar && a.title_ar) || a.title_fr;
  const description =
    (ar ? a.excerpt_ar : a.excerpt_fr) ??
    a.excerpt_fr ??
    "Le Journal Moriva par Norlyn Coffee.";

  return {
    title: `${title} — Journal Norlyn Coffee`,
    description,
    image: a.cover_url ?? "/og-image.png",
    ogType: "article",
  };
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!CRAWLER_RE.test(userAgent)) return next();

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return next();

  const { pathname } = new URL(request.url);
  const [, section, slug = ""] = pathname.split("/");
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return next();

  const ar = prefersArabic(request);

  try {
    const data =
      section === "product"
        ? await fetchProduct(supabaseUrl, anonKey, slug, ar)
        : section === "journal"
          ? await fetchArticle(supabaseUrl, anonKey, slug, ar)
          : null;
    if (!data) return next();

    const origin = siteUrl(request);
    // og:image must be absolute — a crawler resolving a relative one is
    // best-effort at best, and a preview with no picture is most of the click
    // lost. Seeded photos are stored site-relative; Storage uploads come back
    // absolute.
    const image = escapeHtml(
      data.image.startsWith("http") ? data.image : `${origin}${data.image}`,
    );
    const url = escapeHtml(`${origin}${pathname}`);
    const title = escapeHtml(data.title);
    const description = escapeHtml(data.description);

    const productTags =
      data.ogType === "product"
        ? `
<meta property="product:price:amount" content="${escapeHtml(data.priceAmount ?? "")}">
<meta property="product:price:currency" content="DZD">
<meta property="product:availability" content="${escapeHtml(data.availability ?? "")}">`
        : "";

    const html = `<!doctype html>
<html lang="${ar ? "ar" : "fr"}"${ar ? ' dir="rtl"' : ""}><head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="${data.ogType}">
<meta property="og:site_name" content="Norlyn Coffee">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">${productTags}
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
