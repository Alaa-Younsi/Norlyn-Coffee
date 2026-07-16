import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://norlyn.dz";

interface SeoOptions {
  title: string;
  description?: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
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
export function useSeo({ title, description, image, jsonLd }: SeoOptions): void {
  const { pathname } = useLocation();
  // Callers build jsonLd inline every render — depend on its serialization.
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const url = `${SITE_URL}${pathname}`;
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
    };
  }, [title, description, image, jsonLdString, pathname]);
}
