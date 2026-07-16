import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ClientReview } from "@/types/db";

const FALLBACK_REVIEWS: ClientReview[] = [
  {
    id: "fb-r1",
    client_name: "Yasmine B.",
    stars: 5,
    review_text: "La crema est incroyable, on se croirait au café. Livraison rapide à Alger.",
    image_url: null,
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "fb-r2",
    client_name: "Karim H.",
    stars: 5,
    review_text: "Le Ristretto Noir est exactement ce que je cherchais. Très intense.",
    image_url: null,
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "fb-r3",
    client_name: "Amel Z.",
    stars: 4,
    review_text: "Très bon rapport qualité-prix, le Lungo Doré est parfait le matin.",
    image_url: null,
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
];

export function useReviews() {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: async (): Promise<ClientReview[]> => {
      if (!isSupabaseConfigured) return FALLBACK_REVIEWS;
      const { data, error } = await supabase
        .from("client_reviews")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as ClientReview[];
    },
  });
}
