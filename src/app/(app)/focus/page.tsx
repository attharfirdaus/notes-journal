import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getActivity } from "@/lib/home-data";
import { petMood, petStage } from "@/lib/pet";
import { PageHeader } from "@/components/ui";
import { FocusTimer } from "./focus-timer";

export const metadata: Metadata = { title: "Focus" };

export default async function FocusPage() {
  const supabase = await createClient();
  const [profile, { data: items }, activity] = await Promise.all([
    requireProfile(),
    supabase
      .from("note_items")
      .select("id,text,due_at,notes!inner(title,icon,status)")
      .eq("is_done", false)
      .neq("notes.status", "archived")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(100),
    getActivity(),
  ]);

  const tasks = (items ?? []).map((i) => {
    const note = (Array.isArray(i.notes) ? i.notes[0] : i.notes) as { title: string; icon: string };
    return { id: i.id, text: i.text, note: note.title };
  });

  return (
    <div>
      <PageHeader title="Focus" icon="ui-focus" />
      <FocusTimer
        tasks={tasks}
        focusToday={activity.focus_today}
        petName={profile.pet_name}
        stage={petStage(activity.total_active_days).stage}
        mood={petMood(activity)}
      />
    </div>
  );
}
