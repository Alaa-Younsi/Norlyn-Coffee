import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { StoreSettings } from "@/types/db";

const DEFAULT_SETTINGS: StoreSettings = { id: 1, shipping_fee: 500, free_ship_threshold: null };

export function useStoreSettings() {
  return useQuery({
    queryKey: ["store-settings"],
    queryFn: async (): Promise<StoreSettings> => {
      if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data as StoreSettings | null) ?? DEFAULT_SETTINGS;
    },
  });
}

/**
 * The ONE place the client-side shipping estimate is computed — must mirror
 * place_order's rule exactly (both checkout forms use this, never their own
 * arithmetic). Returns 0 only when a threshold is set and met.
 */
export function resolveShipping(
  wilayaFee: number,
  goodsTotal: number,
  settings: StoreSettings | undefined,
): number {
  const threshold = settings?.free_ship_threshold ?? null;
  if (threshold !== null && goodsTotal >= threshold) return 0;
  return wilayaFee;
}
