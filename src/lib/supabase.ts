import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** False when the .env is absent — storefront hooks then serve fallback data. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// Placeholder client when unconfigured keeps call sites null-free; every hook
// checks isSupabaseConfigured before touching it.
export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key",
);

// First query + every product image comes from this origin.
if (isSupabaseConfigured && typeof document !== "undefined") {
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = new URL(url as string).origin;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}
