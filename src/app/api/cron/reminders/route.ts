import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushConfigured, sendPush } from "@/lib/push";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function run(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: due, error } = await admin.rpc("process_all_due");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const notes = (due ?? []) as { id: string; user_id: string; title: string; body: string; link: string | null }[];
  let sent = 0;
  let removed = 0;

  if (notes.length && pushConfigured()) {
    const users = [...new Set(notes.map((n) => n.user_id))];
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id,user_id,endpoint,p256dh,auth")
      .in("user_id", users);

    await Promise.all(
      notes.flatMap((n) =>
        (subs ?? [])
          .filter((s) => s.user_id === n.user_id)
          .map(async (s) => {
            const r = await sendPush(s, { title: n.title, body: n.body, url: n.link ?? "/notifications", tag: n.id });
            if (r === "ok") sent++;
            if (r === "gone") {
              removed++;
              await admin.from("push_subscriptions").delete().eq("id", s.id);
            }
          }),
      ),
    );
  }

  return NextResponse.json({ notifications: notes.length, pushed: sent, expired: removed });
}

export const POST = run;
export const GET = run;
