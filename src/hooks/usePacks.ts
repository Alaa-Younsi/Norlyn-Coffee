import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sanitizePricing } from "@/lib/packPricing";
import type { Pack, Product, ProductPage } from "@/types/db";

/**
 * Packs + personalised product pages (migration 0021).
 *
 * Every read tolerates the tables not existing yet (migration not run): the
 * storefront then behaves exactly as before — no packs strip, default product
 * pages — instead of an error screen.
 */

const missingTable = (message: string | undefined) =>
  /relation .* does not exist|Could not find the table|schema cache/i.test(message ?? "");

// -------------------------------------------------------------- storefront
export function usePublishedPacks() {
  return useQuery({
    queryKey: ["packs", "published"],
    queryFn: async (): Promise<Pack[]> => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from("packs")
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) {
        if (missingTable(error.message)) return [];
        throw error;
      }
      return data as Pack[];
    },
  });
}

/** Staff previews drafts too: RLS returns them only to a signed-in editor. */
export function usePackBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["pack", slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<Pack | null> => {
      if (!isSupabaseConfigured || !slug) return null;
      const { data, error } = await supabase.from("packs").select("*").eq("slug", slug).maybeSingle();
      if (error) {
        if (missingTable(error.message)) return null;
        throw error;
      }
      return (data as Pack | null) ?? null;
    },
  });
}

export function useProductPage(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-page", productId],
    enabled: Boolean(productId),
    queryFn: async (): Promise<ProductPage | null> => {
      if (!isSupabaseConfigured || !productId) return null;
      const { data, error } = await supabase
        .from("product_pages")
        .select("*")
        .eq("product_id", productId)
        .eq("enabled", true)
        .maybeSingle();
      if (error) {
        if (missingTable(error.message)) return null;
        throw error;
      }
      return (data as ProductPage | null) ?? null;
    },
  });
}

/** Every product a pack can contain, with images — drafts included for staff. */
export function useCatalogue(includeDrafts = false) {
  return useQuery({
    queryKey: ["catalogue", includeDrafts],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) return [];
      let query = supabase
        .from("products")
        .select("*, product_images(*)")
        .order("created_at", { ascending: true });
      if (!includeDrafts) query = query.eq("status", "active");
      const { data, error } = await query;
      if (error) throw error;
      return (data as Product[]).map((p) => ({
        ...p,
        product_images: [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      }));
    },
  });
}

// -------------------------------------------------------------------- admin
export function useAdminPacks() {
  return useQuery({
    queryKey: ["admin-packs"],
    queryFn: async (): Promise<Pack[]> => {
      const { data, error } = await supabase
        .from("packs")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Pack[];
    },
  });
}

export function useAdminPack(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-pack", id],
    enabled: Boolean(id) && id !== "new",
    queryFn: async (): Promise<Pack | null> => {
      const { data, error } = await supabase.from("packs").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data as Pack | null) ?? null;
    },
  });
}

export type PackInput = Omit<Pack, "id" | "created_at" | "updated_at"> & { id?: string };

export function useSavePack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PackInput): Promise<Pack> => {
      const { id, ...rest } = input;
      const row = { ...rest, pricing: sanitizePricing(rest.pricing) };
      // .select() on every write: RLS filters a denied update to 0 rows with
      // no error, and the admin would see "saved" for nothing
      const query = id
        ? supabase.from("packs").update(row).eq("id", id).select("*")
        : supabase.from("packs").insert(row).select("*");
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("not saved (permission)");
      return data[0] as Pack;
    },
    onSuccess: (pack) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-packs"] });
      void queryClient.invalidateQueries({ queryKey: ["packs"] });
      void queryClient.invalidateQueries({ queryKey: ["pack", pack.slug] });
      queryClient.setQueryData(["admin-pack", pack.id], pack);
    },
  });
}

export function useDeletePack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("packs").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("not deleted (permission)");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-packs"] });
      void queryClient.invalidateQueries({ queryKey: ["packs"] });
    },
  });
}

export function useAdminProductPages() {
  return useQuery({
    queryKey: ["admin-product-pages"],
    queryFn: async (): Promise<ProductPage[]> => {
      const { data, error } = await supabase.from("product_pages").select("*");
      if (error) {
        if (missingTable(error.message)) return [];
        throw error;
      }
      return data as ProductPage[];
    },
  });
}

export function useSaveProductPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<ProductPage, "updated_at">): Promise<ProductPage> => {
      const { data, error } = await supabase
        .from("product_pages")
        .upsert(input, { onConflict: "product_id" })
        .select("*");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("not saved (permission)");
      return data[0] as ProductPage;
    },
    onSuccess: (page) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-product-pages"] });
      void queryClient.invalidateQueries({ queryKey: ["product-page", page.product_id] });
    },
  });
}

export function useDeleteProductPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("product_pages").delete().eq("product_id", productId);
      if (error) throw error;
    },
    onSuccess: (_data, productId) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-product-pages"] });
      void queryClient.invalidateQueries({ queryKey: ["product-page", productId] });
    },
  });
}
