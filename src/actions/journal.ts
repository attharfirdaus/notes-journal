"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authed } from "@/lib/auth";
import { FEELINGS } from "@/lib/journal";
import type { ActionResult, StreakInfo } from "@/lib/types";

const Entry = z.object({
  entry_date: z.iso.date(),
  content: z.string().max(20000),
  mood: z.int().min(1).max(5).nullable(),
  feelings: z.array(z.enum(FEELINGS)).max(10),
  prompt: z.string().max(200).nullable(),
});

export async function saveJournal(
  input: z.infer<typeof Entry>,
): Promise<ActionResult<{ id: string; streak: StreakInfo; created: boolean }>> {
  const parsed = Entry.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { supabase } = await authed();
  const e = parsed.data;

  const { data: existing } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("entry_date", e.entry_date)
    .maybeSingle();
  let id: string;
  if (existing) {
    const { error } = await supabase
      .from("journal_entries")
      .update({ content: e.content, mood: e.mood, feelings: e.feelings, prompt: e.prompt })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    id = existing.id;
  } else {
    if (!e.content.trim() && e.mood === null) return { ok: false, error: "Write something or pick a mood first" };
    const { data, error } = await supabase.from("journal_entries").insert(e).select("id").single();
    if (error)
      return {
        ok: false,
        error: error.message.includes("future") ? "You can't journal the future (yet) " : error.message,
      };
    id = data.id;
  }
  const { data: streak } = await supabase.rpc("get_streak");
  revalidatePath("/journal");
  revalidatePath("/home");
  return { ok: true, data: { id, streak: streak as StreakInfo, created: !existing } };
}

export async function deleteJournal(entryDate: string): Promise<ActionResult> {
  const date = z.iso.date().parse(entryDate);
  const { supabase } = await authed();
  const { error } = await supabase.from("journal_entries").delete().eq("entry_date", date);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/journal");
  return { ok: true, data: null };
}
