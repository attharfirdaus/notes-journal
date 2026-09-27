import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { Onboarding } from "./onboarding";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.onboarded) redirect("/home");
  return <Onboarding initialName={profile.display_name} />;
}
