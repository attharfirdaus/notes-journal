import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const [profile, { data }] = await Promise.all([requireProfile(), supabase.auth.getClaims()]);
  const email = (data?.claims?.email as string | undefined) ?? "";
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" icon="ui-settings" />
      <SettingsForm profile={profile} email={email} />
    </div>
  );
}
