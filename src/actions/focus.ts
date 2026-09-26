"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authed } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

const Session = z.object({
  started_at: z.iso.datetime({ offset: true }),
  duration_min: z.int().min(1).max(180),
  item_id: z.uuid().nullable(),
});

export async function saveFocusSession(input: z.infer<typeof Session>): Promise<ActionResult> {
  const parsed = Session.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { supabase } = await authed();
  const { error } = await supabase.from("focus_sessions").insert({ ...parsed.data, completed: true });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/home");
  return { ok: true, data: null };
}
