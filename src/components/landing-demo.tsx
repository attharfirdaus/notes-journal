"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { planQuickAdd } from "@/lib/quick-add";
import { NOTE_TYPES } from "@/lib/note-meta";
import { formatDue } from "@/lib/time";

const EXAMPLES = ["Groceries: milk, eggs, bread", "Essay due friday 5pm", "pay rent every month"];

/**
 * The real quick-add parser, running in the visitor's browser. Nothing is saved:
 * it shows what the same sentence would become inside the app.
 */
export function LandingDemo() {
  const [text, setText] = useState(EXAMPLES[0]);
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const plan = useMemo(() => planQuickAdd(text, tz), [text, tz]);
  const type = plan ? NOTE_TYPES.find((t) => t.value === plan.type) : null;
  const due = plan?.items[0]?.due_at;

  return (
    <section className="mt-20 grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-start">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">Type it the way you&apos;d say it.</h2>
        <p className="mt-3 max-w-sm text-ink-soft">
          One box takes a shopping list, a deadline or a stray thought, and files it as the right kind of note. Try
          it here. This is the same parser the app uses, and nothing you type on this page is saved.
        </p>
        <label htmlFor="demo-input" className="mt-6 block text-sm font-bold text-ink-soft">
          Quick add
        </label>
        <input
          id="demo-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          placeholder="Groceries: milk, eggs"
          className="mt-1.5 h-12 w-full rounded-paper border border-edge bg-card px-4 text-[16px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-ink-soft focus:border-primary-text"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setText(e)}
              aria-pressed={text === e}
              className="min-h-11 rounded-full border border-edge px-4 text-sm font-semibold transition-colors hover:bg-soft aria-pressed:bg-soft"
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="tape rotate-1 rounded-paper border border-line bg-card p-6 pt-8" aria-live="polite">
        {plan ? (
          <>
            <p className="text-sm font-bold text-ink-soft">{type?.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{plan.title}</p>
            {plan.items.length > 1 ? (
              <ul className="mt-4 space-y-2">
                {plan.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-3 border-b border-dashed border-line pb-2 font-semibold">
                    <span className="h-5 w-5 shrink-0 rounded border border-edge" aria-hidden />
                    {it.text}
                  </li>
                ))}
              </ul>
            ) : null}
            {due ? <p className="mt-4 font-semibold">Due {formatDue(due, tz)}</p> : null}
            {plan.recurrence ? <p className="mt-1 text-ink-soft">Repeats {plan.recurrence}</p> : null}
            {!due && plan.items.length <= 1 ? (
              <p className="mt-4 text-ink-soft">A free note. Add items to it whenever you like.</p>
            ) : null}
            <p className="hand mt-5 -rotate-1 text-primary-text">
              <Link href="/signup" className="inline-flex min-h-11 items-center underline decoration-2 underline-offset-4">
                sign up to keep it
              </Link>
            </p>
          </>
        ) : (
          <p className="hand text-ink-soft">Type something on the left and it shows up here.</p>
        )}
      </div>
    </section>
  );
}
