import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { NewsletterSubscriber, SubscriberStatus } from "@/types/db";

/**
 * The mailing list.
 *
 * The storefront can only ever WRITE, and only through the SECURITY DEFINER
 * RPC — `newsletter_subscribers` has no anon policy in either direction, so a
 * direct `.from(...)` from the shop would be refused (see migration 0010). The
 * admin reads it as `authenticated`, gated on `has_section('newsletter')`.
 */

/* --------------------------------------------------------------- storefront */

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: async (payload: { email: string; source?: string }) => {
      if (!isSupabaseConfigured) {
        // With no backend there is nowhere to put the address. Failing loudly
        // is the honest option: a form that says "thank you" and drops the
        // signup is worse than one that admits the shop isn't wired up yet.
        throw new Error("ERR_NOT_CONFIGURED");
      }
      const { error } = await supabase.rpc("subscribe_newsletter", {
        payload: { source: "site", ...payload },
      });
      if (error) throw error;
    },
  });
}

/* -------------------------------------------------------------------- admin */

export function useSubscribers() {
  return useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: async (): Promise<NewsletterSubscriber[]> => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as NewsletterSubscriber[];
    },
  });
}

export function useSetSubscriberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SubscriberStatus }) => {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({
          status,
          // stamped here rather than by a trigger: it is a plain audit field,
          // and the admin toggling a row is the only thing that sets it
          unsubscribed_at: status === "unsubscribed" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] }),
  });
}

export function useDeleteSubscriber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] }),
  });
}
