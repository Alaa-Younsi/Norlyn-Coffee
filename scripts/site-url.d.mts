/**
 * Types for `site-url.mjs`.
 *
 * The implementation stays plain ESM because `generate-sitemap.mjs` runs it
 * directly through the Node/Bun runtime with no compile step; vite.config.ts is
 * type-checked, so it needs this declaration to import the same module.
 */

/** The build's absolute origin, or "" when it cannot be determined. */
export function resolveSiteUrl(): string;
