import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sanitizeSearchTerm } from "@/lib/utils";
import { FALLBACK_PRODUCTS } from "@/data/fallback";
import type { Product } from "@/types/db";

interface ProductFilters {
  categoryId?: string;
  search?: string;
  featuredOnly?: boolean;
}

export function useProducts(filters: ProductFilters = {}) {
  const { categoryId, search, featuredOnly } = filters;
  return useQuery({
    queryKey: ["products", categoryId ?? null, search ?? null, featuredOnly ?? false],
    queryFn: async (): Promise<Product[]> => {
      if (!isSupabaseConfigured) {
        let items = FALLBACK_PRODUCTS;
        // mirror every server-side filter, or the shop's chips and the
        // landing's featured row look broken in fallback mode
        if (categoryId) items = items.filter((p) => p.category_id === categoryId);
        if (featuredOnly) items = items.filter((p) => p.featured);
        if (search) {
          const term = search.toLowerCase();
          items = items.filter(
            (p) => p.name_fr.toLowerCase().includes(term) || p.name_ar.includes(term),
          );
        }
        return items;
      }
      let query = supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("status", "active")
        .order("created_at", { ascending: true });
      if (categoryId) query = query.eq("category_id", categoryId);
      if (featuredOnly) query = query.eq("featured", true);
      if (search) {
        const term = sanitizeSearchTerm(search);
        if (term) query = query.or(`name_fr.ilike.%${term}%,name_ar.ilike.%${term}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<Product | null> => {
      if (!isSupabaseConfigured) {
        return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
      }
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("slug", slug as string)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });
}
