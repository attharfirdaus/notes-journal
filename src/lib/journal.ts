import { Angry, Frown, Laugh, Meh, Smile, type LucideIcon } from "lucide-react";

export const MOODS: { value: number; Icon: LucideIcon; label: string; color: string }[] = [
  { value: 1, Icon: Angry, label: "Awful", color: "#8B9CF7" },
  { value: 2, Icon: Frown, label: "Meh", color: "#7CC4F2" },
  { value: 3, Icon: Meh, label: "Okay", color: "#B8C2CC" },
  { value: 4, Icon: Smile, label: "Good", color: "#8EDB8A" },
  { value: 5, Icon: Laugh, label: "Amazing", color: "#FFC857" },
];

export function moodInfo(value: number | null | undefined) {
  return MOODS.find((m) => m.value === value) ?? null;
}

export const FEELINGS = [
  "grateful",
  "calm",
  "excited",
  "proud",
  "loved",
  "hopeful",
  "productive",
  "creative",
  "tired",
  "stressed",
  "anxious",
  "lonely",
  "bored",
  "overwhelmed",
  "sick",
  "silly",
] as const;

export const PROMPTS = [
  "What made you smile today?",
  "What's one thing you're grateful for right now?",
  "What was the best part of your day?",
  "What's something you learned today?",
  "Who made your day a little better?",
  "What's weighing on your mind?",
  "What would make tomorrow great?",
  "Describe today in three words.",
  "What's a small win you had today?",
  "What did you do today just for yourself?",
  "What's something you're looking forward to?",
  "If today were a song, what would it be?",
  "What challenged you today, and how did you handle it?",
  "What's a kind thing someone did (or you did) today?",
  "What's one thing you'd like to let go of?",
  "What surprised you today?",
  "Where did you feel most like yourself today?",
  "What's a tiny detail from today you want to remember?",
  "What are you proud of this week?",
  "If you could redo one moment today, what would it be?",
  "What did your body need today?",
  "What's something that made you laugh recently?",
  "Write a short note to yourself one year from now.",
  "What's a question you've been thinking about lately?",
];

export function randomPrompt(exclude?: string | null, rand: () => number = Math.random): string {
  const pool = PROMPTS.filter((p) => p !== exclude);
  return pool[Math.floor(rand() * pool.length)];
}
