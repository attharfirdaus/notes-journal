import "server-only";
import { createClient } from "./supabase/server";
import type { ActivitySummary, StreakInfo } from "./types";

export async function getStreak(): Promise<StreakInfo> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_streak");
  return (data as StreakInfo) ?? { current: 0, longest: 0, freezes: 0, wrote_today: false, used_freeze: false, today: "" };
}

export async function getActivity(): Promise<ActivitySummary> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_activity_summary");
  return (
    (data as ActivitySummary) ?? {
      total_active_days: 0, last_active_day: null, tasks_done_today: 0, overdue: 0, focus_today: 0,
      wrote_today: false, last_mood: null, today: "",
    }
  );
}
