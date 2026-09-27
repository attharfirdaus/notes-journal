"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import type { Category } from "@/lib/types";
import { Spinner } from "@/components/ui";

type Value = { q: string; category: string; status: string; type: string; sort: string };

const selectClass =
  "h-10 rounded-xl border-2 border-line bg-card px-3 text-sm font-bold text-ink outline-none focus:border-primary";

export function NotesFilters({ categories, value }: { categories: Category[]; value: Value }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(value.q);
  const [pending, start] = useTransition();

  const set = (key: keyof Value, v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(key, v);
    else next.delete(key);
    start(() => router.replace(`/notes?${next.toString()}`, { scroll: false }));
  };

  useEffect(() => {
    if (q === value.q) return;
    const t = setTimeout(() => set("q", q.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">Search notes</span>
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles and items…"
          className="h-12 w-full rounded-2xl border-2 border-line bg-card pl-11 pr-10 text-[15px] outline-none focus:border-primary"
        />
        {pending ? <Spinner className="absolute right-4 top-4 text-ink-soft" /> : null}
      </label>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => set("category", "")}
          className={`shrink-0 rounded-full border-2 px-3 py-1 text-sm font-bold ${!value.category ? "border-primary bg-primary/25" : "border-line bg-card"}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => set("category", value.category === c.id ? "" : c.id)}
            className="shrink-0 rounded-full border-2 px-3 py-1 text-sm font-bold transition"
            style={
              value.category === c.id
                ? { borderColor: c.color, background: `${c.color}88` }
                : { borderColor: "var(--line)", background: "var(--card)" }
            }
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Status" className={selectClass} value={value.status} onChange={(e) => set("status", e.target.value === "active" ? "" : e.target.value)}>
          <option value="active">🟢 Active</option>
          <option value="completed">✅ Completed</option>
          <option value="archived">📦 Archived</option>
          <option value="all">🌈 All</option>
        </select>
        <select aria-label="Type" className={selectClass} value={value.type} onChange={(e) => set("type", e.target.value)}>
          <option value="">All types</option>
          <option value="checklist">🛒 Checklist</option>
          <option value="tasks">✅ Tasks</option>
          <option value="schedule">📅 Schedule</option>
          <option value="free">📝 Free list</option>
        </select>
        <select aria-label="Sort" className={selectClass} value={value.sort} onChange={(e) => set("sort", e.target.value === "updated" ? "" : e.target.value)}>
          <option value="updated">Recently updated</option>
          <option value="created">Newest</option>
          <option value="due">Deadline</option>
          <option value="title">A → Z</option>
        </select>
      </div>
    </div>
  );
}
