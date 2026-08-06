import { createClient } from "@supabase/supabase-js";

// `|| undefined`, not `??`: a var that EXISTS but is empty (the usual shape of
// a half-filled Vercel project) must read as absent. Left as an empty string it
// slips past `??` into createClient, which throws "supabaseUrl is required" at
// module scope — a blank white site instead of the fallback catalogue.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || undefined;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || undefined;

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
