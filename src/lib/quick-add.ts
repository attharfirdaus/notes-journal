import { detectDate, type DateSuggestion } from "./smart-date";
import type { NoteType } from "./types";

export type QuickAddPlan = {
  title: string;
  type: NoteType;
  items: { text: string; due_at?: string }[];
  date: DateSuggestion | null;
};

const EVENT_WORDS =
  /\b(meeting|meet|party|dinner|lunch|breakfast|appointment|class|lecture|concert|wedding|birthday|interview|call|hangout|webinar|seminar|rapat|acara|janji)\b/i;

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

  const colon = text.indexOf(":");
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

  const date = detectDate(text, tz, now);
  if (date && date.cleaned) {
    const title = capitalize(date.cleaned).slice(0, 120);
    return {
      title,
      type: EVENT_WORDS.test(date.cleaned) ? "schedule" : "tasks",
      items: [{ text: title, due_at: date.iso }],
      date,
    };
  }

  return { title: capitalize(text).slice(0, 120), type: "free", items: [], date: null };
}
