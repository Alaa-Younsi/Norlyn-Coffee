import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  Article,
  ContactMessage,
  MediaSlide,
  MessageStatus,
  SiteImage,
  SlidePlacement,
} from "@/types/db";

/* ------------------------------------------------------------ media slides */

export function useMediaSlides(placement: SlidePlacement) {
  return useQuery({
    queryKey: ["media-slides", placement],
    enabled: isSupabaseConfigured,
    retry: 0,
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<MediaSlide[]> => {
      const { data, error } = await supabase
        .from("media_slides")
        .select("*")
        .eq("placement", placement)
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MediaSlide[];
    },
  });
}

export function useAllSlidesAdmin() {
  return useQuery({
    queryKey: ["media-slides", "admin"],
    queryFn: async (): Promise<MediaSlide[]> => {
      const { data, error } = await supabase
        .from("media_slides")
        .select("*")
        .order("placement")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as MediaSlide[];
    },
  });
}

export function useSaveSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: Partial<MediaSlide> & { url: string }) => {
      const { id, created_at: _created, updated_at: _updated, ...values } = draft;
      void _created;
      void _updated;
      if (id) {
        const { error } = await supabase.from("media_slides").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("media_slides").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["media-slides"] }),
  });
}

export function useDeleteSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("media_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["media-slides"] }),
  });
}

/* ------------------------------------------------------------- site images */

export function useSiteImages() {
  return useQuery({
    queryKey: ["site-images"],
    enabled: isSupabaseConfigured,
    retry: 0,
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<Record<string, SiteImage>> => {
      const { data, error } = await supabase.from("site_images").select("*");
      if (error) throw error;
      return Object.fromEntries(((data ?? []) as SiteImage[]).map((row) => [row.slot, row]));
    },
  });
}

export function useSaveSiteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: { slot: string; url: string; alt_fr?: string; alt_ar?: string }) => {
      const { error } = await supabase.from("site_images").upsert(row, { onConflict: "slot" });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["site-images"] }),
  });
}

export function useClearSiteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slot: string) => {
      const { error } = await supabase.from("site_images").delete().eq("slot", slot);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["site-images"] }),
  });
}

/* ---------------------------------------------------------------- articles */

export function usePublishedArticles() {
  return useQuery({
    queryKey: ["articles", "published"],
    enabled: isSupabaseConfigured,
    retry: 0,
    queryFn: async (): Promise<Article[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Article[];
    },
  });
}

export function useArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ["article", slug],
    enabled: Boolean(slug) && isSupabaseConfigured,
    retry: 0,
    queryFn: async (): Promise<Article | null> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug as string)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Article | null;
    },
  });
}

export function useAllArticlesAdmin() {
  return useQuery({
    queryKey: ["articles", "admin"],
    queryFn: async (): Promise<Article[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Article[];
    },
  });
}

export function useSaveArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: Partial<Article> & { slug: string; title_fr: string }) => {
      const { id, created_at: _created, updated_at: _updated, ...values } = draft;
      void _created;
      void _updated;
      if (id) {
        const { error } = await supabase.from("articles").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["articles"] }),
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["articles"] }),
  });
}

/* --------------------------------------------------------- contact inbox */

export function useContactMessages() {
  return useQuery({
    queryKey: ["contact-messages"],
    queryFn: async (): Promise<ContactMessage[]> => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ContactMessage[];
    },
  });
}

export function useUpdateMessageStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MessageStatus }) => {
      const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["contact-messages"] }),
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["contact-messages"] }),
  });
}

/** Storefront submit — goes through the SECURITY DEFINER RPC, never a direct insert. */
export function useSubmitContactMessage() {
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email?: string;
      phone?: string;
      subject?: string;
      message: string;
    }) => {
      const { error } = await supabase.rpc("submit_contact_message", { payload });
      if (error) throw error;
    },
  });
}
