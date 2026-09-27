"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { Lock, LockOpen, Mail, Plus, Trash2, TriangleAlert } from "lucide-react";
import { createCapsule, deleteCapsule, openCapsule } from "@/actions/capsules";
import { Button, EmptyState, IconButton, Input, Modal, Textarea } from "@/components/ui";
import { RichText } from "@/components/rich-text";
import { useToast } from "@/components/toast";
import { usePrefs } from "@/components/prefs";
import { celebrate, sfx } from "@/lib/fx";
import { MOODS, moodInfo } from "@/lib/journal";
import { addDays, formatDate, relativeFromNow, todayInTz, zonedToIso } from "@/lib/time";
import type { TimeCapsule } from "@/lib/types";

const PRESETS = [
  { label: "1 month", days: 30 },
  { label: "3 months", days: 91 },
  { label: "6 months", days: 182 },
  { label: "1 year", days: 365 },
];

export function Capsules({ capsules, tz }: { capsules: TimeCapsule[]; tz: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const prefs = usePrefs();
  const [now, setNow] = useState(() => Date.now());
  const [creating, setCreating] = useState(false);
  const [reading, setReading] = useState<{ capsule: TimeCapsule; content: string } | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TimeCapsule | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const open = (c: TimeCapsule) => {
    setOpening(c.id);
    start(async () => {
      const res = await openCapsule(c.id);
      // Let the unlock animation play a moment.
      await new Promise((r) => setTimeout(r, 900));
      setOpening(null);
      if (!res.ok) return toast({ icon: Lock, title: "Still locked", body: res.error });
      celebrate("big");
      if (prefs.soundEffects) sfx.tada();
      setReading({ capsule: c, content: res.data.content });
      router.refresh();
    });
  };

  const sealed = capsules.filter((c) => Date.parse(c.open_at) > now);
  const ready = capsules.filter((c) => Date.parse(c.open_at) <= now);

  return (
    <div className="space-y-6">
      <Button onClick={() => setCreating(true)} size="lg">
        <Plus size={18} /> Write to future me
      </Button>

      {capsules.length === 0 ? (
        <EmptyState icon="ui-mail" title="No capsules yet">
          Seal a message today and let it surprise you later.
        </EmptyState>
      ) : null}

      {ready.length ? (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold"> Ready to open</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ready.map((c) => (
              <motion.div
                key={c.id}
                className="rounded-blob border-2 border-primary bg-card p-4 shadow-soft"
                animate={!c.opened_at ? { rotate: [0, -1.5, 1.5, -1.5, 0] } : undefined}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-bold">{c.title}</p>
                    <p className="text-xs text-ink-soft">
                      Sealed {formatDate(todayInTz(tz, new Date(c.created_at)), { year: "numeric" })}
                    </p>
                  </div>
                  <IconButton label="Delete capsule" onClick={() => setConfirmDelete(c)} className="h-8 w-8">
                    <Trash2 size={16} />
                  </IconButton>
                </div>
                <Button className="mt-3 w-full" onClick={() => open(c)} loading={opening === c.id}>
                  <AnimatePresence mode="wait">
                    {opening === c.id ? (
                      <motion.span
                        key="o"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: [0, -20, 20, 0], scale: [1, 1.3, 1] }}
                      >
                        <LockOpen size={16} />
                      </motion.span>
                    ) : (
                      <LockOpen size={16} key="c" />
                    )}
                  </AnimatePresence>
                  {c.opened_at ? "Read again" : "Open capsule!"}
                </Button>
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}

      {sealed.length ? (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold"> Sealed</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {sealed.map((c) => {
              const total = Date.parse(c.open_at) - Date.parse(c.created_at);
              const pct = Math.min(1, Math.max(0, (now - Date.parse(c.created_at)) / total));
              return (
                <div
                  key={c.id}
                  className="relative overflow-hidden rounded-blob border-2 border-line bg-card p-4 shadow-soft"
                >
                  <div
                    className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_12px,var(--soft)_12px,var(--soft)_24px)] opacity-60"
                    aria-hidden
                  />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Lock size={18} className="text-ink-soft" />
                        <p className="font-display text-lg font-bold">{c.title}</p>
                      </div>
                      <IconButton label="Delete capsule" onClick={() => setConfirmDelete(c)} className="h-8 w-8">
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                    <p className="mt-1 text-sm font-bold">Unlocks {relativeFromNow(c.open_at, new Date(now))}</p>
                    <p className="text-xs text-ink-soft">
                      {formatDate(todayInTz(tz, new Date(c.open_at)), { year: "numeric" })}
                    </p>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-soft">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <CreateCapsule
        open={creating}
        tz={tz}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          celebrate("small");
          toast({ icon: Mail, title: "Capsule sealed!", body: "See you in the future." });
          router.refresh();
        }}
      />

      <Modal
        open={Boolean(reading)}
        onClose={() => setReading(null)}
        title={reading ? ` ${reading.capsule.title}` : ""}
        wide
      >
        {reading ? (
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: 40 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
          >
            <p className="mb-3 text-sm text-ink-soft">
              Written by past you on{" "}
              {formatDate(todayInTz(tz, new Date(reading.capsule.created_at)), { year: "numeric" })}
              {reading.capsule.mood ? `, feeling ${moodInfo(reading.capsule.mood)?.label?.toLowerCase()}` : ""}.
            </p>
            <div className="rounded-2xl bg-soft p-4">
              <RichText text={reading.content} />
            </div>
          </motion.div>
        ) : null}
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Delete capsule?">
        <p className="text-ink-soft">
          “{confirmDelete?.title}” will be destroyed
          {confirmDelete && !confirmDelete.opened_at ? " without ever being read" : ""}.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setConfirmDelete(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() =>
              start(async () => {
                if (!confirmDelete) return;
                const res = await deleteCapsule(confirmDelete.id);
                setConfirmDelete(null);
                if (!res.ok) return toast({ icon: TriangleAlert, title: "Couldn't delete", body: res.error });
                router.refresh();
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

function CreateCapsule({
  open,
  tz,
  onClose,
  onCreated,
}: {
  open: boolean;
  tz: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = todayInTz(tz);
  // 8 days so a 9am unlock is always a full week after sealing.
  const minDate = addDays(today, 8);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [date, setDate] = useState(addDays(today, 365));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const [y, m, d] = date.split("-").map(Number);
      const res = await createCapsule({ title, content, mood, open_at: zonedToIso(tz, y, m, d, 9, 0) });
      if (!res.ok) return setError(res.error);
      setTitle("");
      setContent("");
      setMood(null);
      setError(null);
      onCreated();
    });

  return (
    <Modal open={open} onClose={onClose} title="Dear future me… " wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="Open when you graduate "
          required
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Your letter</span>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={10000}
            rows={8}
            placeholder="What do you hope for? What are you worried about? What should future you remember?"
            required
          />
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">How do you feel right now?</span>
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(mood === m.value ? null : m.value)}
                aria-pressed={mood === m.value}
                aria-label={m.label}
                className={clsx(
                  "rounded-2xl p-2 transition hover:scale-110",
                  mood === m.value ? "scale-110" : "opacity-60",
                )}
                style={mood === m.value ? { background: `${m.color}88` } : undefined}
              >
                <m.Icon size={24} aria-hidden />
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Unlock on</span>
          <div className="mb-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setDate(addDays(today, p.days))}
                className={clsx(
                  "rounded-full border-2 px-3 py-1 text-sm font-bold",
                  date === addDays(today, p.days) ? "border-primary bg-primary/25" : "border-line",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="date"
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 rounded-2xl border-2 border-line bg-card px-3 font-bold outline-none focus:border-primary"
            aria-label="Unlock date"
            required
          />
        </div>
        {error ? <p className="text-sm font-bold text-[#EF5B5B]">{error}</p> : null}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={pending}
          disabled={!title.trim() || !content.trim() || date < minDate}
        >
          <Lock size={16} /> Seal it
        </Button>
      </form>
    </Modal>
  );
}
