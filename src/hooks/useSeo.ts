import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * The origin to build canonical/og:url from.
 *
 * `window.location.origin` — not a constant. This runs in the visitor's
 * browser, which already knows exactly which host served the page, so there is
 * nothing to guess and nothing to update when the domain changes. The previous
 * hardcoded "https://norlyn.dz" was a promise about a domain that is not
 * registered yet: it told Google every page's real address was a host that
 * does not resolve. A build-time override stays available for the odd case
 * where the canonical host is not the one being browsed.
 */
function siteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined;
  return (configured || window.location.origin).replace(/\/$/, "");
}

interface SeoOptions {
  title: string;
  description?: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
  /**
   * Keep this route out of the index — the order confirmation and checkout
   * pages carry a customer's name/address and must never be crawled. robots.txt
   * already disallows the paths; this is the belt-and-braces for a crawler that
   * ignores it or reaches the URL from a link.
   */
  noindex?: boolean;
}

function upsertMeta(attr: "name" | "property", key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Client-side per-route SEO: title/description/OG/canonical + optional
 * page-scoped JSON-LD (removed on unmount so a product's schema never
 * lingers on the next route). Helps Googlebot (executes JS) and browser
 * tabs; social crawlers are covered by middleware.ts instead.
 */
export function useSeo({ title, description, image, jsonLd, noindex }: SeoOptions): void {
  const { pathname } = useLocation();
  // Callers build jsonLd inline every render — depend on its serialization.
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    // index.html ships `<meta name="robots" content="index, follow">`; flip it
    // for this route and restore it on the way out.
    const robotsEl = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const prevRobots = robotsEl?.getAttribute("content") ?? null;
    if (noindex && robotsEl) robotsEl.setAttribute("content", "noindex, nofollow");

    const url = `${siteUrl()}${pathname}`;
    upsertCanonical(url);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:title", title);
    upsertMeta("name", "twitter:title", title);
    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
      upsertMeta("name", "twitter:description", description);
    }
    if (image) {
      upsertMeta("property", "og:image", image);
      upsertMeta("name", "twitter:image", image);
    }

    let script: HTMLScriptElement | null = null;
    if (jsonLdString) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = jsonLdString;
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      script?.remove();
      if (noindex && robotsEl && prevRobots !== null) robotsEl.setAttribute("content", prevRobots);
    };
  }, [title, description, image, jsonLdString, pathname, noindex]);
}
