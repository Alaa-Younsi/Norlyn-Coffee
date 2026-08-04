import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { MetaPixel } from "@/types/db";

/**
 * Storefront: every page mounts this, and campaign config changes rarely.
 * `retry: 0` so a project whose DB hasn't run the migration yet degrades to
 * "no pixels" instead of hammering PostgREST.
 */
export function useActivePixels() {
  return useQuery({
    queryKey: ["meta-pixels", "active"],
    enabled: isSupabaseConfigured,
    staleTime: 1000 * 60 * 60,
    retry: 0,
    queryFn: async (): Promise<MetaPixel[]> => {
      const { data, error } = await supabase
        .from("meta_pixels")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MetaPixel[];
    },
  });
}

export function useAllPixelsAdmin() {
  return useQuery({
    queryKey: ["meta-pixels", "admin"],
    queryFn: async (): Promise<MetaPixel[]> => {
      const { data, error } = await supabase
        .from("meta_pixels")
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as MetaPixel[];
    },
  });
}

export type PixelDraft = Partial<MetaPixel> & { pixel_id: string; label: string };

export function useSavePixel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: PixelDraft) => {
      const { id, created_at: _created, updated_at: _updated, ...values } = draft;
      void _created;
      void _updated;
      if (id) {
        const { error } = await supabase.from("meta_pixels").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meta_pixels").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["meta-pixels"] }),
  });
}

export function useDeletePixel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meta_pixels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["meta-pixels"] }),
  });
}
