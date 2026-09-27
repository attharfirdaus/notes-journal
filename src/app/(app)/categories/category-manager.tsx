"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Sparkles, Tag, Trash2, TriangleAlert } from "lucide-react";
import { deleteCategory, saveCategory } from "@/actions/categories";
import { Button, Chip, IconButton, Input, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import { categorize } from "@/lib/categorize";
import { ICON_KEYS, Icon } from "@/lib/icons";
import type { Category } from "@/lib/types";

const COLORS = [
  "#FCA5A5",
  "#FDBA74",
  "#FDE047",
  "#D9F99D",
  "#86EFAC",
  "#6EE7B7",
  "#67E8F9",
  "#93C5FD",
  "#A5B4FC",
  "#C4B5FD",
  "#F9A8D4",
  "#D6D3D1",
];

export function CategoryManager({ initial, counts }: { initial: Category[]; counts: Record<string, number> }) {
  const { toast } = useToast();
  const [cats, setCats] = useState(initial);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [probe, setProbe] = useState("");
  const [, start] = useTransition();

  const detected = useMemo(() => (probe.trim() ? categorize({ title: probe }, cats, { max: 3 }) : []), [probe, cats]);

  return (
    <div className="space-y-6">
      <section className="rounded-blob border-2 border-line bg-card p-4 shadow-soft">
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
          <Sparkles size={18} /> Try the detector
        </h2>
        <input
          value={probe}
          onChange={(e) => setProbe(e.target.value)}
          placeholder="Type something like “beli sabun dan shampoo” or “finish thesis chapter 2”"
          className="h-11 w-full rounded-2xl border-2 border-line bg-card px-4 outline-none focus:border-primary"
          aria-label="Test text"
        />
        <div className="mt-2 flex min-h-7 flex-wrap items-center gap-1.5 text-sm">
          {probe.trim() ? (
            detected.length ? (
              detected.map((d) => {
                const c = cats.find((x) => x.id === d.id)!;
                return (
                  <Chip key={d.id} color={c.color}>
                    <Icon name={c.icon} size={13} className="mr-1 inline-block align-[-2px]" />
                    {c.name} · {d.score}
                  </Chip>
                );
              })
            ) : (
              <span className="text-ink-soft">No match. Add a keyword to one of your categories!</span>
            )
          ) : (
            <span className="text-ink-soft">Scores show how strongly the text matches.</span>
          )}
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus size={18} /> New category
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {cats.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="rounded-blob border-2 p-4 shadow-soft"
              style={{ borderColor: c.color, background: `color-mix(in oklab, ${c.color} 30%, var(--card))` }}
            >
              <div className="flex items-start gap-3">
                <Icon name={c.icon} size={26} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold">{c.name}</p>
                  <Link
                    href={`/notes?category=${c.id}&status=all`}
                    className="text-xs font-bold text-ink-soft hover:underline"
                  >
                    {counts[c.id] ?? 0} note{counts[c.id] === 1 ? "" : "s"}
                  </Link>
                </div>
                <IconButton label={`Edit ${c.name}`} onClick={() => setEditing(c)} className="h-9 w-9">
                  <Pencil size={16} />
                </IconButton>
                <IconButton label={`Delete ${c.name}`} onClick={() => setDeleting(c)} className="h-9 w-9">
                  <Trash2 size={16} />
                </IconButton>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-ink-soft">
                {c.keywords.length ? c.keywords.slice(0, 18).join(" · ") : "No keywords yet"}
                {c.keywords.length > 18 ? ` · +${c.keywords.length - 18} more` : ""}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <CategoryForm
        key={editing === "new" ? "new" : (editing?.id ?? "none")}
        category={editing}
        onClose={() => setEditing(null)}
        onSaved={(c, isNew) => {
          setCats((xs) =>
            (isNew ? [...xs, c] : xs.map((x) => (x.id === c.id ? c : x))).sort((a, b) => a.name.localeCompare(b.name)),
          );
          setEditing(null);
          toast({ icon: Tag, title: isNew ? `${c.name} created` : `${c.name} saved` });
        }}
      />

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete category?">
        <p className="text-ink-soft">
          “{deleting?.name}” will be removed from {counts[deleting?.id ?? ""] ?? 0} note(s). The notes themselves stay
          safe.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setDeleting(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() =>
              start(async () => {
                if (!deleting) return;
                const res = await deleteCategory(deleting.id);
                if (!res.ok) return toast({ icon: TriangleAlert, title: "Couldn't delete", body: res.error });
                setCats((xs) => xs.filter((x) => x.id !== deleting.id));
                setDeleting(null);
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

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: Category | "new" | null;
  onClose: () => void;
  onSaved: (c: Category, isNew: boolean) => void;
}) {
  const existing = category && category !== "new" ? category : null;
  const [name, setName] = useState(existing?.name ?? "");
  const [icon, setIcon] = useState<string>(existing?.icon ?? "tag");
  const [color, setColor] = useState(existing?.color ?? COLORS[8]);
  const [keywords, setKeywords] = useState<string[]>(existing?.keywords ?? []);
  const [kw, setKw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const addKw = () => {
    const parts = kw
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    if (parts.length) setKeywords((ks) => [...new Set([...ks, ...parts])]);
    setKw("");
  };

  return (
    <Modal open={category !== null} onClose={onClose} title={existing ? `Edit ${existing.name}` : "New category"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await saveCategory(existing?.id ?? null, { name, icon, color, keywords });
            if (!res.ok) return setError(res.error);
            onSaved(res.data, !existing);
          });
        }}
        className="space-y-4"
      >
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          required
          placeholder="Pets, Side hustle, Gym…"
        />
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Icon</span>
          <div className="flex max-h-44 flex-wrap gap-1 overflow-y-auto">
            {ICON_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                aria-label={key.replace(/-/g, " ")}
                title={key.replace(/-/g, " ")}
                className={`rounded-xl p-2 transition hover:scale-110 ${icon === key ? "bg-primary/30 text-ink" : "text-ink-soft"}`}
              >
                <Icon name={key} size={18} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Color</span>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${color === c ? "border-ink" : "border-black/10"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Keywords ({keywords.length})</span>
          <div className="flex gap-2">
            <input
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addKw();
                }
              }}
              placeholder="Type a word and press Enter"
              className="h-10 min-w-0 flex-1 rounded-xl border-2 border-line bg-card px-3 outline-none focus:border-primary"
              aria-label="Add keyword"
            />
            <Button type="button" size="sm" variant="soft" onClick={addKw} className="h-10">
              Add
            </Button>
          </div>
          <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {keywords.map((k) => (
              <Chip key={k} onRemove={() => setKeywords((ks) => ks.filter((x) => x !== k))}>
                {k}
              </Chip>
            ))}
          </div>
        </div>
        {error ? <p className="text-sm font-bold text-[#EF5B5B]">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" loading={pending} disabled={!name.trim()}>
          Save
        </Button>
      </form>
    </Modal>
  );
}
