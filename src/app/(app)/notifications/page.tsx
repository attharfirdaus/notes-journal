import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { AppNotification } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { NotificationList } from "./notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  // process_my_due turns anything now due into a row, so it has to land before
  // the list is read; the profile check rides alongside it.
  await Promise.all([requireProfile(), supabase.rpc("process_my_due")]);
  const { data } = await supabase
    .from("notifications")
    .select("id,kind,title,body,link,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Inbox" emoji="🔔" />
      <NotificationList initial={(data ?? []) as AppNotification[]} />
    </div>
  );
}
