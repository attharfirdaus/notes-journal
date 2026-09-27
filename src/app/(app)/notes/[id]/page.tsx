import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Category, Note, NoteCategoryLink, NoteItem } from "@/lib/types";
import { NoteEditor } from "./note-editor";

export const metadata: Metadata = { title: "Note" };

export default async function NotePage({ params }: PageProps<"/notes/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createClient();

  const [profile, { data: note }, { data: items }, { data: links }, { data: cats }] = await Promise.all([
    requireProfile(),
    supabase
      .from("notes")
      .select("id,title,description,type,icon,color,status,pinned,categories_locked,completed_at,created_at,updated_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("note_items")
      .select("id,note_id,text,is_done,done_at,position,quantity,due_at,remind_offsets,recurrence")
      .eq("note_id", id)
      .order("position"),
    supabase.from("note_categories").select("category_id,source").eq("note_id", id),
    supabase.from("categories").select("id,name,icon,color,keywords,is_default").order("name"),
  ]);
  if (!note) notFound();

  return (
    <NoteEditor
      key={note.id}
      initialNote={note as Note}
      initialItems={(items ?? []) as NoteItem[]}
      initialLinks={(links ?? []) as NoteCategoryLink[]}
      categories={(cats ?? []) as Category[]}
      reminderDefaults={profile.reminder_defaults}
      scheduleReminder={profile.schedule_reminder}
    />
  );
}
