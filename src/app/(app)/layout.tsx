import { requireProfile } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";
import { PrefsProvider } from "@/components/prefs";
import { VibeBackground } from "@/components/vibe-background";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await requireProfile();
  return (
    <PrefsProvider
      value={{
        timezone: profile.timezone,
        petName: profile.pet_name,
        displayName: profile.display_name,
        soundEffects: profile.sound_effects,
        reduceMotion: profile.reduce_motion,
      }}
    >
      <VibeBackground vibe={profile.vibe} />
      <div className="relative z-10 flex min-h-dvh">
        <AppNav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-32 pt-4 sm:px-6 md:pb-12 md:pt-8">{children}</main>
      </div>
    </PrefsProvider>
  );
}
