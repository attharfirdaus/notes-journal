import type { IconKey } from "./icons";
import type { NoteType } from "./types";

export const NOTE_TYPES: { value: NoteType; label: string; icon: IconKey; color: string; hint: string }[] = [
  { value: "checklist", label: "Checklist", icon: "shopping-cart", color: "#FDE68A", hint: "Things to buy or pack" },
  { value: "tasks", label: "Tasks", icon: "check", color: "#BBF7D0", hint: "To-dos with deadlines" },
  { value: "schedule", label: "Schedule", icon: "calendar", color: "#BFDBFE", hint: "Events & appointments" },
  { value: "free", label: "Free list", icon: "note", color: "#FBCFE8", hint: "Ideas, anything goes" },
];

export const NOTE_COLORS = [
  "#FDE68A",
  "#FECACA",
  "#FBCFE8",
  "#DDD6FE",
  "#BFDBFE",
  "#A5F3FC",
  "#BBF7D0",
  "#D9F99D",
  "#FED7AA",
  "#E7E5E4",
];

export const REMINDER_PRESETS: { value: number; label: string }[] = [
  { value: 0, label: "At due time" },
  { value: 10, label: "10 min before" },
  { value: 30, label: "30 min before" },
  { value: 60, label: "1 hour before" },
  { value: 180, label: "3 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 2880, label: "2 days before" },
  { value: 10080, label: "1 week before" },
];

export function reminderLabel(min: number): string {
  return REMINDER_PRESETS.find((p) => p.value === min)?.label ?? `${min} min before`;
}
