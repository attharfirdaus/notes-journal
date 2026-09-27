"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { updateItem } from "@/actions/notes";
import { usePrefs } from "@/components/prefs";
import { useToast } from "@/components/toast";
import { EmptyState } from "@/components/ui";
import { celebrate, originFromEvent, sfx } from "@/lib/fx";
import { formatDue } from "@/lib/time";
import type { HomeItem } from "@/lib/types";

const SECTIONS = [
  { key: "overdue", title: "Overdue", emoji: "⏰" },
  { key: "today", title: "Today", emoji: "🌞" },
  { key: "upcoming", title: "Next 7 days", emoji: "🗓️" },
] as const;

export function HomeItems({ items: initial }: { items: HomeItem[] }) {
  const prefs = usePrefs();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [, start] = useTransition();

  const complete = (item: HomeItem, e: React.MouseEvent) => {
    celebrate("small", originFromEvent(e));
    if (prefs.soundEffects) sfx.pop();
    setItems((xs) => xs.filter((x) => x.id !== item.id));
    start(async () => {
      const res = await updateItem(item.id, { is_done: true });
      if (!res.ok) {
        setItems((xs) => [...xs, item]);
        return toast({ emoji: "😬", title: "Couldn't update", body: res.error });
      }
      if (res.data.status === "completed") {
        celebrate("big");
        toast({ emoji: "🎉", title: `${item.note_emoji} ${item.note_title} is complete!` });
      }
      if (!res.data.item.is_done && res.data.item.due_at) {
        // Recurring item rolled forward, so show it again with its new date.
        setItems((xs) => [...xs, { ...item, due_at: res.data.item.due_at!, bucket: "upcoming" }]);
      }
    });
  };

  if (!items.length) {
    return (
      <EmptyState emoji="🌤️" title="Nothing due this week">
        Enjoy the calm, or add a task with a deadline above.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-5">
      {SECTIONS.map((s) => {
        const list = items.filter((i) => i.bucket === s.key);
        if (!list.length) return null;
        return (
          <section key={s.key}>
            <h2 className="mb-2 font-display text-xl font-bold">
              {s.emoji} {s.title} <span className="text-base text-ink-soft">({list.length})</span>
            </h2>
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {list.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }}
                    className="flex items-center gap-3 rounded-2xl border-2 border-line bg-card p-2.5 shadow-soft"
                  >
                    <button
                      type="button"
                      onClick={(e) => complete(item, e)}
                      aria-label={`Mark “${item.text}” as done`}
                      className="h-7 w-7 shrink-0 rounded-[0.6rem] border-[2.5px] border-ink/30 bg-card transition hover:border-primary hover:bg-primary/20"
                    />
                    <Link href={`/notes/${item.note_id}`} className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{item.text}</span>
                      <span className="block truncate text-xs text-ink-soft">
                        <span className={s.key === "overdue" ? "font-bold text-[#C0392B] dark:text-[#FF8A80]" : "font-bold"}>
                          {formatDue(item.due_at, prefs.timezone)}
                        </span>{" "}
                        · {item.note_emoji} {item.note_title}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        );
      })}
    </div>
  );
}
