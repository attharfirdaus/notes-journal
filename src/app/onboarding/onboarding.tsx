"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateProfile } from "@/actions/settings";
import { Mascot } from "@/components/mascot";
import { Button, Input } from "@/components/ui";
import { celebrate } from "@/lib/fx";
import { THEMES } from "@/lib/themes";
import type { ThemeId } from "@/lib/types";

const STEPS = ["hello", "pet", "theme", "hatch"] as const;

export function Onboarding({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [pet, setPet] = useState("Pip");
  const [theme, setTheme] = useState<ThemeId>("sunny");
  const [timezone, setTimezone] = useState("UTC");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    // Read the browser zone after mount; the server can't know it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const finish = () =>
    start(async () => {
      const res = await updateProfile({
        display_name: name.trim(),
        pet_name: pet.trim() || "Pip",
        theme,
        timezone,
        onboarded: true,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStep(3);
      celebrate("big");
      setTimeout(() => router.replace("/home"), 2200);
    });

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex gap-2" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={`h-2.5 rounded-full transition-all ${i <= step ? "w-8 bg-primary" : "w-2.5 bg-line"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          className="w-full max-w-md rounded-[2rem] border-2 border-line bg-card p-6 text-center shadow-soft"
        >
          {step === 0 ? (
            <>
              <div className="flex justify-center">
                <Mascot stage="acorn" mood="happy" size={130} label="An acorn" />
              </div>
              <h1 className="mt-2 font-display text-3xl font-bold">Welcome to Tuckbury!</h1>
              <p className="mt-2 text-ink-soft">
                The cozy place to tuck away lists, plans and feelings, so your brain can relax. 🌰
              </p>
              <div className="mt-5 text-left">
                <Input label="What should we call you?" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Your nickname" autoFocus />
              </div>
              <Button className="mt-5 w-full" size="lg" onClick={() => setStep(1)}>
                Nice to meet you →
              </Button>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="flex justify-center">
                <motion.div animate={{ rotate: [0, -4, 4, -4, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}>
                  <Mascot stage="acorn" mood="ecstatic" progress={0.8} size={130} label="The acorn wiggles" />
                </motion.div>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold">Something is wiggling…</h2>
              <p className="mt-2 text-ink-soft">
                This acorn will hatch into your squirrel sidekick. It grows as you write, check things off and focus. What will you name it?
              </p>
              <div className="mt-5 text-left">
                <Input label="Sidekick name" value={pet} onChange={(e) => setPet(e.target.value)} maxLength={20} placeholder="Pip" />
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="soft" className="flex-1" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)} disabled={!pet.trim()}>
                  Next →
                </Button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h2 className="font-display text-2xl font-bold">Pick your vibe ✨</h2>
              <p className="mt-1 text-ink-soft">You can change this anytime in Settings.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    aria-pressed={theme === t.id}
                    className={`rounded-2xl border-2 p-3 text-left transition ${theme === t.id ? "border-primary scale-[1.03]" : "border-line"}`}
                    style={{ background: t.light.bg }}
                  >
                    <div className="flex gap-1">
                      {[t.light.primary, t.light.accent, t.light.pet].map((c) => (
                        <span key={c} className="h-5 w-5 rounded-full border border-black/10" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="mt-2 text-sm font-bold" style={{ color: t.light.ink }}>
                      {t.emoji} {t.name}
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink-soft">Time zone detected: {timezone}</p>
              {error ? <p className="mt-2 text-sm font-bold text-[#EF5B5B]">{error}</p> : null}
              <div className="mt-5 flex gap-2">
                <Button variant="soft" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={finish} loading={pending}>
                  Let&apos;s go! 🐣
                </Button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <motion.div
                className="flex justify-center"
                initial={{ scale: 0.3, rotate: -20 }}
                animate={{ scale: 1, rotate: [0, -8, 8, -8, 0] }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <Mascot stage="acorn" mood="ecstatic" progress={0.9} size={160} label={pet} />
              </motion.div>
              <h2 className="mt-2 font-display text-2xl font-bold">{pet || "Pip"} is almost here! 🎉</h2>
              <p className="mt-2 text-ink-soft">
                Check off a task or write your first journal entry to hatch {pet || "Pip"}.
              </p>
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
