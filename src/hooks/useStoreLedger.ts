import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { StoreProduct, StoreSale } from "@/types/db";

/* ------------------------------------------------------ the shop catalogue */

export function useStoreProducts() {
  return useQuery({
    queryKey: ["store-products"],
    queryFn: async (): Promise<StoreProduct[]> => {
      const { data, error } = await supabase.from("store_products").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as StoreProduct[];
    },
  });
}

export function useSaveStoreProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: Partial<StoreProduct> & { name: string }) => {
      const { id, created_at: _created, updated_at: _updated, ...values } = draft;
      void _created;
      void _updated;
      if (id) {
        const { error } = await supabase.from("store_products").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_products").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["store-products"] }),
  });
}

export function useDeleteStoreProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["store-products"] }),
  });
}

/* ------------------------------------------------------------- the counter */

export function useStoreSales() {
  return useQuery({
    queryKey: ["store-sales"],
    staleTime: 1000 * 60,
    queryFn: async (): Promise<StoreSale[]> => {
      const { data, error } = await supabase
        .from("store_sales")
        .select("*, store_sale_items(*)")
        .order("sold_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []).map((sale) => ({
        ...(sale as StoreSale),
        store_sale_items: (sale as StoreSale).store_sale_items ?? [],
      }));
    },
  });
}

export interface StoreSaleDraftLine {
  store_product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  unit_cost?: number;
}

export interface StoreSaleDraft {
  customer_name?: string;
  customer_phone?: string;
  discount?: number;
  payment_method?: string;
  sold_at?: string;
  notes?: string;
}

/** Header, lines and stock decrements land together inside the RPC. */
export function useCreateStoreSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sale,
      items,
    }: {
      sale: StoreSaleDraft;
      items: StoreSaleDraftLine[];
    }): Promise<string> => {
      const { data, error } = await supabase.rpc("create_store_sale", { sale, items });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-sales"] });
      // the RPC decremented catalogue stock
      void queryClient.invalidateQueries({ queryKey: ["store-products"] });
    },
  });
}

/**
 * Deleting the header is enough: lines cascade and the BEFORE DELETE trigger
 * gives the units back. (The website side deliberately does NOT restock on
 * delete — that fires on the *cancelled* transition.)
 */
export function useDeleteStoreSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_sales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-sales"] });
      void queryClient.invalidateQueries({ queryKey: ["store-products"] });
    },
  });
}

/** Maps an RPC error message to a translation key suffix. */
export function storeSaleErrorKey(message: string): string {
  if (message.includes("ERR_FORBIDDEN")) return "forbidden";
  if (message.includes("ERR_EMPTY_SALE")) return "empty";
  if (message.includes("ERR_INVALID_QTY")) return "qty";
  if (message.includes("ERR_ITEM_NOT_FOUND")) return "notFound";
  if (message.includes("ERR_OUT_OF_STOCK")) return "stock";
  return "generic";
}
