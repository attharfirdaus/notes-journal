"use client";

import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import {
  Archive, ArchiveRestore, BellRing, CalendarClock, ChevronDown, ChevronLeft, GripVertical, Pin, PinOff, Plus,
  Repeat, Sparkles, Trash2, X,
} from "lucide-react";
import {
  addItems, deleteItem, deleteNote, redetectCategories, reorderItems, setNoteCategories, updateItem, updateNote,
} from "@/actions/notes";
import { Button, Chip, IconButton, Modal, ProgressBar, Segmented } from "@/components/ui";
import { useToast } from "@/components/toast";
import { usePrefs } from "@/components/prefs";
import { usePush } from "@/components/push";
import { celebrate, originFromEvent, sfx } from "@/lib/fx";
import { detectDate, type DateSuggestion } from "@/lib/smart-date";
import { formatDue, isPast, isoToZonedInput, zonedInputToIso } from "@/lib/time";
import { NOTE_COLORS, NOTE_EMOJIS, NOTE_TYPES, REMINDER_PRESETS, reminderLabel } from "@/lib/note-meta";
import type { Category, Note, NoteCategoryLink, NoteItem, NoteStatus, NoteType } from "@/lib/types";

type Props = {
  initialNote: Note;
  initialItems: NoteItem[];
  initialLinks: NoteCategoryLink[];
  categories: Category[];
  reminderDefaults: number[];
  scheduleReminder: number;
};

const PROGRESS_LINES = [
  [0, "Let's get started! 🌱"],
  [0.01, "Nice start! 🐾"],
  [0.34, "Making progress! 🚀"],
  [0.67, "Almost there! 🔥"],
  [1, "All done — amazing! 🎉"],
] as const;

function progressLine(p: number) {
  let line: string = PROGRESS_LINES[0][1];
  for (const [min, text] of PROGRESS_LINES) if (p >= min) line = text;
  return line;
}

export function NoteEditor(props: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const prefs = usePrefs();
  const [note, setNote] = useState(props.initialNote);
  const [items, setItems] = useState(props.initialItems);
  const [links, setLinks] = useState(props.initialLinks);
  const [title, setTitle] = useState(note.title);
  const [description, setDescription] = useState(note.description);
  const [showDone, setShowDone] = useState(true);
  const [catOpen, setCatOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [, start] = useTransition();
  const statusRef = useRef<NoteStatus>(note.status);

  const openItems = useMemo(() => items.filter((i) => !i.is_done), [items]);
  const doneItems = useMemo(() => items.filter((i) => i.is_done), [items]);
  const progress = items.length ? doneItems.length / items.length : 0;
  const showDue = note.type === "tasks" || note.type === "schedule";
  const showQty = note.type === "checklist";

  const onStatus = (status: NoteStatus) => {
    if (status === "completed" && statusRef.current !== "completed") {
      celebrate("big");
      if (prefs.soundEffects) sfx.tada();
      toast({ emoji: "🎉", title: "List complete!", body: `${prefs.petName} is doing a victory dance.` });
    }
    statusRef.current = status;
    setNote((n) => ({ ...n, status }));
  };

  const patchNote = (patch: Parameters<typeof updateNote>[1]) => {
    setNote((n) => ({ ...n, ...patch }));
    start(async () => {
      const res = await updateNote(note.id, patch);
      if (!res.ok) return toast({ emoji: "😬", title: "Couldn't save", body: res.error });
      setNote(res.data.note);
      statusRef.current = res.data.note.status;
      if (res.data.categories) setLinks(res.data.categories);
    });
  };

  // Debounced autosave for title/description.
  useEffect(() => {
    if (title.trim() === note.title || !title.trim()) return;
    const t = setTimeout(() => patchNote({ title: title.trim() }), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);
  useEffect(() => {
    if (description === note.description) return;
    const t = setTimeout(() => patchNote({ description }), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description]);

  const toggleItem = (item: NoteItem, e?: React.MouseEvent) => {
    const done = !item.is_done;
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, is_done: done } : x)));
    if (done) {
      if (e) celebrate("small", originFromEvent(e));
      if (prefs.soundEffects) sfx.pop();
    }
    start(async () => {
      const res = await updateItem(item.id, { is_done: done });
      if (!res.ok) {
        setItems((xs) => xs.map((x) => (x.id === item.id ? item : x)));
        return toast({ emoji: "😬", title: "Couldn't update", body: res.error });
      }
      setItems((xs) => xs.map((x) => (x.id === item.id ? res.data.item : x)));
      if (item.recurrence && done) toast({ emoji: "🔁", title: "See you next time!", body: `Rescheduled: ${formatDue(res.data.item.due_at!, prefs.timezone)}` });
      onStatus(res.data.status);
    });
  };

  const saveItem = (item: NoteItem, patch: Parameters<typeof updateItem>[1]) => {
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, ...patch } : x)));
    start(async () => {
      const res = await updateItem(item.id, patch);
      if (!res.ok) {
        setItems((xs) => xs.map((x) => (x.id === item.id ? item : x)));
        return toast({ emoji: "😬", title: "Couldn't save", body: res.error });
      }
      setItems((xs) => xs.map((x) => (x.id === item.id ? res.data.item : x)));
      onStatus(res.data.status);
    });
  };

  const removeItem = (item: NoteItem) => {
    setItems((xs) => xs.filter((x) => x.id !== item.id));
    start(async () => {
      const res = await deleteItem(item.id);
      if (!res.ok) {
        setItems((xs) => [...xs, item].sort((a, b) => a.position - b.position));
        return toast({ emoji: "😬", title: "Couldn't delete", body: res.error });
      }
      onStatus(res.data.status);
    });
  };

  const add = async (rows: { text: string; due_at?: string | null; quantity?: string | null }[]) => {
    const res = await addItems(note.id, rows);
    if (!res.ok) {
      toast({ emoji: "😬", title: "Couldn't add", body: res.error });
      return false;
    }
    setItems((xs) => [...xs, ...res.data.items]);
    if (res.data.categories) setLinks(res.data.categories);
    onStatus(res.data.status);
    return true;
  };

  const persistOrder = (ordered: NoteItem[]) => {
    const ids = [...ordered, ...doneItems].map((i) => i.id);
    start(async () => {
      const res = await reorderItems(note.id, ids);
      if (!res.ok) toast({ emoji: "😬", title: "Couldn't reorder", body: res.error });
    });
  };

  const categoryById = (id: string) => props.categories.find((c) => c.id === id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link href="/notes" className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-bold text-ink-soft hover:bg-soft hover:text-ink">
          <ChevronLeft size={18} /> Notes
        </Link>
        <div className="flex items-center gap-1">
          <IconButton label={note.pinned ? "Unpin" : "Pin"} onClick={() => patchNote({ pinned: !note.pinned })}>
            {note.pinned ? <PinOff size={19} /> : <Pin size={19} />}
          </IconButton>
          <IconButton
            label={note.status === "archived" ? "Unarchive" : "Archive"}
            onClick={() => {
              patchNote({ status: note.status === "archived" ? "active" : "archived" });
              toast({ emoji: note.status === "archived" ? "📤" : "📦", title: note.status === "archived" ? "Unarchived" : "Archived" });
            }}
          >
            {note.status === "archived" ? <ArchiveRestore size={19} /> : <Archive size={19} />}
          </IconButton>
          <IconButton label="Delete note" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={19} />
          </IconButton>
        </div>
      </div>

      <motion.section
        layout
        className="rounded-[2rem] border-2 border-line p-5 shadow-soft"
        style={{ background: `color-mix(in oklab, ${note.color} var(--note-mix), var(--card))` }}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setStyleOpen(true)}
            className="wiggle-hover flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-card/70 text-3xl"
            aria-label="Change emoji and color"
          >
            {note.emoji}
          </button>
          <div className="min-w-0 flex-1">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => !title.trim() && setTitle(note.title)}
              maxLength={120}
              aria-label="Title"
              className="w-full bg-transparent font-display text-2xl font-bold text-ink outline-none placeholder:text-ink-soft"
              placeholder="Untitled"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={Math.min(6, Math.max(1, description.split("\n").length))}
              placeholder="Add a little description…"
              className="mt-1 w-full resize-none bg-transparent py-1 text-sm text-ink outline-none placeholder:text-ink-soft"
              aria-label="Description"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {links.map((l) => {
            const c = categoryById(l.category_id);
            if (!c) return null;
            return (
              <Chip key={c.id} color={c.color} title={l.source === "auto" ? "Auto-detected" : "Added by you"}>
                {c.emoji} {c.name}
                {l.source === "auto" ? <Sparkles size={11} className="ml-0.5 inline" aria-label="auto" /> : null}
              </Chip>
            );
          })}
          <button
            type="button"
            onClick={() => setCatOpen(true)}
            className="rounded-full border-2 border-dashed border-ink/25 px-2.5 py-0.5 text-[13px] font-bold text-ink-soft hover:border-ink/50 hover:text-ink"
          >
            {links.length ? "Edit" : "+ Category"}
          </button>
          {!note.categories_locked ? (
            <span className="text-xs font-semibold text-ink-soft">✨ auto-detecting</span>
          ) : null}
        </div>

        <div className="mt-4">
          <Segmented<NoteType>
            label="Note type"
            value={note.type}
            onChange={(type) => patchNote({ type })}
            options={NOTE_TYPES.map((t) => ({ value: t.value, label: `${t.emoji} ${t.label}` }))}
          />
        </div>

        {items.length ? (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
              <span>{progressLine(progress)}</span>
              <span className="text-ink-soft">
                {doneItems.length}/{items.length}
              </span>
            </div>
            <ProgressBar value={progress} />
          </div>
        ) : null}
      </motion.section>

      {showDue ? <PushNudge hasDue={items.some((i) => i.due_at)} /> : null}

      <section className="mt-5">
        <Reorder.Group
          axis="y"
          values={openItems}
          onReorder={(ordered: NoteItem[]) => setItems([...ordered, ...doneItems])}
          className="space-y-2"
        >
          <AnimatePresence initial={false}>
            {openItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                draggable
                showDue={showDue}
                showQty={showQty}
                open={openItem === item.id}
                onOpen={() => setOpenItem(openItem === item.id ? null : item.id)}
                onToggle={toggleItem}
                onSave={saveItem}
                onDelete={removeItem}
                onDragEnd={() => persistOrder(openItems)}
                noteType={note.type}
                reminderDefaults={note.type === "schedule" ? [props.scheduleReminder] : props.reminderDefaults}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>

        <AddItemBar showDue={showDue} showQty={showQty} onAdd={add} empty={!items.length} />

        {doneItems.length ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              className="mb-2 flex items-center gap-1 text-sm font-bold text-ink-soft hover:text-ink"
              aria-expanded={showDone}
            >
              <ChevronDown size={16} className={clsx("transition", !showDone && "-rotate-90")} />
              Done ({doneItems.length})
            </button>
            <AnimatePresence initial={false}>
              {showDone ? (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden">
                  {doneItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      showDue={showDue}
                      showQty={showQty}
                      open={openItem === item.id}
                      onOpen={() => setOpenItem(openItem === item.id ? null : item.id)}
                      onToggle={toggleItem}
                      onSave={saveItem}
                      onDelete={removeItem}
                      noteType={note.type}
                      reminderDefaults={props.reminderDefaults}
                    />
                  ))}
                </motion.ul>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </section>

      <CategoryModal
        open={catOpen}
        onClose={() => setCatOpen(false)}
        categories={props.categories}
        links={links}
        locked={note.categories_locked}
        onSave={(ids) =>
          start(async () => {
            const res = await setNoteCategories(note.id, ids);
            if (!res.ok) return toast({ emoji: "😬", title: "Couldn't save", body: res.error });
            setLinks(res.data);
            setNote((n) => ({ ...n, categories_locked: true }));
            setCatOpen(false);
          })
        }
        onRedetect={() =>
          start(async () => {
            const res = await redetectCategories(note.id);
            if (!res.ok) return toast({ emoji: "😬", title: "Couldn't detect", body: res.error });
            setLinks(res.data);
            setNote((n) => ({ ...n, categories_locked: false }));
            setCatOpen(false);
            toast({ emoji: "✨", title: res.data.length ? "Categories detected!" : "No match found", body: res.data.length ? undefined : "Try adding keywords in Categories." });
          })
        }
      />

      <Modal open={styleOpen} onClose={() => setStyleOpen(false)} title="Make it yours 🎨">
        <p className="mb-2 text-sm font-bold text-ink-soft">Emoji</p>
        <div className="grid grid-cols-8 gap-1">
          {NOTE_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => patchNote({ emoji: e })}
              className={clsx("rounded-xl p-1.5 text-2xl transition hover:scale-125", note.emoji === e && "bg-primary/30")}
              aria-label={`Emoji ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
        <p className="mb-2 mt-4 text-sm font-bold text-ink-soft">Color</p>
        <div className="flex flex-wrap gap-2">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => patchNote({ color: c })}
              className={clsx("h-9 w-9 rounded-full border-2 transition hover:scale-110", note.color === c ? "border-ink" : "border-black/10")}
              style={{ background: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this note?">
        <p className="text-ink-soft">
          “{note.title}” and its {items.length} item{items.length === 1 ? "" : "s"} will be gone for good.
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
                const res = await deleteNote(note.id);
                if (!res.ok) return toast({ emoji: "😬", title: "Couldn't delete", body: res.error });
                toast({ emoji: "🗑️", title: "Note deleted" });
                router.push("/notes");
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

// ─────────────────────────────────────────────────────────────

function Check({ checked }: { checked: boolean }) {
  return (
    <motion.span
      className={clsx(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.6rem] border-[2.5px] transition-colors",
        checked ? "border-primary bg-primary" : "border-ink/30 bg-card",
      )}
      animate={checked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="var(--primary-ink)"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      </svg>
    </motion.span>
  );
}

function ItemRow({
  item,
  draggable,
  showDue,
  showQty,
  open,
  onOpen,
  onToggle,
  onSave,
  onDelete,
  onDragEnd,
  noteType,
  reminderDefaults,
}: {
  item: NoteItem;
  draggable?: boolean;
  showDue: boolean;
  showQty: boolean;
  open: boolean;
  onOpen: () => void;
  onToggle: (item: NoteItem, e?: React.MouseEvent) => void;
  onSave: (item: NoteItem, patch: Parameters<typeof updateItem>[1]) => void;
  onDelete: (item: NoteItem) => void;
  onDragEnd?: () => void;
  noteType: NoteType;
  reminderDefaults: number[];
}) {
  const prefs = usePrefs();
  const controls = useDragControls();
  const [text, setText] = useState(item.text);
  const [qty, setQty] = useState(item.quantity ?? "");
  const overdue = !item.is_done && item.due_at && isPast(item.due_at);

  const commitText = () => {
    const t = text.trim();
    if (!t) return setText(item.text);
    if (t !== item.text) onSave(item, { text: t });
  };

  const body = (
    <div className={clsx("rounded-2xl border-2 bg-card shadow-soft transition", open ? "border-primary" : "border-line")}>
      <div className="flex items-center gap-2 p-2 pl-2.5">
        {draggable ? (
          <span
            onPointerDown={(e) => controls.start(e)}
            className="cursor-grab touch-none text-ink-soft/60 hover:text-ink-soft active:cursor-grabbing"
            aria-hidden
          >
            <GripVertical size={18} />
          </span>
        ) : null}
        <button type="button" onClick={(e) => onToggle(item, e)} aria-label={item.is_done ? "Mark as not done" : "Mark as done"} className="rounded-xl p-0.5">
          <Check checked={item.is_done} />
        </button>
        <div className="min-w-0 flex-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            maxLength={500}
            aria-label="Item text"
            className={clsx(
              "w-full bg-transparent py-1 text-[15px] font-semibold outline-none",
              item.is_done && "text-ink-soft line-through decoration-2",
            )}
          />
          {(showDue || item.due_at) && item.due_at ? (
            <button type="button" onClick={onOpen} className={clsx("flex items-center gap-1 text-xs font-bold", overdue ? "text-[#C0392B] dark:text-[#FF8A80]" : "text-ink-soft")}>
              <CalendarClock size={13} /> {formatDue(item.due_at, prefs.timezone)}
              {item.recurrence ? <Repeat size={12} className="ml-1" /> : null}
            </button>
          ) : null}
        </div>
        {showQty ? (
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onBlur={() => qty.trim() !== (item.quantity ?? "") && onSave(item, { quantity: qty.trim() || null })}
            placeholder="qty"
            maxLength={20}
            aria-label="Quantity"
            className="w-14 rounded-lg bg-soft px-2 py-1 text-center text-sm font-bold outline-none placeholder:text-ink-soft/60 focus:ring-2 focus:ring-primary"
          />
        ) : null}
        <IconButton label="Item details" onClick={onOpen} className="h-8 w-8">
          {showDue ? <CalendarClock size={17} /> : <ChevronDown size={17} className={clsx("transition", open && "rotate-180")} />}
        </IconButton>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ItemDetails item={item} onSave={onSave} onDelete={onDelete} noteType={noteType} reminderDefaults={reminderDefaults} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  if (!draggable) return <motion.li layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="list-none">{body}</motion.li>;

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      whileDrag={{ scale: 1.03, rotate: -1 }}
      className="list-none"
    >
      {body}
    </Reorder.Item>
  );
}

function ItemDetails({
  item,
  onSave,
  onDelete,
  noteType,
  reminderDefaults,
}: {
  item: NoteItem;
  onSave: (item: NoteItem, patch: Parameters<typeof updateItem>[1]) => void;
  onDelete: (item: NoteItem) => void;
  noteType: NoteType;
  reminderDefaults: number[];
}) {
  const prefs = usePrefs();
  const [due, setDue] = useState(item.due_at ? isoToZonedInput(item.due_at, prefs.timezone) : "");
  const offsets = item.remind_offsets;

  const commitDue = (value: string) => {
    setDue(value);
    const iso = value ? zonedInputToIso(value, prefs.timezone) : null;
    if (iso !== item.due_at) onSave(item, { due_at: iso, ...(iso ? {} : { recurrence: null }) });
  };

  const toggleOffset = (v: number) => {
    const current = offsets ?? reminderDefaults;
    const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v].slice(-5);
    onSave(item, { remind_offsets: next.sort((a, b) => b - a) });
  };

  return (
    <div className="space-y-3 border-t-2 border-line px-3 pb-3 pt-3">
      <label className="block">
        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-ink-soft">
          {noteType === "schedule" ? "When" : "Deadline"}
        </span>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={due}
            onChange={(e) => commitDue(e.target.value)}
            className="h-10 flex-1 rounded-xl border-2 border-line bg-card px-3 text-sm font-bold outline-none focus:border-primary"
          />
          {due ? (
            <IconButton label="Clear date" onClick={() => commitDue("")}>
              <X size={18} />
            </IconButton>
          ) : null}
        </div>
      </label>

      {item.due_at ? (
        <>
          <div>
            <span className="mb-1 flex items-center gap-1 text-xs font-black uppercase tracking-wide text-ink-soft">
              <BellRing size={13} /> Remind me {offsets === null ? "(using your defaults)" : ""}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {REMINDER_PRESETS.map((p) => (
                <Chip key={p.value} active={(offsets ?? reminderDefaults).includes(p.value)} onClick={() => toggleOffset(p.value)}>
                  {p.label}
                </Chip>
              ))}
              {offsets !== null ? (
                <button type="button" className="text-xs font-bold text-ink-soft underline" onClick={() => onSave(item, { remind_offsets: null })}>
                  Reset to defaults ({reminderDefaults.map(reminderLabel).join(", ")})
                </button>
              ) : null}
            </div>
          </div>
          <div>
            <span className="mb-1 flex items-center gap-1 text-xs font-black uppercase tracking-wide text-ink-soft">
              <Repeat size={13} /> Repeat
            </span>
            <Segmented
              label={`repeat-${item.id}`}
              value={item.recurrence ?? "none"}
              onChange={(v) => onSave(item, { recurrence: v === "none" ? null : (v as "daily" | "weekly") })}
              options={[
                { value: "none", label: "Never" },
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
              ]}
            />
          </div>
        </>
      ) : null}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => onDelete(item)} className="text-[#C0392B] dark:text-[#FF8A80]">
          <Trash2 size={15} /> Delete item
        </Button>
      </div>
    </div>
  );
}

function AddItemBar({
  showDue,
  showQty,
  onAdd,
  empty,
}: {
  showDue: boolean;
  showQty: boolean;
  onAdd: (rows: { text: string; due_at?: string | null; quantity?: string | null }[]) => Promise<boolean>;
  empty: boolean;
}) {
  const prefs = usePrefs();
  const [text, setText] = useState("");
  const [useDate, setUseDate] = useState(true);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestion: DateSuggestion | null = useMemo(
    () => (text.trim().length > 2 ? detectDate(text, prefs.timezone) : null),
    [text, prefs.timezone],
  );

  const submit = async () => {
    const raw = text.trim();
    if (!raw || busy) return;
    // Pasting several lines adds several items.
    const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    let rows: { text: string; due_at?: string | null; quantity?: string | null }[];
    if (lines.length === 1 && suggestion && useDate && suggestion.cleaned) {
      rows = [{ text: suggestion.cleaned, due_at: suggestion.iso }];
    } else {
      rows = lines.map((l) => {
        const m = showQty ? /^(\d+(?:[.,]\d+)?\s*(?:x|pcs|kg|g|l|ml|pack|packs|bottles?|box(?:es)?)?)\s+(.+)$/i.exec(l) : null;
        return m ? { text: m[2], quantity: m[1].trim() } : { text: l };
      });
    }
    setBusy(true);
    const ok = await onAdd(rows);
    setBusy(false);
    if (ok) {
      setText("");
      setUseDate(true);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-card/60 p-2 pl-3 focus-within:border-primary focus-within:bg-card">
        <Plus size={20} className="shrink-0 text-ink-soft" />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setUseDate(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void submit();
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (pasted.includes("\n")) {
              e.preventDefault();
              setText((t) => (t ? `${t}\n${pasted}` : pasted));
            }
          }}
          maxLength={2000}
          placeholder={
            empty
              ? showDue
                ? "Add a task… try “essay draft friday 5pm”"
                : showQty
                  ? "Add an item… try “2 kg rice”"
                  : "Add your first item…"
              : "Add another…"
          }
          aria-label="New item"
          className="h-10 min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none placeholder:font-normal placeholder:text-ink-soft/80"
        />
        <Button size="sm" onClick={() => void submit()} loading={busy} disabled={!text.trim()}>
          Add
        </Button>
      </div>
      <AnimatePresence>
        {suggestion && suggestion.cleaned && !text.includes("\n") ? (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex flex-wrap items-center gap-2 pl-2 text-sm">
            <Chip active={useDate} onClick={() => setUseDate((v) => !v)} title="Click to toggle">
              📅 {formatDue(suggestion.iso, prefs.timezone)}
            </Chip>
            <span className="text-xs text-ink-soft">{useDate ? `Deadline detected from “${suggestion.matched}”` : "Date ignored — tap to use it"}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {text.includes("\n") ? (
        <p className="mt-2 pl-2 text-xs font-bold text-ink-soft">{text.split(/\n+/).filter((l) => l.trim()).length} items will be added</p>
      ) : null}
    </div>
  );
}

function CategoryModal({
  open,
  onClose,
  categories,
  links,
  locked,
  onSave,
  onRedetect,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  links: NoteCategoryLink[];
  locked: boolean;
  onSave: (ids: string[]) => void;
  onRedetect: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setSelected(links.map((l) => l.category_id));
  }, [open, links]);

  return (
    <Modal open={open} onClose={onClose} title="Categories 🏷️">
      <p className="mb-3 text-sm text-ink-soft">
        {locked
          ? "You're in charge — auto-detect is paused for this note."
          : "✨ Auto-detected from your text. Changing them here switches to manual."}
      </p>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const on = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => setSelected((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))}
              className="rounded-full border-2 px-3 py-1.5 text-sm font-bold transition hover:-translate-y-0.5"
              style={on ? { borderColor: c.color, background: `${c.color}99` } : { borderColor: "var(--line)" }}
            >
              {c.emoji} {c.name} {on ? "✓" : ""}
            </button>
          );
        })}
      </div>
      <Link href="/categories" className="mt-3 inline-block text-sm font-bold text-ink-soft underline">
        Manage categories →
      </Link>
      <div className="mt-5 flex gap-2">
        <Button variant="soft" className="flex-1" onClick={onRedetect}>
          <Sparkles size={16} /> Auto-detect
        </Button>
        <Button className="flex-1" onClick={() => onSave(selected)}>
          Save
        </Button>
      </div>
    </Modal>
  );
}

function PushNudge({ hasDue }: { hasDue: boolean }) {
  const push = usePush();
  const [dismissed, setDismissed] = useState(false);
  if (!hasDue || dismissed || push.state !== "default") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-line bg-card p-3 shadow-soft"
    >
      <span className="text-2xl">🔔</span>
      <p className="flex-1 text-sm font-semibold">Want a ping before deadlines, even when Tuckbury is closed?</p>
      <Button size="sm" onClick={() => void push.subscribe()} loading={push.busy}>
        Turn on
      </Button>
      <IconButton label="Dismiss" onClick={() => setDismissed(true)} className="h-8 w-8">
        <X size={16} />
      </IconButton>
    </motion.div>
  );
}
