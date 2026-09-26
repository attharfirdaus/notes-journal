import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getActivity, getStreak } from "@/lib/home-data";
import { pickMessage, renderMessage, type MessageContext } from "@/lib/messages";
import { petMood, petStage } from "@/lib/pet";
import { dayPart, formatDate, isoDaysAgo } from "@/lib/time";
import { moodInfo } from "@/lib/journal";
import type { HomeItem } from "@/lib/types";
import { PetCorner } from "./pet-corner";
import { QuickAdd } from "./quick-add";
import { HomeItems } from "./home-items";
import { StreakCard } from "@/components/streak-card";

export const metadata: Metadata = { title: "Home" };

const GREETINGS = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
  night: "Hello, night owl",
} as const;

export default async function HomePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const since = isoDaysAgo(7);

  const [streak, activity, { data: homeItems }, { data: pinned }, { data: history }] = await Promise.all([
    getStreak(),
    getActivity(),
    supabase.rpc("home_items"),
    supabase.from("notes").select("id,title,emoji,color").eq("pinned", true).neq("status", "archived").order("updated_at", { ascending: false }).limit(6),
    supabase.from("message_history").select("message_id").gte("shown_at", since).order("shown_at", { ascending: false }).limit(60),
  ]);

  const part = dayPart(profile.timezone);
  const ctx: MessageContext = {
    dayPart: part,
    lastMood: activity.last_mood,
    streak: streak.current,
    overdue: activity.overdue,
    tasksDoneToday: activity.tasks_done_today,
    wroteToday: activity.wrote_today,
    isNew: activity.total_active_days < 2,
    focusToday: activity.focus_today,
  };
  const recent = (history ?? []).map((h) => h.message_id);
  const msg = pickMessage(ctx, recent);
  await supabase.from("message_history").insert({ message_id: msg.id });

  const stage = petStage(activity.total_active_days);
  const mood = petMood(activity);
  const today = activity.today || streak.today;
  const todayMood = activity.wrote_today ? moodInfo(activity.last_mood) : null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold text-ink-soft">{today ? formatDate(today, { weekday: "long", month: "long", day: "numeric" }) : null}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {GREETINGS[part]}
          {profile.display_name ? `, ${profile.display_name}` : ""}! {part === "night" ? "🌙" : part === "morning" ? "☀️" : "👋"}
        </h1>
      </header>

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <PetCorner
          petName={profile.pet_name}
          stage={stage}
          mood={mood}
          initialMessage={{ id: msg.id, text: renderMessage(msg, { name: profile.display_name, pet: profile.pet_name, streak: streak.current }) }}
          ctx={ctx}
          recent={[msg.id, ...recent]}
          streak={streak.current}
          usedFreeze={streak.used_freeze}
        />
        <div className="space-y-4">
          <StreakCard streak={streak} />
          <Link
            href="/journal/today"
            className="flex items-center gap-3 rounded-blob border-2 border-line bg-card p-4 shadow-soft transition hover:-translate-y-0.5"
          >
            <span className="text-3xl">{todayMood ? todayMood.emoji : "📔"}</span>
            <span>
              <span className="block font-display text-lg font-bold">
                {activity.wrote_today ? "Today's journal is written" : "How was your day?"}
              </span>
              <span className="block text-sm text-ink-soft">
                {activity.wrote_today ? "Tap to add more thoughts" : "Pick a mood and write a line or two"}
              </span>
            </span>
          </Link>
        </div>
      </div>

      <QuickAdd />

      <HomeItems items={(homeItems ?? []) as HomeItem[]} />

      {pinned?.length ? (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">📌 Pinned</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pinned.map((n) => (
              <Link
                key={n.id}
                href={`/notes/${n.id}`}
                className="rounded-2xl border-2 border-line p-3 font-bold shadow-soft transition hover:-translate-y-1 hover:rotate-1"
                style={{ background: `color-mix(in oklab, ${n.color} 55%, var(--card))` }}
              >
                <span className="mr-1.5 text-xl">{n.emoji}</span>
                {n.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
