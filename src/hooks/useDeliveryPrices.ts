import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { DeliveryPrice } from "@/types/db";

export function useDeliveryPrices(activeOnly = true) {
  return useQuery({
    queryKey: ["delivery-prices", activeOnly],
    queryFn: async (): Promise<DeliveryPrice[]> => {
      if (!isSupabaseConfigured) return [];
      let query = supabase.from("delivery_prices").select("*").order("wilaya");
      if (activeOnly) query = query.eq("active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data as DeliveryPrice[];
    },
  });
}
