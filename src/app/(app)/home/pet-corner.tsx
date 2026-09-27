"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { recordMessage } from "@/actions/home";
import { Mascot } from "@/components/mascot";
import { usePrefs } from "@/components/prefs";
import { useToast } from "@/components/toast";
import { ProgressBar } from "@/components/ui";
import { sfx } from "@/lib/fx";
import { pickMessage, renderMessage, type MessageContext } from "@/lib/messages";
import { MOOD_LINES, type PetMood, type petStage } from "@/lib/pet";

export function PetCorner({
  petName,
  stage,
  mood,
  initialMessage,
  ctx,
  recent,
  streak,
  usedFreeze,
}: {
  petName: string;
  stage: ReturnType<typeof petStage>;
  mood: PetMood;
  initialMessage: { id: string; text: string };
  ctx: MessageContext;
  recent: string[];
  streak: number;
  usedFreeze: boolean;
}) {
  const prefs = usePrefs();
  const { toast } = useToast();
  const [message, setMessage] = useState(initialMessage);
  const [taps, setTaps] = useState(0);
  const seen = useRef(recent);

  useEffect(() => {
    if (usedFreeze) toast({ emoji: "❄️", title: "Streak saved!", body: "A streak freeze covered yesterday. Phew!" });
  }, [usedFreeze, toast]);

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
    <section className="relative overflow-hidden rounded-blob border-2 border-line bg-card p-4 shadow-soft">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/30 blur-2xl" aria-hidden />
      <div className="relative flex items-end gap-3">
        <Mascot
          stage={stage.stage}
          mood={displayMood}
          progress={stage.progress}
          size={132}
          onPet={next}
          label={`${petName} the ${stage.label.toLowerCase()} — tap for a message`}
        />
        <div className="min-w-0 flex-1 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={message.id + taps}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              className="relative rounded-3xl rounded-bl-md bg-soft px-4 py-3 font-semibold leading-snug"
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
          <p className="shrink-0 text-xs font-black uppercase tracking-wide text-ink-soft">{stage.label}</p>
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
