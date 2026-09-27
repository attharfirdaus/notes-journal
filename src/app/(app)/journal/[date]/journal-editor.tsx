"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import {
  Bold,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Italic,
  List,
  Pencil,
  Shuffle,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { deleteJournal, saveJournal } from "@/actions/journal";
import { Button, IconButton, Modal } from "@/components/ui";
import { RichText } from "@/components/rich-text";
import { usePrefs } from "@/components/prefs";
import { useToast } from "@/components/toast";
import { celebrate, sfx } from "@/lib/fx";
import { FEELINGS, MOODS, randomPrompt } from "@/lib/journal";
import { addDays, formatDate } from "@/lib/time";
import type { JournalEntry } from "@/lib/types";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

export function JournalEditor({ date, today, entry }: { date: string; today: string; entry: JournalEntry | null }) {
  const router = useRouter();
  const prefs = usePrefs();
  const { toast } = useToast();
  const [content, setContent] = useState(entry?.content ?? "");
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [feelings, setFeelings] = useState<string[]>(entry?.feelings ?? []);
  const [prompt, setPrompt] = useState<string | null>(entry?.prompt ?? null);
  const [exists, setExists] = useState(Boolean(entry));
  const [preview, setPreview] = useState(false);
  const [save, setSave] = useState<SaveState>("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, start] = useTransition();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // Offer a prompt on fresh pages only; random choice must happen on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!entry) setPrompt(randomPrompt());
  }, [entry]);

  const persist = useCallback(async () => {
    if (!exists && !content.trim() && mood === null) {
      setSave("idle");
      return;
    }
    setSave("saving");
    const res = await saveJournal({
      entry_date: date,
      content,
      mood,
      feelings: feelings as (typeof FEELINGS)[number][],
      prompt,
    });
    if (!res.ok) {
      setSave("error");
      toast({ icon: TriangleAlert, title: "Couldn't save", body: res.error });
      return;
    }
    setSave("saved");
    if (res.data.created) {
      setExists(true);
      const s = res.data.streak;
      if (date === today && s.current > 0) {
        const milestone = STREAK_MILESTONES.includes(s.current);
        celebrate(milestone ? "big" : "small");
        if (prefs.soundEffects) sfx.chime();
        toast({
          icon: Flame,
          title: milestone
            ? `${s.current}-day streak! Incredible!`
            : `Streak: ${s.current} day${s.current === 1 ? "" : "s"}`,
          body: `${prefs.petName} is so proud of you.`,
        });
      }
    }
  }, [exists, content, mood, feelings, prompt, date, today, toast, prefs.soundEffects, prefs.petName]);

  // Autosave shortly after the user stops typing.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    setSave("dirty");
    const t = setTimeout(() => void persist(), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, mood, feelings]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (save !== "dirty" && save !== "saving") return;
    const onBefore = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [save]);

  const wrap = (before: string, after = before) => {
    const el = textRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = content.slice(s, e) || "text";
    const next = content.slice(0, s) + before + selected + after + content.slice(e);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  };
  const bullet = () => {
    const el = textRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const lineStart = content.lastIndexOf("\n", s - 1) + 1;
    setContent(content.slice(0, lineStart) + "- " + content.slice(lineStart));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + 2, s + 2);
    });
  };

  const isToday = date === today;
  const title = isToday
    ? "Today"
    : formatDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          href="/journal"
          className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-bold text-ink-soft hover:bg-soft hover:text-ink"
        >
          <ChevronLeft size={18} /> Journal
        </Link>
        <div className="flex items-center gap-1">
          <IconButton label="Previous day" onClick={() => router.push(`/journal/${addDays(date, -1)}`)}>
            <ChevronLeft size={20} />
          </IconButton>
          <IconButton label="Next day" disabled={isToday} onClick={() => router.push(`/journal/${addDays(date, 1)}`)}>
            <ChevronRight size={20} />
          </IconButton>
          {exists ? (
            <IconButton label="Delete entry" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={19} />
            </IconButton>
          ) : null}
        </div>
      </div>

      <header className="mb-4">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {!isToday && !exists ? (
          <p className="mt-1 text-sm text-ink-soft">
            Backfilling a past day is welcome. It just won&apos;t count toward your streak.
          </p>
        ) : null}
      </header>

      <section className="rounded-[2rem] border-2 border-line bg-card p-5 shadow-soft">
        <p className="mb-3 font-bold">How are you feeling?</p>
        <div className="flex justify-between gap-1 sm:justify-start sm:gap-3" role="radiogroup" aria-label="Mood">
          {MOODS.map((m) => {
            const on = mood === m.value;
            return (
              <motion.button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={m.label}
                onClick={() => {
                  setMood(on ? null : m.value);
                  if (!on && prefs.soundEffects) sfx.pop();
                }}
                whileHover={{ scale: 1.15, rotate: -4 }}
                whileTap={{ scale: 0.9 }}
                animate={on ? { scale: [1, 1.35, 1.15] } : { scale: 1 }}
                className={clsx(
                  "flex flex-col items-center gap-1 rounded-2xl border-2 p-2 transition sm:w-20",
                  on ? "border-transparent" : "border-transparent opacity-70 hover:opacity-100",
                )}
                style={on ? { background: `${m.color}88` } : undefined}
              >
                <m.Icon size={30} strokeWidth={2.25} aria-hidden className="sm:h-9 sm:w-9" />
                <span className="text-[11px] font-bold">{m.label}</span>
              </motion.button>
            );
          })}
        </div>

        <p className="mb-2 mt-5 font-bold">Any of these?</p>
        <div className="flex flex-wrap gap-1.5">
          {FEELINGS.map((f) => {
            const on = feelings.includes(f);
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => setFeelings((xs) => (on ? xs.filter((x) => x !== f) : [...xs, f].slice(0, 10)))}
                className={clsx(
                  "rounded-full border-2 px-3 py-1 text-sm font-bold transition hover:-translate-y-0.5",
                  on ? "border-primary bg-primary/25" : "border-line bg-card text-ink-soft",
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {prompt ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-soft/60 p-3"
          >
            <span className="text-2xl"></span>
            <p className="flex-1 font-semibold italic">{prompt}</p>
            <IconButton label="Another prompt" onClick={() => setPrompt(randomPrompt(prompt))}>
              <Shuffle size={18} />
            </IconButton>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="mt-4 rounded-[2rem] border-2 border-line bg-card shadow-soft">
        <div className="flex items-center gap-1 border-b-2 border-line px-3 py-2">
          <IconButton label="Bold" onClick={() => wrap("**")} disabled={preview} className="h-9 w-9">
            <Bold size={17} />
          </IconButton>
          <IconButton label="Italic" onClick={() => wrap("_")} disabled={preview} className="h-9 w-9">
            <Italic size={17} />
          </IconButton>
          <IconButton label="Bullet list" onClick={bullet} disabled={preview} className="h-9 w-9">
            <List size={17} />
          </IconButton>
          <div className="flex-1" />
          <span className="mr-2 text-xs font-bold text-ink-soft" aria-live="polite">
            {save === "saving"
              ? "Saving…"
              : save === "saved"
                ? "Saved "
                : save === "dirty"
                  ? "Editing…"
                  : save === "error"
                    ? "Not saved"
                    : ""}
          </span>
          <Button size="sm" variant="soft" onClick={() => setPreview((v) => !v)}>
            {preview ? <Pencil size={15} /> : <Eye size={15} />} {preview ? "Edit" : "Preview"}
          </Button>
        </div>
        {preview ? (
          <div className="min-h-64 px-5 py-4">
            {content.trim() ? <RichText text={content} /> : <p className="text-ink-soft">Nothing written yet.</p>}
          </div>
        ) : (
          <textarea
            ref={textRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={20000}
            placeholder={prompt ? "Start with the prompt above, or write anything…" : "Dear diary…"}
            aria-label="Journal entry"
            className="min-h-64 w-full resize-y rounded-b-[2rem] bg-transparent px-5 py-4 text-[16px] leading-relaxed outline-none placeholder:text-ink-soft/70"
          />
        )}
      </section>
      <div className="mt-2 flex items-center justify-between px-2 text-xs text-ink-soft">
        <span>
          {words} word{words === 1 ? "" : "s"}
        </span>
        <span>Supports **bold**, _italic_ and - lists</span>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this entry?">
        <p className="text-ink-soft">
          This can&apos;t be undone{isToday ? ", and today will no longer count toward your streak" : ""}.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setConfirmDelete(false)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() =>
              start(async () => {
                const res = await deleteJournal(date);
                if (!res.ok) return toast({ icon: TriangleAlert, title: "Couldn't delete", body: res.error });
                toast({ icon: Trash2, title: "Entry deleted" });
                router.push("/journal");
              })
            }
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
