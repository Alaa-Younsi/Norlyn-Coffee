import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AdminActivity, AdminActivityAction, TeamOverviewRow } from "@/types/db";

const PAGE_SIZE = 50;

/** Owner-only (the RPC raises for anyone else) — gate `enabled` on isOwner. */
export function useTeamOverview(enabled = true) {
  return useQuery({
    queryKey: ["admin-team-overview"],
    enabled,
    queryFn: async (): Promise<TeamOverviewRow[]> => {
      const { data, error } = await supabase.rpc("admin_team_overview");
      if (error) throw error;
      return ((data ?? []) as TeamOverviewRow[]).map((row) => ({
        ...row,
        // bigint arrives as a string from PostgREST
        actions_7d: Number(row.actions_7d),
      }));
    },
  });
}

export interface ActivityFilters {
  actorId: string | null;
  /** tables to keep; null = every table */
  tables: string[] | null;
  kind: "all" | "changes" | "login";
}

const CHANGE_ACTIONS: AdminActivityAction[] = ["insert", "update", "delete"];

/** Newest first, 50 at a time; RLS limits the table to owners. */
export function useActivityLog(filters: ActivityFilters) {
  return useInfiniteQuery({
    queryKey: ["admin-activity", filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<AdminActivity[]> => {
      let query = supabase
        .from("admin_activity")
        .select("*")
        .order("at", { ascending: false })
        .order("id", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);
      if (filters.actorId) query = query.eq("actor_id", filters.actorId);
      if (filters.kind === "login") query = query.eq("action", "login");
      if (filters.kind === "changes") query = query.in("action", CHANGE_ACTIONS);
      if (filters.tables) query = query.in("table_name", filters.tables);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AdminActivity[];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < PAGE_SIZE ? undefined : pages.length * PAGE_SIZE,
  });
}
