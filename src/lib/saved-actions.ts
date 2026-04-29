"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

const ALLOWED_KINDS = new Set(["program", "class", "product", "trainer", "routine"]);

/**
 * Toggle whether the current user has saved (kind, ref_id). If a row exists
 * we delete it; otherwise we insert with cached display fields so the saved
 * page can render without joining out to four different tables.
 */
export async function toggleSavedAction(formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const refId = String(formData.get("ref_id") ?? "");
  const refSlug = (formData.get("ref_slug") as string | null) ?? null;
  const refName = (formData.get("ref_name") as string | null) ?? null;
  const refImage = (formData.get("ref_image") as string | null) ?? null;
  const returnTo = String(formData.get("return_to") ?? "/account/saved");

  if (!ALLOWED_KINDS.has(kind) || !refId) {
    redirect(returnTo);
  }

  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  const sb = createClient();

  const { data: existing } = await sb
    .from("saved_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("kind", kind)
    .eq("ref_id", refId)
    .maybeSingle();

  if (existing) {
    await sb.from("saved_items").delete().eq("id", (existing as { id: string }).id);
  } else {
    await sb.from("saved_items").insert({
      user_id: user.id,
      kind,
      ref_id: refId,
      ref_slug: refSlug,
      ref_name: refName,
      ref_image: refImage,
    });
  }

  // Revalidate both the originating page and the saved-items index.
  try {
    revalidatePath(returnTo);
  } catch {
    // ignore — returnTo may be a dynamic path that revalidatePath can't pin.
  }
  revalidatePath("/account/saved");
  redirect(returnTo);
}
