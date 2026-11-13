"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { recordMessage } from "@/actions/home";
import { Mascot } from "@/components/mascot";
import { usePrefs } from "@/components/prefs";
import { useToast } from "@/components/toast";
import { ProgressBar } from "@/components/ui";
import { celebrate, sfx } from "@/lib/fx";
import { pickMessage, renderMessage, type MessageContext } from "@/lib/messages";
import { MOOD_LINES, type PetMood, type petStage } from "@/lib/pet";
import { Snowflake } from "lucide-react";

export function PetCorner({
  petName,
  stage,
  mood,
  initialMessage,
  ctx,
  recent,
  streak,
  usedFreeze,
  birthday,
}: {
  petName: string;
  stage: ReturnType<typeof petStage>;
  mood: PetMood;
  initialMessage: { id: string; text: string };
  ctx: MessageContext;
  recent: string[];
  streak: number;
  usedFreeze: boolean;
  birthday: boolean;
}) {
  const prefs = usePrefs();
  const { toast } = useToast();
  const [message, setMessage] = useState(initialMessage);
  const [taps, setTaps] = useState(0);
  const seen = useRef(recent);

  useEffect(() => {
    if (usedFreeze)
      toast({ icon: Snowflake, title: "Streak saved!", body: "A streak freeze covered yesterday. Phew!" });
  }, [usedFreeze, toast]);

  useEffect(() => {
    if (!birthday) return;
    // Once a day per device, not on every visit to Home.
    const today = new Date().toDateString();
    try {
      if (localStorage.getItem("birthday-confetti") === today) return;
      localStorage.setItem("birthday-confetti", today);
    } catch {}
    celebrate("big");
  }, [birthday]);

  const next = () => {
    const m = pickMessage(ctx, seen.current);
    seen.current = [m.id, ...seen.current].slice(0, 80);
    setMessage({ id: m.id, text: renderMessage(m, { name: prefs.displayName, pet: petName, streak }) });
    setTaps((t) => t + 1);
    if (prefs.soundEffects) sfx.squeak();
    void recordMessage(m.id);
  };

  const displayMood: PetMood = taps > 0 && mood !== "sad" ? (taps % 3 === 0 ? "ecstatic" : "happy") : mood;

  return (
    <section className="tape tape-left relative rounded-paper border border-line bg-card p-4">
      <div className="relative flex items-end gap-3">
        <Mascot
          stage={stage.stage}
          mood={displayMood}
          progress={stage.progress}
          size={132}
          onPet={next}
          label={`${petName} the ${stage.label.toLowerCase()}. Tap for a message`}
        />
        <div className="min-w-0 flex-1 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={message.id + taps}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="hand relative text-ink"
              aria-live="polite"
            >
              {message.text}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="relative mt-2">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <p className="font-bold">
            {petName} <span className="font-semibold text-ink-soft">{MOOD_LINES[mood]}</span>
          </p>
          <p className="shrink-0 text-sm font-bold text-ink-soft">{stage.label}</p>
        </div>
        {stage.next ? (
          <>
            <ProgressBar value={stage.progress} className="mt-2 h-2.5" color="var(--pet)" />
            <p className="mt-1 text-xs text-ink-soft">
              {stage.stage === "acorn"
                ? stage.blurb
                : `${stage.daysToNext} more active day${stage.daysToNext === 1 ? "" : "s"} until ${petName} becomes a ${stage.next.label}!`}
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-ink-soft">{stage.blurb}</p>
        )}
      </div>
    </section>
  );
}
