import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayInTz } from "@/lib/time";
import type { JournalEntry } from "@/lib/types";
import { JournalEditor } from "./journal-editor";

export const metadata: Metadata = { title: "Journal entry" };

export default async function JournalEntryPage({ params }: PageProps<"/journal/[date]">) {
  const { date } = await params;
  const profile = await requireProfile();
  const today = todayInTz(profile.timezone);
  if (date === "today") redirect(`/journal/${today}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) notFound();
  if (date > today) redirect(`/journal/${today}`);

  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_entries")
    .select("id,entry_date,content,mood,feelings,prompt,counts_for_streak,updated_at")
    .eq("entry_date", date)
    .maybeSingle();

  return <JournalEditor key={date} date={date} today={today} entry={(data as JournalEntry | null) ?? null} />;
}
