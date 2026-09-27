"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authed } from "@/lib/auth";
import { categorize } from "@/lib/categorize";
import { planQuickAdd } from "@/lib/quick-add";
import type { ActionResult, Note, NoteCategoryLink, NoteItem, NoteStatus } from "@/lib/types";

const id = z.uuid();
const noteType = z.enum(["checklist", "tasks", "schedule", "free"]);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const emoji = z.string().min(1).max(16);
const itemText = z.string().trim().min(1).max(500);
const offsets = z.array(z.int().min(0).max(20160)).max(5).nullable();

const NOTE_COLS = "id,title,description,type,emoji,color,status,pinned,categories_locked,completed_at,created_at,updated_at";
const ITEM_COLS = "id,note_id,text,is_done,done_at,position,quantity,due_at,remind_offsets,recurrence";

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Invalid input" };
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
}

/** Re-run category detection unless the user took manual control. */
async function autoCategorize(supabase: SupabaseClient, noteId: string): Promise<NoteCategoryLink[] | null> {
  const [{ data: note }, { data: items }, { data: cats }] = await Promise.all([
    supabase.from("notes").select("title,description,categories_locked").eq("id", noteId).single(),
    supabase.from("note_items").select("text").eq("note_id", noteId),
    supabase.from("categories").select("id,name,keywords"),
  ]);
  if (!note || note.categories_locked) return null;

  const suggestions = categorize(
    { title: note.title, body: [note.description, ...(items ?? []).map((i) => i.text)].join(" ") },
    cats ?? [],
  );
  await supabase.from("note_categories").delete().eq("note_id", noteId);
  const links = suggestions.map((s) => ({ note_id: noteId, category_id: s.id, source: "auto" as const }));
  if (links.length) await supabase.from("note_categories").insert(links);
  return links.map(({ category_id, source }) => ({ category_id, source }));
}

export async function createNote(input: {
  title: string;
  type?: string;
  emoji?: string;
  color?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const data = z
      .object({ title: z.string().trim().min(1).max(120), type: noteType.default("checklist"), emoji: emoji.optional(), color: hex.optional() })
      .parse(input);
    const { supabase } = await authed();
    const { data: note, error } = await supabase.from("notes").insert(data).select("id").single();
    if (error) throw error;
    await autoCategorize(supabase, note.id);
    revalidatePath("/notes");
    return { ok: true, data: { id: note.id } };
  } catch (e) {
    return fail(e);
  }
}

const TYPE_EMOJI: Record<string, string> = { checklist: "🛒", tasks: "✅", schedule: "📅", free: "📝" };
const TYPE_COLOR: Record<string, string> = { checklist: "#FDE68A", tasks: "#BBF7D0", schedule: "#BFDBFE", free: "#FBCFE8" };

export async function quickAdd(text: string): Promise<ActionResult<{ id: string; title: string; items: number }>> {
  try {
    const input = z.string().trim().min(1).max(500).parse(text);
    const { supabase, uid } = await authed();
    const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", uid).single();
    const plan = planQuickAdd(input, profile?.timezone ?? "UTC");
    if (!plan) return { ok: false, error: "Type something first!" };

    let title = plan.title;
    // A bare comma list gets named after what it looks like.
    if (title === "Quick list") {
      const { data: cats } = await supabase.from("categories").select("id,name,keywords");
      const top = categorize({ title: "", body: plan.items.map((i) => i.text).join(" ") }, cats ?? [])[0];
      if (top) title = `${top.name} list`;
    }

    const { data: note, error } = await supabase
      .from("notes")
      .insert({ title, type: plan.type, emoji: TYPE_EMOJI[plan.type], color: TYPE_COLOR[plan.type] })
      .select("id")
      .single();
    if (error) throw error;
    if (plan.items.length) {
      const { error: ie } = await supabase
        .from("note_items")
        .insert(plan.items.map((it, i) => ({ note_id: note.id, text: it.text, due_at: it.due_at ?? null, position: i + 1 })));
      if (ie) throw ie;
    }
    await autoCategorize(supabase, note.id);
    revalidatePath("/home");
    revalidatePath("/notes");
    return { ok: true, data: { id: note.id, title, items: plan.items.length } };
  } catch (e) {
    return fail(e);
  }
}

const NotePatch = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().max(2000),
    type: noteType,
    emoji,
    color: hex,
    pinned: z.boolean(),
    status: z.enum(["active", "completed", "archived"]),
  })
  .partial();

export async function updateNote(
  noteId: string,
  patch: z.infer<typeof NotePatch>,
): Promise<ActionResult<{ note: Note; categories: NoteCategoryLink[] | null }>> {
  try {
    const nid = id.parse(noteId);
    const data = NotePatch.parse(patch);
    const { supabase } = await authed();
    const { data: note, error } = await supabase.from("notes").update(data).eq("id", nid).select(NOTE_COLS).single();
    if (error) throw error;
    const categories = data.title !== undefined || data.description !== undefined ? await autoCategorize(supabase, nid) : null;
    return { ok: true, data: { note: note as Note, categories } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteNote(noteId: string): Promise<ActionResult> {
  try {
    const { supabase } = await authed();
    const { error } = await supabase.from("notes").delete().eq("id", id.parse(noteId));
    if (error) throw error;
    revalidatePath("/notes");
    revalidatePath("/home");
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}

/** Manual category edit: keeps "auto" badges on ones that were auto-detected, then locks. */
export async function setNoteCategories(noteId: string, categoryIds: string[]): Promise<ActionResult<NoteCategoryLink[]>> {
  try {
    const nid = id.parse(noteId);
    const ids = z.array(id).max(10).parse([...new Set(categoryIds)]);
    const { supabase } = await authed();
    const { data: existing } = await supabase.from("note_categories").select("category_id,source").eq("note_id", nid);
    const autoIds = new Set((existing ?? []).filter((e) => e.source === "auto").map((e) => e.category_id));
    const links = ids.map((cid) => ({ category_id: cid, source: autoIds.has(cid) ? ("auto" as const) : ("manual" as const) }));

    const { error: lockErr } = await supabase.from("notes").update({ categories_locked: true }).eq("id", nid);
    if (lockErr) throw lockErr;
    await supabase.from("note_categories").delete().eq("note_id", nid);
    if (links.length) {
      const { error } = await supabase.from("note_categories").insert(links.map((l) => ({ ...l, note_id: nid })));
      if (error) throw error;
    }
    return { ok: true, data: links };
  } catch (e) {
    return fail(e);
  }
}

export async function redetectCategories(noteId: string): Promise<ActionResult<NoteCategoryLink[]>> {
  try {
    const nid = id.parse(noteId);
    const { supabase } = await authed();
    await supabase.from("notes").update({ categories_locked: false }).eq("id", nid);
    const links = await autoCategorize(supabase, nid);
    return { ok: true, data: links ?? [] };
  } catch (e) {
    return fail(e);
  }
}

const NewItem = z.object({
  text: itemText,
  due_at: z.iso.datetime({ offset: true }).nullable().optional(),
  quantity: z.string().trim().max(20).nullable().optional(),
});

export async function addItems(
  noteId: string,
  items: z.infer<typeof NewItem>[],
): Promise<ActionResult<{ items: NoteItem[]; categories: NoteCategoryLink[] | null; status: NoteStatus }>> {
  try {
    const nid = id.parse(noteId);
    const rows = z.array(NewItem).min(1).max(50).parse(items);
    const { supabase } = await authed();
    const { data: last } = await supabase
      .from("note_items")
      .select("position")
      .eq("note_id", nid)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const base = (last?.position ?? 0) + 1;
    const { data, error } = await supabase
      .from("note_items")
      .insert(rows.map((r, i) => ({ note_id: nid, text: r.text, due_at: r.due_at ?? null, quantity: r.quantity || null, position: base + i })))
      .select(ITEM_COLS);
    if (error) throw error;
    const [categories, { data: note }] = await Promise.all([
      autoCategorize(supabase, nid),
      supabase.from("notes").select("status").eq("id", nid).single(),
    ]);
    return { ok: true, data: { items: data as NoteItem[], categories, status: (note?.status ?? "active") as NoteStatus } };
  } catch (e) {
    return fail(e);
  }
}

const ItemPatch = z
  .object({
    text: itemText,
    is_done: z.boolean(),
    quantity: z.string().trim().max(20).nullable(),
    due_at: z.iso.datetime({ offset: true }).nullable(),
    remind_offsets: offsets,
    recurrence: z.enum(["daily", "weekly"]).nullable(),
  })
  .partial();

export async function updateItem(
  itemId: string,
  patch: z.infer<typeof ItemPatch>,
): Promise<ActionResult<{ item: NoteItem; status: NoteStatus }>> {
  try {
    const iid = id.parse(itemId);
    const data = ItemPatch.parse(patch);
    if (data.quantity === "") data.quantity = null;
    const { supabase } = await authed();
    const { data: item, error } = await supabase.from("note_items").update(data).eq("id", iid).select(ITEM_COLS).single();
    if (error) throw error;
    const { data: note } = await supabase.from("notes").select("status").eq("id", item.note_id).single();
    if (data.text !== undefined) await autoCategorize(supabase, item.note_id);
    if (data.is_done !== undefined || data.due_at !== undefined) revalidatePath("/home");
    return { ok: true, data: { item: item as NoteItem, status: (note?.status ?? "active") as NoteStatus } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteItem(itemId: string): Promise<ActionResult<{ status: NoteStatus }>> {
  try {
    const iid = id.parse(itemId);
    const { supabase } = await authed();
    const { data: item, error } = await supabase.from("note_items").delete().eq("id", iid).select("note_id").single();
    if (error) throw error;
    const { data: note } = await supabase.from("notes").select("status").eq("id", item.note_id).single();
    return { ok: true, data: { status: (note?.status ?? "active") as NoteStatus } };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderItems(noteId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    const nid = id.parse(noteId);
    const ids = z.array(id).max(500).parse(orderedIds);
    const { supabase } = await authed();
    const results = await Promise.all(
      ids.map((iid, i) => supabase.from("note_items").update({ position: i + 1 }).eq("id", iid).eq("note_id", nid)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;
    return { ok: true, data: null };
  } catch (e) {
    return fail(e);
  }
}
