import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { TimeCapsule } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { Capsules } from "./capsules";

export const metadata: Metadata = { title: "Time Capsules" };

export default async function CapsulesPage() {
  const supabase = await createClient();
  const [profile, { data }] = await Promise.all([
    requireProfile(),
    supabase
      .from("time_capsules")
      .select("id,title,mood,open_at,opened_at,created_at")
      .order("open_at", { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader title="Time Capsules" icon="ui-capsules" />
      <p className="-mt-3 mb-5 text-ink-soft">
        Write a letter to future you. It stays sealed until the day it unlocks, even from you.
      </p>
      <Capsules capsules={(data ?? []) as TimeCapsule[]} tz={profile.timezone} />
    </div>
  );
}
