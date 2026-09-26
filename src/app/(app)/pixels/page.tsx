import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayInTz } from "@/lib/time";
import { PageHeader } from "@/components/ui";
import { PixelsGrid } from "./pixels-grid";

export const metadata: Metadata = { title: "Year in Pixels" };

export default async function PixelsPage({ searchParams }: PageProps<"/pixels">) {
  const profile = await requireProfile();
  const today = todayInTz(profile.timezone);
  const current = Number(today.slice(0, 4));
  const sp = await searchParams;
  const requested = Number(typeof sp.year === "string" ? sp.year : current);
  const year = Number.isInteger(requested) && requested >= 2000 && requested <= current ? requested : current;

  const supabase = await createClient();
  const [{ data }, { data: first }] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("entry_date,mood,content")
      .gte("entry_date", `${year}-01-01`)
      .lte("entry_date", `${year}-12-31`)
      .order("entry_date"),
    supabase.from("journal_entries").select("entry_date").order("entry_date").limit(1).maybeSingle(),
  ]);
  const firstYear = first ? Number(first.entry_date.slice(0, 4)) : current;

  return (
    <div>
      <PageHeader title="Year in Pixels" emoji="🟪" />
      <p className="-mt-3 mb-5 text-ink-soft">One little square for every day — colored by your mood. Watch your year paint itself.</p>
      <PixelsGrid
        year={year}
        today={today}
        minYear={Math.min(firstYear, current)}
        maxYear={current}
        entries={(data ?? []).map((e) => ({ date: e.entry_date, mood: e.mood, snippet: e.content.slice(0, 160) }))}
      />
    </div>
  );
}
