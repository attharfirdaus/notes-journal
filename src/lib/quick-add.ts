import { detectDate, type DateSuggestion } from "./smart-date";
import { addDays, todayInTz, zonedToIso } from "./time";
import type { NoteType, Recurrence } from "./types";

export type QuickAddPlan = {
  title: string;
  type: NoteType;
  items: { text: string; due_at?: string; recurrence?: Recurrence }[];
  date: DateSuggestion | null;
  recurrence?: Recurrence;
};

const EVENT_WORDS =
  /\b(meeting|meet|party|dinner|lunch|breakfast|appointment|class|lecture|concert|wedding|birthday|interview|hangout|webinar|seminar|rapat|acara|janji)\b/i;

// Only the explicit "every …" forms: a bare "daily" or "weekly" is usually an adjective.
const RECURRENCE: [RegExp, Recurrence][] = [
  [/\b(?:every\s*day|(?:setiap|tiap) hari)\b/i, "daily"],
  [/\b(?:every week|(?:setiap|tiap) minggu)\b/i, "weekly"],
  [/\b(?:every month|(?:setiap|tiap) bulan)\b/i, "monthly"],
  // "every friday": weekly, and the weekday is left in place for the date parser.
  [/\bevery\s+(?=(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\b)/i, "weekly"],
];

function splitList(s: string): string[] {
  return s
    .split(/\s*(?:,|;|\n|\s\+\s)\s*/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Turn one line of text into a note:
 * - "Groceries: milk, eggs, bread" → checklist titled Groceries with 3 items
 * - "milk, eggs, bread"            → checklist with 3 items
 * - "Submit report friday 5pm"     → task note with a single due item
 * - anything else                  → free note with that title
 */
export function planQuickAdd(input: string, tz: string, now: Date = new Date()): QuickAddPlan | null {
  const text = input.trim().slice(0, 500);
  if (!text) return null;

  // The colon that separates a title from its list: not the one inside a clock
  // time ("7:30") or a link ("https://").
  const colon = text.search(/(?:(?<!\d):|:(?!\d))(?!\/\/)/);
  if (colon > 0 && colon < text.length - 1) {
    const title = text.slice(0, colon).trim();
    const items = splitList(text.slice(colon + 1));
    if (title && items.length) {
      return { title: capitalize(title).slice(0, 120), type: "checklist", items: items.map((t) => ({ text: t })), date: null };
    }
  }

  const parts = splitList(text);
  if (parts.length >= 2) {
    return { title: "Quick list", type: "checklist", items: parts.map((t) => ({ text: t })), date: null };
  }

  const repeat = RECURRENCE.find(([re]) => re.test(text));
  const rest = repeat ? text.replace(repeat[0], " ").replace(/\s{2,}/g, " ").trim() : text;
  const date = detectDate(rest, tz, now);
  const cleaned = date ? date.cleaned : repeat ? rest : "";
  if (cleaned) {
    const title = capitalize(cleaned).slice(0, 120);
    // A repeat with no date starts tomorrow at 09:00 local.
    const [y, m, d] = addDays(todayInTz(tz, now), 1).split("-").map(Number);
    const due_at = date?.iso ?? zonedToIso(tz, y, m, d, 9);
    return {
      title,
      type: EVENT_WORDS.test(cleaned) ? "schedule" : "tasks",
      items: [{ text: title, due_at, ...(repeat ? { recurrence: repeat[1] } : {}) }],
      date,
      ...(repeat ? { recurrence: repeat[1] } : {}),
    };
  }

  return { title: capitalize(text).slice(0, 120), type: "free", items: [], date: null };
}
