"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Mascot } from "./mascot";
import type { PetMood, PetStage } from "@/lib/pet";

const CYCLE: { stage: PetStage; mood: PetMood; line: string }[] = [
  { stage: "acorn", mood: "happy", line: "Psst… tap me!" },
  { stage: "kit", mood: "ecstatic", line: "I hatched! Hi there! " },
  { stage: "scout", mood: "happy", line: "I'll remember your deadlines for you." },
  { stage: "keeper", mood: "ecstatic", line: "Show up a little every day and I'll grow too! " },
];

export function LandingHero() {
  const [i, setI] = useState(0);
  const c = CYCLE[i % CYCLE.length];
  return (
    <section className="flex flex-col items-center gap-8 pt-6 text-center md:flex-row md:text-left">
      <div className="flex-1">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
        >
          Tuck it away.
          <br />
          <span className="text-primary">Never forget.</span>
        </motion.h1>
        <p className="mt-4 max-w-lg text-lg text-ink-soft">
          A cozy note taker and daily journal with a squirrel sidekick. Lists, reminders, moods and streaks, wrapped in
          tiny joys.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
          <Link href="/signup" className="btn-pop rounded-2xl bg-primary px-6 py-3 text-lg font-bold text-primary-ink">
            Get started for free
          </Link>
          <Link href="/login" className="rounded-2xl border-2 border-line bg-card px-6 py-3 text-lg font-bold">
            I have an account
          </Link>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <motion.div
          key={c.line}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mb-2 max-w-60 rounded-3xl rounded-bl-md border-2 border-line bg-card px-4 py-2 font-bold shadow-soft"
        >
          {c.line}
        </motion.div>
        <Mascot stage={c.stage} mood={c.mood} size={220} label="Tap the squirrel" onPet={() => setI((v) => v + 1)} />
      </div>
    </section>
  );
}
