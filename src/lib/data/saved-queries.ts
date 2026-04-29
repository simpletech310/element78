import { createClient } from "@/lib/supabase/server";

export type SavedKind = "program" | "class" | "product" | "trainer" | "routine";

export type SavedItem = {
  id: string;
  user_id: string;
  kind: SavedKind;
  ref_id: string;
  ref_slug: string | null;
  ref_name: string | null;
  ref_image: string | null;
  created_at: string;
};

function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * All saved rows for a member, newest first. Used by the /account/saved page.
 */
export async function listSavedItems(userId: string): Promise<SavedItem[]> {
  if (!isConfigured()) return [];
  const sb = createClient();
  const { data } = await sb
    .from("saved_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as SavedItem[]) ?? [];
}

/**
 * Set of `ref_id` values the user has saved for a single kind. Detail pages
 * use this to know whether to render the heart filled or hollow.
 */
export async function getSavedKindRefs(userId: string, kind: SavedKind): Promise<Set<string>> {
  if (!isConfigured()) return new Set();
  const sb = createClient();
  const { data } = await sb
    .from("saved_items")
    .select("ref_id")
    .eq("user_id", userId)
    .eq("kind", kind);
  const rows = (data as { ref_id: string }[]) ?? [];
  return new Set(rows.map(r => r.ref_id));
}
