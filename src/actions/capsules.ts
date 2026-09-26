"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authed } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

const Capsule = z.object({
  title: z.string().trim().min(1, "Give it a title").max(80),
  content: z.string().trim().min(1, "Write your letter first").max(10000),
  mood: z.int().min(1).max(5).nullable(),
  open_at: z.iso.datetime({ offset: true }),
});

export async function createCapsule(input: z.infer<typeof Capsule>): Promise<ActionResult> {
  const parsed = Capsule.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (Date.parse(parsed.data.open_at) < Date.now() + 7 * 86400000 - 60000) {
    return { ok: false, error: "Capsules need at least a week to brew ⏳" };
  }
  const { supabase } = await authed();
  const { error } = await supabase.from("time_capsules").insert(parsed.data);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/capsules");
  return { ok: true, data: null };
}

export async function openCapsule(id: string): Promise<ActionResult<{ content: string }>> {
  const cid = z.uuid().parse(id);
  const { supabase } = await authed();
  const { data, error } = await supabase.rpc("open_capsule", { p_id: cid });
  if (error) return { ok: false, error: error.message };
  const row = (data as { content: string }[] | null)?.[0];
  if (!row) return { ok: false, error: "This capsule is still locked 🔒" };
  return { ok: true, data: { content: row.content } };
}

export async function deleteCapsule(id: string): Promise<ActionResult> {
  const { supabase } = await authed();
  const { error } = await supabase.from("time_capsules").delete().eq("id", z.uuid().parse(id));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/capsules");
  return { ok: true, data: null };
}
