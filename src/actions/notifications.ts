"use server";

import { z } from "zod";
import { authed } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { pushConfigured, sendPush } from "@/lib/push";
import type { ActionResult, AppNotification } from "@/lib/types";

export async function pollNotifications(): Promise<ActionResult<{ unread: number; recent: AppNotification[] }>> {
  try {
    // Runs on a timer for every open tab, so it skips the usual auth lookup:
    // process_my_due() raises without a session and RLS scopes the reads, which
    // is all this needs — the user id itself is never used here.
    const supabase = await createClient();
    await supabase.rpc("process_my_due");
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const [{ count }, { data: recent }] = await Promise.all([
      supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
      supabase
        .from("notifications")
        .select("id,kind,title,body,link,read_at,created_at")
        .is("read_at", null)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    return { ok: true, data: { unread: count ?? 0, recent: (recent ?? []) as AppNotification[] } };
  } catch {
    return { ok: false, error: "Could not load notifications" };
  }
}

export async function markNotificationsRead(id?: string): Promise<ActionResult> {
  const { supabase } = await authed();
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (id) q = q.eq("id", z.uuid().parse(id));
  const { error } = await q;
  return error ? { ok: false, error: error.message } : { ok: true, data: null };
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  const { supabase } = await authed();
  const { error } = await supabase.from("notifications").delete().eq("id", z.uuid().parse(id));
  return error ? { ok: false, error: error.message } : { ok: true, data: null };
}

export async function clearNotifications(): Promise<ActionResult> {
  const { supabase, uid } = await authed();
  const { error } = await supabase.from("notifications").delete().eq("user_id", uid);
  return error ? { ok: false, error: error.message } : { ok: true, data: null };
}

const SubSchema = z.object({
  endpoint: z.url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

export async function savePushSubscription(raw: unknown, userAgent?: string): Promise<ActionResult> {
  const parsed = SubSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid subscription" };
  const { supabase, uid } = await authed();
  const { endpoint, keys } = parsed.data;
  // The endpoint is unique; replace any row for it so the owner always matches the current user.
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: uid,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    user_agent: userAgent?.slice(0, 300) ?? null,
  });
  return error ? { ok: false, error: "Could not save this device" } : { ok: true, data: null };
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult> {
  const { supabase } = await authed();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return error ? { ok: false, error: error.message } : { ok: true, data: null };
}

export async function sendTestPush(): Promise<ActionResult<{ sent: number }>> {
  if (!pushConfigured()) return { ok: false, error: "Push is not configured on the server (VAPID keys missing)." };
  const { supabase } = await authed();
  const { data: subs } = await supabase.from("push_subscriptions").select("id,endpoint,p256dh,auth");
  if (!subs?.length) return { ok: false, error: "No devices subscribed yet." };
  let sent = 0;
  for (const s of subs) {
    const r = await sendPush(s, { title: "🐿️ Hello from Tuckbury!", body: "Push reminders are working.", url: "/home" });
    if (r === "ok") sent++;
    if (r === "gone") await supabase.from("push_subscriptions").delete().eq("id", s.id);
  }
  return { ok: true, data: { sent } };
}
