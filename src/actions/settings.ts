"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authed } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/time";
import type { ActionResult } from "@/lib/types";

const ProfilePatch = z
  .object({
    display_name: z.string().trim().max(40),
    pet_name: z.string().trim().min(1).max(20),
    timezone: z.string().refine(isValidTimeZone, "Unknown time zone"),
    theme: z.enum(["sunny", "ocean", "forest", "candy", "midnight"]),
    color_mode: z.enum(["light", "dark", "system"]),
    vibe: z.enum(["none", "bubbles", "leaves", "stars", "rain"]),
    reduce_motion: z.boolean(),
    sound_effects: z.boolean(),
    reminder_defaults: z.array(z.int().min(0).max(20160)).max(5),
    schedule_reminder: z.int().min(0).max(10080),
    journal_nudge_time: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable(),
    onboarded: z.literal(true),
  })
  .partial();

export type ProfilePatch = z.infer<typeof ProfilePatch>;

export async function updateProfile(patch: ProfilePatch): Promise<ActionResult> {
  const parsed = ProfilePatch.safeParse(patch);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = { ...parsed.data };
  if (data.reminder_defaults) data.reminder_defaults = [...new Set(data.reminder_defaults)].sort((a, b) => b - a);

  const { supabase, uid } = await authed();
  const { error } = await supabase.from("profiles").update(data).eq("id", uid);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, data: null };
}
