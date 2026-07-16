import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/types/db";

/** Admin-only hooks — require an authenticated session (RLS enforced). */

export function useOrders(statusFilter?: OrderStatus) {
  return useQuery({
    queryKey: ["orders", statusFilter ?? "all"],
    queryFn: async (): Promise<Order[]> => {
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (statusFilter) query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["order", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Order | null> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id as string)
        .maybeSingle();
      if (error) throw error;
      return data as Order | null;
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["order", id] });
      // cancellation restocks products server-side
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
