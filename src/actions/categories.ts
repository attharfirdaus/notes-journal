"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authed } from "@/lib/auth";
import type { ActionResult, Category } from "@/lib/types";

const CategoryInput = z.object({
  name: z.string().trim().min(1, "Name it!").max(30),
  emoji: z.string().min(1).max(16),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  keywords: z
    .array(z.string().trim().toLowerCase().min(1).max(40))
    .max(200)
    .transform((ks) => [...new Set(ks)]),
});

function friendly(message: string) {
  return message.includes("duplicate") ? "You already have a category with that name" : message;
}

export async function saveCategory(id: string | null, input: z.infer<typeof CategoryInput>): Promise<ActionResult<Category>> {
  const parsed = CategoryInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { supabase } = await authed();
  const q = id
    ? supabase.from("categories").update(parsed.data).eq("id", z.uuid().parse(id))
    : supabase.from("categories").insert(parsed.data);
  const { data, error } = await q.select("id,name,emoji,color,keywords,is_default").single();
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/categories");
  revalidatePath("/notes");
  return { ok: true, data: data as Category };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { supabase } = await authed();
  const { error } = await supabase.from("categories").delete().eq("id", z.uuid().parse(id));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/categories");
  revalidatePath("/notes");
  return { ok: true, data: null };
}
