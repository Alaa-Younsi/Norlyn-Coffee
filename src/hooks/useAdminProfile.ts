import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AdminProfile } from "@/types/db";

/**
 * The caller's OWN admin_profiles row (RLS: a user may read only their own).
 *
 * This MIRRORS the database gate so the UI hides what the DB would refuse —
 * it is never the boundary itself. Every section's real enforcement is the
 * has_section() policy on each table.
 */
export function useAdminProfile(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["admin-profile", userId],
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
    retry: 0,
    queryFn: async (): Promise<AdminProfile | null> => {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("user_id", userId as string)
        .maybeSingle();
      if (error) throw error;
      return data as AdminProfile | null;
    },
  });

  const profile = query.data ?? null;
  const isOwner = Boolean(profile?.is_owner);
  const isActive = Boolean(profile?.active);

  return {
    profile,
    isOwner,
    isActive,
    isLoading: query.isLoading,
    hasSection: (key: string) => isOwner || Boolean(profile?.sections.includes(key)),
  };
}
