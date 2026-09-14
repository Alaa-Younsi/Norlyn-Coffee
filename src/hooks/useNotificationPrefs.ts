import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AdminNotificationPrefs } from "@/types/db";

export function useNotificationPrefs(userId: string | undefined) {
  return useQuery({
    queryKey: ["notification-prefs", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<AdminNotificationPrefs | null> => {
      const { data, error } = await supabase
        .from("admin_notification_prefs")
        .select("*")
        .eq("user_id", userId as string)
        .maybeSingle();
      if (error) throw error;
      return data as AdminNotificationPrefs | null;
    },
  });
}

export function useSaveNotificationPrefs(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      values: Omit<AdminNotificationPrefs, "user_id" | "updated_at">,
    ) => {
      if (!userId) throw new Error("no user");
      const { error } = await supabase
        .from("admin_notification_prefs")
        .upsert({ user_id: userId, ...values, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notification-prefs", userId] });
    },
  });
}
