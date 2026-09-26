"use server";

import { z } from "zod";
import { authed } from "@/lib/auth";
import { MESSAGES } from "@/lib/messages";

export async function recordMessage(messageId: string): Promise<void> {
  const mid = z.string().max(40).parse(messageId);
  if (!MESSAGES.some((m) => m.id === mid)) return;
  const { supabase } = await authed();
  await supabase.from("message_history").insert({ message_id: mid });
}
