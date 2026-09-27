"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MOODS, moodInfo } from "@/lib/journal";
import { plainSnippet } from "@/lib/markdown";
import { formatDate } from "@/lib/time";
import { IconButton } from "@/components/ui";

type Pixel = { date: string; mood: number | null; snippet: string };
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export function PixelsGrid({
  year,
  today,
  minYear,
  maxYear,
  entries,
}: {
  year: number;
  today: string;
  minYear: number;
  maxYear: number;
  entries: Pixel[];
}) {
  const router = useRouter();
  const [hover, setHover] = useState<Pixel | null>(null);
  const byDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);
  const counts = useMemo(() => {
    const c = new Map<number, number>();
    entries.forEach((e) => e.mood && c.set(e.mood, (c.get(e.mood) ?? 0) + 1));
    return c;
  }, [entries]);
  const withMood = entries.filter((e) => e.mood).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3">
        <IconButton
          label="Previous year"
          disabled={year <= minYear}
          onClick={() => router.push(`/pixels?year=${year - 1}`)}
        >
          <ChevronLeft />
        </IconButton>
        <h2 className="font-display text-2xl font-bold">{year}</h2>
        <IconButton
          label="Next year"
          disabled={year >= maxYear}
          onClick={() => router.push(`/pixels?year=${year + 1}`)}
        >
          <ChevronRight />
        </IconButton>
      </div>

      <div className="rounded-blob border-2 border-line bg-card p-3 shadow-soft sm:p-5">
        <div className="grid gap-[3px] sm:gap-1" style={{ gridTemplateColumns: "1.5rem repeat(12, minmax(0, 1fr))" }}>
          <div />
          {MONTHS.map((m, i) => (
            <div key={i} className="text-center text-xs font-black text-ink-soft">
              {m}
            </div>
          ))}
          {Array.from({ length: 31 }, (_, d) => (
            <Row key={d} day={d + 1} year={year} today={today} byDate={byDate} onHover={setHover} />
          ))}
        </div>
      </div>

      <div className="min-h-16 rounded-2xl border-2 border-dashed border-line p-3 text-sm" aria-live="polite">
        {hover ? (
          <p>
            <span className="font-bold">
              {formatDate(hover.date, { weekday: "long", month: "long", day: "numeric" })}
              {moodInfo(hover.mood) ? ` · ${moodInfo(hover.mood)!.label}` : ""}
            </span>
            <span className="mt-0.5 block text-ink-soft">{plainSnippet(hover.snippet, 140) || "Just a mood."}</span>
          </p>
        ) : (
          <p className="text-ink-soft">Hover or tap a pixel to peek at that day. Tap again to open it.</p>
        )}
      </div>

      <div className="rounded-blob border-2 border-line bg-card p-4 shadow-soft">
        <h3 className="mb-3 font-display text-lg font-bold">Mood mix {withMood ? `· ${withMood} days` : ""}</h3>
        <div className="space-y-2">
          {[...MOODS].reverse().map((m) => {
            const n = counts.get(m.value) ?? 0;
            return (
              <div key={m.value} className="flex items-center gap-2">
                <span className="flex w-24 shrink-0 items-center gap-1.5 text-sm font-bold">
                  <m.Icon size={15} aria-hidden /> {m.label}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-soft">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: m.color }}
                    initial={{ width: 0 }}
                    animate={{ width: withMood ? `${(n / withMood) * 100}%` : 0 }}
                    transition={{ type: "spring", stiffness: 80, damping: 18 }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-bold text-ink-soft">{n}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Row({
  day,
  year,
  today,
  byDate,
  onHover,
}: {
  day: number;
  year: number;
  today: string;
  byDate: Map<string, Pixel>;
  onHover: (p: Pixel | null) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-end pr-1 text-[10px] font-bold text-ink-soft">
        {day % 5 === 0 || day === 1 ? day : ""}
      </div>
      {MONTHS.map((_, m) => {
        const valid = day <= new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
        if (!valid) return <div key={m} />;
        const date = `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const entry = byDate.get(date);
        const mood = moodInfo(entry?.mood);
        const future = date > today;
        const style = {
          background: mood ? mood.color : entry ? "var(--line)" : "var(--soft)",
          outline: date === today ? "2px solid var(--primary)" : undefined,
          opacity: future ? 0.35 : 1,
        };
        const cls =
          "block aspect-square w-full rounded-[4px] sm:rounded-md transition hover:scale-125 hover:z-10 relative";
        if (future) return <div key={m} className={cls} style={style} />;
        return (
          <Link
            key={m}
            href={`/journal/${date}`}
            className={cls}
            style={style}
            aria-label={`${date}${mood ? `: ${mood.label}` : ""}`}
            onMouseEnter={() => onHover(entry ?? { date, mood: null, snippet: "" })}
            onFocus={() => onHover(entry ?? { date, mood: null, snippet: "" })}
            onClick={(e) => {
              // First tap on touch devices previews; second opens.
              if (window.matchMedia("(hover: none)").matches && e.currentTarget.dataset.armed !== "1") {
                e.preventDefault();
                document.querySelectorAll("[data-armed='1']").forEach((el) => ((el as HTMLElement).dataset.armed = ""));
                e.currentTarget.dataset.armed = "1";
                onHover(entry ?? { date, mood: null, snippet: "" });
              }
            }}
          />
        );
      })}
    </>
  );
}
