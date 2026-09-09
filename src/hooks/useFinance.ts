import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  Expense,
  LedgerScope,
  Order,
  ProductCost,
  StockPurchase,
  Supplier,
} from "@/types/db";

/**
 * Fetches every order WITH its lines once and filters in the browser: the
 * range control is flicked constantly while reading the dashboard, and one
 * cached fetch beats a round-trip per click at single-store volumes.
 * Revisit past a few thousand orders (paginate or aggregate server-side).
 */
export function useOrdersLedger() {
  return useQuery({
    queryKey: ["orders-ledger"],
    staleTime: 1000 * 60,
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      // normalise the later-migration column here, not in the UI
      return (data ?? []).map((order) => ({
        ...(order as Order),
        order_items: ((order as Order).order_items ?? []).map((item) => ({
          ...item,
          unit_cost: Number(item.unit_cost ?? 0),
        })),
      }));
    },
  });
}

/* ---------------------------------------------------------- product costs */

export interface ProductCostRow extends ProductCost {
  product?: {
    id: string;
    name_fr: string;
    name_ar: string;
    name_en: string | null;
    price: number;
    slug: string;
  } | null;
}

export function useProductCosts() {
  return useQuery({
    queryKey: ["product-costs"],
    queryFn: async (): Promise<ProductCostRow[]> => {
      const { data, error } = await supabase
        .from("product_costs")
        .select("*, product:products(id, name_fr, name_ar, name_en, price, slug)");
      if (error) throw error;
      return (data ?? []) as ProductCostRow[];
    },
  });
}

/**
 * UPSERT, never update: products created before the cost backfill — or by a
 * worker holding only `products` — have no cost row yet.
 */
export function useSaveProductCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: {
      product_id: string;
      cost_price: number;
      supplier_id: string | null;
    }) => {
      const { error } = await supabase
        .from("product_costs")
        .upsert(row, { onConflict: "product_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["product-costs"] });
    },
  });
}

/* -------------------------------------------------------------- suppliers */

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Supplier[];
    },
  });
}

export function useSaveSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: Partial<Supplier> & { name: string }) => {
      const { id, created_at: _created, ...values } = draft;
      void _created;
      if (id) {
        const { error } = await supabase.from("suppliers").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

/* -------------------------------------------------------------- purchases */

export function useStockPurchases(scope: LedgerScope) {
  return useQuery({
    queryKey: ["stock-purchases", scope],
    queryFn: async (): Promise<StockPurchase[]> => {
      const { data, error } = await supabase
        .from("stock_purchases")
        .select("*")
        .eq("scope", scope)
        .order("purchased_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as StockPurchase[];
    },
  });
}

export function useSavePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: Partial<StockPurchase> & { scope: LedgerScope }) => {
      const { id, total_cost: _total, created_at: _created, ...values } = draft;
      void _total;
      void _created;
      if (id) {
        const { error } = await supabase.from("stock_purchases").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("stock_purchases").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stock-purchases"] });
    },
  });
}

/**
 * A SEPARATE action from saving the purchase. Back-dated paperwork for stock
 * already counted in is the common case, and silently re-adding it inflates
 * the catalogue every time the owner catches up on invoices. One extra click
 * beats a wrong stock count.
 */
export function useApplyPurchaseToStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (purchase: StockPurchase) => {
      // ONE atomic `stock = stock + delta` in the DB (apply_stock_delta RPC),
      // not a SELECT-then-UPDATE from the browser: the old two round-trips lost
      // the increment whenever an order decrement, a cancel-restock or another
      // purchase landed in between.
      const targetId =
        purchase.scope === "online" ? purchase.product_id : purchase.store_product_id;
      if (!targetId) return;
      const { error } = await supabase.rpc("apply_stock_delta", {
        p_scope: purchase.scope,
        p_id: targetId,
        p_delta: purchase.quantity,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-products"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stock_purchases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["stock-purchases"] }),
  });
}

/* --------------------------------------------------------------- expenses */

export function useExpenses(scope: LedgerScope) {
  return useQuery({
    queryKey: ["expenses", scope],
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("scope", scope)
        .order("spent_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });
}

export function useSaveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: Partial<Expense> & { scope: LedgerScope; label: string }) => {
      const { id, created_at: _created, ...values } = draft;
      void _created;
      if (id) {
        const { error } = await supabase.from("expenses").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expenses").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  });
}
