import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getActivity } from "@/lib/home-data";
import { petMood, petStage } from "@/lib/pet";
import { PageHeader } from "@/components/ui";
import { FocusTimer } from "./focus-timer";

export const metadata: Metadata = { title: "Focus" };

export default async function FocusPage() {
  const [profile, activity] = await Promise.all([requireProfile(), getActivity()]);

  return (
    <div>
      <PageHeader title="Focus" icon="ui-focus" />
      <FocusTimer
        focusToday={activity.focus_today}
        petName={profile.pet_name}
        stage={petStage(activity.total_active_days).stage}
        mood={petMood(activity)}
      />
    </div>
  );
}
