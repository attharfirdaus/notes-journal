"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import clsx from "clsx";
import { createNote } from "@/actions/notes";
import { Button, Input, Modal } from "@/components/ui";
import { NOTE_TYPES } from "@/lib/note-meta";
import type { NoteType } from "@/lib/types";
import { Icon } from "@/lib/icons";

export function NewNoteButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<NoteType>("checklist");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const meta = NOTE_TYPES.find((t) => t.value === type)!;
      const res = await createNote({ title, type, icon: meta.icon, color: meta.color });
      if (!res.ok) return setError(res.error);
      router.push(`/notes/${res.data.id}`);
    });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={18} /> New note
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="New note ">
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
            maxLength={120}
            placeholder="Weekend groceries, Thesis tasks…"
            autoFocus
            required
          />
          <div>
            <span className="mb-1.5 block text-sm font-bold text-ink-soft">What kind of list?</span>
            <div className="grid grid-cols-2 gap-2">
              {NOTE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  aria-pressed={type === t.value}
                  className={clsx(
                    "rounded-2xl border-2 p-3 text-left transition",
                    type === t.value ? "border-primary scale-[1.02]" : "border-line",
                  )}
                  style={{ background: `color-mix(in oklab, ${t.color} var(--note-mix), var(--card))` }}
                >
                  <Icon name={t.icon} size={20} />
                  <div className="font-bold">{t.label}</div>
                  <div className="text-xs text-ink-soft">{t.hint}</div>
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="text-sm font-bold text-[#EF5B5B]">{error}</p> : null}
          <Button type="submit" className="w-full" size="lg" loading={pending} disabled={!title.trim()}>
            Create
          </Button>
        </form>
      </Modal>
    </>
  );
}
