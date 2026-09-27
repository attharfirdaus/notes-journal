import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Category, Note, NoteCategoryLink } from "@/lib/types";
import { isPast } from "@/lib/time";
import { PageHeader, EmptyState } from "@/components/ui";
import { NotesFilters } from "./notes-filters";
import { NoteCard, type NoteCardData } from "./note-card";
import { NewNoteButton } from "./new-note-button";

export const metadata: Metadata = { title: "Notes" };

const SORTS = { updated: "updated_at", created: "created_at", title: "title" } as const;

export default async function NotesPage({ searchParams }: PageProps<"/notes">) {
  const profilePromise = requireProfile();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = str("q").trim().slice(0, 100);
  const category = str("category");
  const status = str("status") || "active";
  const type = str("type");
  const sort = (str("sort") || "updated") as keyof typeof SORTS | "due";

  const supabase = await createClient();
  const embed = category ? "note_categories!inner(category_id,source)" : "note_categories(category_id,source)";
  let query = supabase
    .from("notes")
    .select(
      `id,title,description,type,icon,color,status,pinned,categories_locked,completed_at,created_at,updated_at,${embed},note_items(is_done,due_at)`,
    )
    .limit(200);

  if (status !== "all") query = query.eq("status", status);
  if (type) query = query.eq("type", type);
  if (category) query = query.eq("note_categories.category_id", category);
  if (q) {
    // Match the title or any item text.
    const pattern = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    const { data: hits } = await supabase.from("note_items").select("note_id").ilike("text", pattern).limit(200);
    const ids = [...new Set((hits ?? []).map((h) => h.note_id))];
    query = ids.length
      ? query.or(`title.ilike.${JSON.stringify(pattern)},id.in.(${ids.join(",")})`)
      : query.ilike("title", pattern);
  }
  if (sort !== "due") {
    query = query.order(SORTS[sort] ?? "updated_at", { ascending: sort === "title" });
  }

  const [profile, { data: rows }, { data: cats }] = await Promise.all([
    profilePromise,
    query,
    supabase.from("categories").select("id,name,icon,color,keywords,is_default").order("name"),
  ]);

  const categories = (cats ?? []) as Category[];
  let notes: NoteCardData[] = (rows ?? []).map((r) => {
    const items = (r.note_items ?? []) as { is_done: boolean; due_at: string | null }[];
    const nextDue =
      items
        .filter((i) => !i.is_done && i.due_at)
        .map((i) => i.due_at as string)
        .sort()[0] ?? null;
    return {
      ...(r as unknown as Note),
      links: (r.note_categories ?? []) as NoteCategoryLink[],
      total: items.length,
      done: items.filter((i) => i.is_done).length,
      nextDue,
      overdue: items.some((i) => !i.is_done && i.due_at && isPast(i.due_at)),
    };
  });
  if (sort === "due") {
    notes = notes.sort((a, b) => (a.nextDue ?? "9999").localeCompare(b.nextDue ?? "9999"));
  }
  notes = [...notes.filter((n) => n.pinned), ...notes.filter((n) => !n.pinned)];
  const filtered = Boolean(q || category || type || status !== "active");

  return (
    <div>
      <PageHeader title="Notes" icon="ui-notes">
        <NewNoteButton />
      </PageHeader>
      <NotesFilters categories={categories} value={{ q, category, status, type, sort }} />
      {notes.length ? (
        <div className="mt-5 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {notes.map((n, i) => (
            <NoteCard key={n.id} note={n} categories={categories} tz={profile.timezone} index={i} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          {filtered ? (
            <EmptyState icon="ui-search" title="Nothing matches">
              Try another search or filter.
            </EmptyState>
          ) : (
            <EmptyState icon="ui-nut" title="No notes yet">
              Tuck away your first list: groceries, homework, anything!
            </EmptyState>
          )}
        </div>
      )}
    </div>
  );
}
