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
  const isDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
  const supabase = await createClient();

  // Whether the date is in the future can only be decided once the profile's
  // time zone is known, but the entry for a concrete date can be read straight
  // away — so both go out at once. "today" and malformed dates redirect below
  // and never need the query.
  const [profile, entry] = await Promise.all([
    requireProfile(),
    isDate
      ? supabase
          .from("journal_entries")
          .select("id,entry_date,content,mood,feelings,prompt,counts_for_streak,updated_at")
          .eq("entry_date", date)
          .maybeSingle()
      : null,
  ]);

  const today = todayInTz(profile.timezone);
  if (date === "today") redirect(`/journal/${today}`);
  if (!isDate) notFound();
  if (date > today) redirect(`/journal/${today}`);

  return <JournalEditor key={date} date={date} today={today} entry={(entry?.data as JournalEntry | null) ?? null} />;
}
