"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { moodInfo } from "@/lib/journal";
import { IconButton } from "@/components/ui";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function JournalCalendar({
  entries,
  today,
}: {
  entries: { date: string; mood: number | null }[];
  today: string;
}) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const byDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);

  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  const shift = (d: number) => {
    const t = new Date(Date.UTC(y, m - 1 + d, 1));
    setMonth(t.toISOString().slice(0, 7));
  };

  return (
    <div className="rounded-blob border-2 border-line bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <IconButton label="Previous month" onClick={() => shift(-1)}>
          <ChevronLeft />
        </IconButton>
        <h2 className="font-display text-xl font-bold">{label}</h2>
        <IconButton label="Next month" onClick={() => shift(1)} disabled={month >= today.slice(0, 7)}>
          <ChevronRight />
        </IconButton>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-xs font-black uppercase text-ink-soft">
            {d}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const entry = byDate.get(date);
          const mood = moodInfo(entry?.mood);
          const future = date > today;
          const cell = (
            <div
              className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 text-sm font-bold transition ${
                date === today ? "border-primary" : "border-transparent"
              } ${future ? "opacity-30" : "hover:scale-105"}`}
              style={{ background: mood ? `${mood.color}88` : entry ? "var(--soft)" : "transparent" }}
            >
              <span className="text-[11px] leading-none text-ink-soft">{i + 1}</span>
              <span className="flex h-5 items-center justify-center leading-none">
                {mood ? <mood.Icon size={17} aria-hidden /> : entry ? <PenLine size={15} aria-hidden /> : null}
              </span>
            </div>
          );
          return future ? (
            <div key={date}>{cell}</div>
          ) : (
            <Link key={date} href={`/journal/${date}`} aria-label={`Journal for ${date}`}>
              {cell}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
