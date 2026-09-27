import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Category } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { CategoryManager } from "./category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [, { data: cats }, { data: links }] = await Promise.all([
    requireProfile(),
    supabase.from("categories").select("id,name,emoji,color,keywords,is_default").order("name"),
    supabase.from("note_categories").select("category_id"),
  ]);
  const counts: Record<string, number> = {};
  (links ?? []).forEach((l) => (counts[l.category_id] = (counts[l.category_id] ?? 0) + 1));

  return (
    <div>
      <PageHeader title="Categories" emoji="🏷️" />
      <p className="-mt-3 mb-5 text-ink-soft">
        Tuckbury sorts your notes automatically using these keywords. Add your own words to teach it — in English or Bahasa Indonesia.
      </p>
      <CategoryManager initial={(cats ?? []) as Category[]} counts={counts} />
    </div>
  );
}
