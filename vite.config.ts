import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { resolveSiteUrl } from './scripts/site-url.mjs'

/**
 * Fills the `%SITE_URL%` placeholders in index.html — canonical, og:url,
 * og:image, twitter:image and the Store JSON-LD, the tags that must be
 * absolute for a crawler that will never run our JavaScript.
 *
 * Vite's own `%VAR%` substitution only reaches `VITE_`-prefixed env, and the
 * value we want is usually Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, which is
 * not prefixed and is not something the client should be able to read. So it
 * is resolved here, at build time, by the same function the sitemap script
 * uses — one answer, one place. See scripts/site-url.mjs for the chain.
 */
function siteUrlHtml(): Plugin {
  const siteUrl = resolveSiteUrl()
  return {
    name: 'norlyn-site-url-html',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => {
        if (siteUrl) return html.replaceAll('%SITE_URL%', siteUrl)

        // No origin to declare — a local build with no Vercel env. The og:*
        // tags degrade to root-relative and stay correct, but the canonical
        // LINK cannot: Vite resolves `href` as an asset reference, and a bare
        // "/" points at the project directory (EISDIR, build fails). Drop the
        // tag instead of guessing a domain. useSeo() writes a correct one from
        // window.location on mount, so only a crawler that runs no JavaScript
        // sees the difference, and for that crawler no canonical beats one
        // naming a host it cannot reach.
        return html
          .replace(/[ \t]*<link rel="canonical"[^>]*>\n?/g, '')
          .replaceAll('%SITE_URL%', '')
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrlHtml()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
