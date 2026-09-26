import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getStreak } from "@/lib/home-data";
import { MOODS, moodInfo } from "@/lib/journal";
import { plainSnippet } from "@/lib/markdown";
import { formatDate, todayInTz } from "@/lib/time";
import type { JournalEntry } from "@/lib/types";
import { StreakCard } from "@/components/streak-card";
import { EmptyState, PageHeader } from "@/components/ui";
import { JournalCalendar } from "./journal-calendar";
import { JournalFilters } from "./journal-filters";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage({ searchParams }: PageProps<"/journal">) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const mood = typeof sp.mood === "string" ? Number(sp.mood) : 0;
  const view = sp.view === "calendar" ? "calendar" : "list";
  const today = todayInTz(profile.timezone);

  const supabase = await createClient();
  let query = supabase
    .from("journal_entries")
    .select("id,entry_date,content,mood,feelings,prompt,counts_for_streak,updated_at")
    .order("entry_date", { ascending: false })
    .limit(view === "calendar" ? 400 : 100);
  if (q) query = query.ilike("content", `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
  if (mood >= 1 && mood <= 5) query = query.eq("mood", mood);

  const [{ data }, streak] = await Promise.all([query, getStreak()]);
  const entries = (data ?? []) as JournalEntry[];
  const wroteToday = entries.some((e) => e.entry_date === today) || streak.wrote_today;

  return (
    <div>
      <PageHeader title="Journal" emoji="📔">
        <Link
          href="/journal/today"
          className="btn-pop inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 font-bold text-primary-ink"
        >
          {wroteToday ? "✏️ Continue today" : "✍️ Write today"}
        </Link>
      </PageHeader>

      <div className="mb-5">
        <StreakCard streak={streak} />
      </div>

      <JournalFilters q={q} mood={mood} view={view} />

      {entries.length === 0 ? (
        <div className="mt-6">
          {q || mood ? (
            <EmptyState emoji="🔍" title="No entries match">
              Try a different word or mood.
            </EmptyState>
          ) : (
            <EmptyState emoji="📔" title="Your journal is waiting">
              Every story starts with a single line. How was today?
            </EmptyState>
          )}
        </div>
      ) : view === "calendar" ? (
        <div className="mt-5">
          <JournalCalendar entries={entries.map((e) => ({ date: e.entry_date, mood: e.mood }))} today={today} />
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {entries.map((e) => {
            const m = moodInfo(e.mood);
            return (
              <li key={e.id}>
                <Link
                  href={`/journal/${e.entry_date}`}
                  className="flex gap-3 rounded-blob border-2 border-line bg-card p-4 shadow-soft transition hover:-translate-y-0.5"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: m ? `${m.color}66` : "var(--soft)" }}
                  >
                    {m?.emoji ?? "📝"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-display text-lg font-bold">
                        {e.entry_date === today ? "Today" : formatDate(e.entry_date, { weekday: "long", month: "short", day: "numeric", year: e.entry_date.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric" })}
                      </span>
                      {e.counts_for_streak ? <span className="text-xs" title="Counted toward your streak">🔥</span> : null}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-ink-soft">
                      {plainSnippet(e.content) || <em>Just a mood today.</em>}
                    </span>
                    {e.feelings.length ? (
                      <span className="mt-1.5 flex flex-wrap gap-1">
                        {e.feelings.map((f) => (
                          <span key={f} className="rounded-full bg-soft px-2 py-0.5 text-xs font-bold">
                            {f}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-6 text-center text-xs text-ink-soft">
        Mood key: {MOODS.map((m) => `${m.emoji} ${m.label}`).join(" · ")}
      </p>
    </div>
  );
}
