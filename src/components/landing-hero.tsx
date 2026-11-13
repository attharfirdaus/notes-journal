"use client";

import Link from "next/link";
import { useState } from "react";
import { Mascot } from "./mascot";
import type { PetMood, PetStage } from "@/lib/pet";

const CYCLE: { stage: PetStage; mood: PetMood; line: string }[] = [
  { stage: "acorn", mood: "happy", line: "Psst, tap me." },
  { stage: "kit", mood: "ecstatic", line: "I hatched! Hi there." },
  { stage: "scout", mood: "happy", line: "I'll remember your deadlines for you." },
  { stage: "keeper", mood: "ecstatic", line: "Show up a little every day and I grow too." },
];

export function LandingHero() {
  const [i, setI] = useState(0);
  const c = CYCLE[i % CYCLE.length];
  return (
    <section className="grid items-end gap-10 pt-8 md:grid-cols-[1.35fr_1fr] md:pt-14">
      <div>
        <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
          Keep it close.
          <br />
          <em>Never forget.</em>
        </h1>
        <p className="mt-5 max-w-md text-lg text-ink-soft">
          A scrapbook for your days. Jot a list, set a deadline, write a line about today, and a squirrel named Pip
          keeps it with you.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/signup" className="btn-pop rounded-btn bg-primary px-6 py-3 text-lg font-bold text-primary-ink">
            Hatch your acorn
          </Link>
          <Link
            href="/login"
            className="rounded-btn border border-edge px-6 py-3 text-lg font-bold transition-colors hover:bg-soft"
          >
            I have an account
          </Link>
        </div>
      </div>
      <div className="flex flex-col items-center md:items-start">
        <p className="hand mb-1 max-w-56 -rotate-2 text-ink" aria-live="polite">
          {c.line}
        </p>
        <Mascot stage={c.stage} mood={c.mood} size={200} label="Tap the squirrel" onPet={() => setI((v) => v + 1)} />
      </div>
    </section>
  );
}
