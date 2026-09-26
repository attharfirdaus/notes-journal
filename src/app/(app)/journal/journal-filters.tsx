"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { MOODS } from "@/lib/journal";
import { Segmented, Spinner } from "@/components/ui";

export function JournalFilters({ q: initialQ, mood, view }: { q: string; mood: number; view: "list" | "calendar" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [pending, start] = useTransition();

  const set = (key: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(key, v);
    else next.delete(key);
    start(() => router.replace(`/journal?${next.toString()}`, { scroll: false }));
  };

  useEffect(() => {
    if (q === initialQ) return;
    const t = setTimeout(() => set("q", q.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search journal</span>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your entries…"
            className="h-11 w-full rounded-2xl border-2 border-line bg-card pl-11 pr-10 outline-none focus:border-primary"
          />
          {pending ? <Spinner className="absolute right-4 top-3.5 text-ink-soft" /> : null}
        </label>
        <div className="w-48">
          <Segmented
            label="View"
            value={view}
            onChange={(v) => set("view", v === "list" ? "" : v)}
            options={[
              { value: "list", label: "📜 List" },
              { value: "calendar", label: "🗓️ Calendar" },
            ]}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by mood">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            aria-pressed={mood === m.value}
            onClick={() => set("mood", mood === m.value ? "" : String(m.value))}
            className="rounded-full border-2 px-3 py-1 text-sm font-bold transition hover:-translate-y-0.5"
            style={mood === m.value ? { borderColor: m.color, background: `${m.color}88` } : { borderColor: "var(--line)", background: "var(--card)" }}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
