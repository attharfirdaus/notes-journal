import { daysBetween } from "./time";
import type { ActivitySummary } from "./types";

export type PetStage = "acorn" | "kit" | "scout" | "keeper";
export type PetMood = "ecstatic" | "happy" | "neutral" | "sleepy" | "sad";

export const STAGES: { stage: PetStage; label: string; minDays: number; blurb: string }[] = [
  { stage: "acorn", label: "Acorn", minDays: 0, blurb: "Check something off or write in your journal to hatch it!" },
  { stage: "kit", label: "Kit", minDays: 1, blurb: "A tiny, curious squirrel!" },
  { stage: "scout", label: "Scout", minDays: 7, blurb: "Brave explorer with a trusty scarf." },
  { stage: "keeper", label: "Keeper", minDays: 30, blurb: "Wise guardian of your acorn stash." },
];

/** Evolution depends on total active days (never lost when a streak breaks). */
export function petStage(totalActiveDays: number) {
  let idx = 0;
  STAGES.forEach((s, i) => {
    if (totalActiveDays >= s.minDays) idx = i;
  });
  const current = STAGES[idx];
  const next = STAGES[idx + 1] ?? null;
  const progress = next
    ? (totalActiveDays - current.minDays) / (next.minDays - current.minDays)
    : 1;
  return {
    ...current,
    next,
    daysToNext: next ? next.minDays - totalActiveDays : 0,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

/** Mood is a gentle reflection of today — never a punishment. */
export function petMood(a: Pick<
  ActivitySummary,
  "wrote_today" | "tasks_done_today" | "overdue" | "focus_today" | "last_active_day" | "today"
>): PetMood {
  if (!a.last_active_day) return "neutral";
  const idle = daysBetween(a.last_active_day, a.today);
  if (idle >= 3) return "sleepy";

  const score =
    (a.wrote_today ? 2 : 0) +
    Math.min(a.tasks_done_today, 3) * 0.7 +
    (a.focus_today > 0 ? 1 : 0) -
    Math.min(a.overdue, 3) * 0.6;

  if (score >= 3.5) return "ecstatic";
  if (score >= 1.4) return "happy";
  if (idle >= 1 && score <= 0) return "sleepy";
  if (score < -1) return "sad";
  return "neutral";
}

export const MOOD_LINES: Record<PetMood, string> = {
  ecstatic: "is bouncing off the walls!",
  happy: "is feeling cheerful.",
  neutral: "is hanging out.",
  sleepy: "is a little sleepy… come play!",
  sad: "misses you. Check one thing off?",
};
