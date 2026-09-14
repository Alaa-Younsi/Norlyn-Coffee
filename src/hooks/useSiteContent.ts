import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { FALLBACK_ARTICLES } from "@/data/journal";
import { FALLBACK_HERO_SLIDES } from "@/data/slides";
import { FALLBACK_SITE_IMAGES } from "@/data/siteImages";
import { videoSlot, videoSlotFallback } from "@/lib/videoSlots";
import type {
  Article,
  ContactMessage,
  MediaSlide,
  MessageStatus,
  SiteImage,
  SiteVideo,
  SlidePlacement,
} from "@/types/db";

/* ------------------------------------------------------------ media slides */

export function useMediaSlides(placement: SlidePlacement) {
  return useQuery({
    queryKey: ["media-slides", placement],
    retry: 0,
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<MediaSlide[]> => {
      if (!isSupabaseConfigured) {
        return placement === "hero" ? FALLBACK_HERO_SLIDES : [];
      }
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
    retry: 0,
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<Record<string, SiteImage>> => {
      if (!isSupabaseConfigured) return FALLBACK_SITE_IMAGES;
      const { data, error } = await supabase.from("site_images").select("*");
      if (error) throw error;
      return Object.fromEntries(((data ?? []) as SiteImage[]).map((row) => [row.slot, row]));
    },
  });
}

export function useSaveSiteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: {
      slot: string;
      url: string;
      alt_fr?: string;
      alt_ar?: string;
      alt_en?: string;
    }) => {
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

/* ------------------------------------------------------------- site videos */

export function useSiteVideos() {
  return useQuery({
    queryKey: ["site-videos"],
    retry: 0,
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<Record<string, SiteVideo>> => {
      // no project wired up = no uploads exist, and every slot falls through
      // to the committed drop-in film. An empty map says exactly that.
      if (!isSupabaseConfigured) return {};
      const { data, error } = await supabase.from("site_videos").select("*");
      if (error) throw error;
      return Object.fromEntries(((data ?? []) as SiteVideo[]).map((row) => [row.slot, row]));
    },
  });
}

/**
 * What actually plays in a slot, resolved once for every caller.
 *
 * The order is the contract described in lib/videoSlots.ts: the client's
 * upload wins, then the committed drop-in file, and the poster is whatever
 * still goes with whichever of those two won. `custom` tells a caller whether
 * it is looking at an admin-managed film — HeroVideo uses it to decide whether
 * a hero slide's poster may stand in.
 */
export function useVideoSlot(slot: string): {
  src: string;
  poster: string;
  custom: boolean;
} {
  const { data: videos } = useSiteVideos();
  const definition = videoSlot(slot);
  const row = videos?.[slot];
  const fallback = definition
    ? videoSlotFallback(definition)
    : { src: "", poster: "" };

  return {
    src: row?.url ?? fallback.src,
    poster: row?.poster_url ?? fallback.poster,
    custom: Boolean(row),
  };
}

export function useSaveSiteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: { slot: string; url: string; poster_url?: string | null }) => {
      const { error } = await supabase.from("site_videos").upsert(row, { onConflict: "slot" });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["site-videos"] }),
  });
}

export function useClearSiteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slot: string) => {
      const { error } = await supabase.from("site_videos").delete().eq("slot", slot);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["site-videos"] }),
  });
}

/* ---------------------------------------------------------------- articles */

export function usePublishedArticles() {
  return useQuery({
    queryKey: ["articles", "published"],
    retry: 0,
    queryFn: async (): Promise<Article[]> => {
      // the launch set ships in the bundle too, so the Journal is designed
      // against real articles in local dev / previews (migration 0009 seeds
      // the same rows into Supabase, where they become editable)
      if (!isSupabaseConfigured) return FALLBACK_ARTICLES;
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
    enabled: Boolean(slug),
    retry: 0,
    queryFn: async (): Promise<Article | null> => {
      if (!isSupabaseConfigured) {
        return FALLBACK_ARTICLES.find((entry) => entry.slug === slug) ?? null;
      }
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

/**
 * Storefront submit — goes through the SECURITY DEFINER RPC, never a direct
 * insert. Returns the new row's id so the caller can fire the best-effort
 * staff notification (see Contact.tsx) with something to claim.
 */
export function useSubmitContactMessage() {
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email?: string;
      phone?: string;
      subject?: string;
      message: string;
    }): Promise<string> => {
      const { data, error } = await supabase.rpc("submit_contact_message", { payload });
      if (error) throw error;
      return data as string;
    },
  });
}
