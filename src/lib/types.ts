// Row shapes mirroring supabase/migrations. Kept by hand; update both together.

export type ThemeId = "sunny" | "ocean" | "forest" | "candy" | "midnight";
export type ColorMode = "light" | "dark" | "system";
export type Vibe = "none" | "bubbles" | "leaves" | "stars" | "rain";
export type NoteType = "checklist" | "tasks" | "schedule" | "free";
export type NoteStatus = "active" | "completed" | "archived";
export type Recurrence = "daily" | "weekly";

export type Profile = {
  id: string;
  display_name: string;
  timezone: string;
  theme: ThemeId;
  color_mode: ColorMode;
  vibe: Vibe;
  reduce_motion: boolean;
  sound_effects: boolean;
  pet_name: string;
  reminder_defaults: number[];
  schedule_reminder: number;
  journal_nudge_time: string | null;
  onboarded: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  is_default: boolean;
};

export type NoteCategoryLink = { category_id: string; source: "auto" | "manual" };

export type Note = {
  id: string;
  title: string;
  description: string;
  type: NoteType;
  icon: string;
  color: string;
  status: NoteStatus;
  pinned: boolean;
  categories_locked: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteItem = {
  id: string;
  note_id: string;
  text: string;
  is_done: boolean;
  done_at: string | null;
  position: number;
  quantity: string | null;
  due_at: string | null;
  remind_offsets: number[] | null;
  recurrence: Recurrence | null;
};

export type HomeItem = {
  id: string;
  note_id: string;
  note_title: string;
  note_icon: string;
  text: string;
  due_at: string;
  is_done: boolean;
  bucket: "overdue" | "today" | "upcoming";
};

export type JournalEntry = {
  id: string;
  entry_date: string;
  content: string;
  mood: number | null;
  feelings: string[];
  prompt: string | null;
  counts_for_streak: boolean;
  updated_at: string;
};

export type StreakInfo = {
  current: number;
  longest: number;
  freezes: number;
  wrote_today: boolean;
  used_freeze: boolean;
  today: string;
};

export type ActivitySummary = {
  total_active_days: number;
  last_active_day: string | null;
  tasks_done_today: number;
  overdue: number;
  focus_today: number;
  wrote_today: boolean;
  last_mood: number | null;
  today: string;
};

export type AppNotification = {
  id: string;
  kind: "reminder" | "capsule" | "nudge" | "system";
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type TimeCapsule = {
  id: string;
  title: string;
  mood: number | null;
  open_at: string;
  opened_at: string | null;
  created_at: string;
};

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };
