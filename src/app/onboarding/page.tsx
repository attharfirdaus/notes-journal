import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { z } from "zod";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "./onboarding";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.onboarded) redirect("/home");
  // Birthday given at sign-up (see signUp). User metadata is user-editable, so re-validate.
  const { data } = await (await createClient()).auth.getClaims();
  const meta = z.iso.date().safeParse(data?.claims?.user_metadata?.birthday);
  const birthday = profile.birthday ?? (meta.success ? meta.data : null);
  return <Onboarding initialName={profile.display_name} birthday={birthday} />;
}
