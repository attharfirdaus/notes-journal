"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CalendarClock, Pin } from "lucide-react";
import clsx from "clsx";
import type { Category, Note, NoteCategoryLink } from "@/lib/types";
import { formatDue } from "@/lib/time";
import { Icon } from "@/lib/icons";

export type NoteCardData = Note & {
  links: NoteCategoryLink[];
  total: number;
  done: number;
  nextDue: string | null;
  overdue: boolean;
};

export function NoteCard({
  note,
  categories,
  tz,
  index,
}: {
  note: NoteCardData;
  categories: Category[];
  tz: string;
  index: number;
}) {
  const cats = note.links.map((l) => categories.find((c) => c.id === l.category_id)).filter(Boolean) as Category[];
  const pct = note.total ? note.done / note.total : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), type: "spring", stiffness: 300, damping: 26 }}
      whileHover={{ y: -4, rotate: index % 2 ? 0.6 : -0.6 }}
      className="mb-4 break-inside-avoid"
    >
      <Link
        href={`/notes/${note.id}`}
        className={clsx(
          "block rounded-blob border-2 border-line p-4 shadow-soft transition",
          note.status === "archived" && "opacity-70",
        )}
        style={{ background: `color-mix(in oklab, ${note.color} var(--note-mix), var(--card))` }}
      >
        <div className="flex items-start gap-2">
          <Icon name={note.icon} size={22} className="mt-0.5 shrink-0 text-ink" />
          <h3
            className={clsx(
              "min-w-0 flex-1 font-display text-lg font-bold leading-tight text-ink",
              note.status === "completed" && "line-through decoration-2 opacity-70",
            )}
          >
            {note.title}
          </h3>
          {note.pinned ? <Pin size={16} className="shrink-0 rotate-45 text-ink" aria-label="Pinned" /> : null}
        </div>
        {note.description ? <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{note.description}</p> : null}
        {cats.length ? (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {cats.map((c) => (
              <span key={c.id} className="rounded-full bg-card/70 px-2 py-0.5 text-xs font-bold text-ink">
                <Icon name={c.icon} size={12} className="mr-1 inline-block align-[-2px]" />
                {c.name}
              </span>
            ))}
          </div>
        ) : null}
        {note.total ? (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-card/70">
              <div className="h-full rounded-full bg-ink/70" style={{ width: `${pct * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-ink-soft">
              {note.done}/{note.total}
            </span>
          </div>
        ) : null}
        {note.nextDue ? (
          <p
            className={clsx(
              "mt-2 flex items-center gap-1 text-xs font-bold",
              note.overdue ? "text-[#C0392B] dark:text-[#FF8A80]" : "text-ink-soft",
            )}
          >
            <CalendarClock size={14} /> {formatDue(note.nextDue, tz)}
          </p>
        ) : null}
        {note.status === "completed" ? <p className="mt-2 text-xs font-black text-ink-soft"> All done!</p> : null}
      </Link>
    </motion.div>
  );
}
