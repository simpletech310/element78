"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requestDeletionAction(formData: FormData) {
  const confirm = String(formData.get("confirm") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (confirm !== "DELETE") redirect("/account/delete?error=confirm_text_mismatch");

  const user = await getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString();
  const { error } = await admin.from("account_deletions").insert({
    user_id: user.id,
    scheduled_for: scheduledFor,
    reason,
  });
  if (error && error.code !== "23505") {
    redirect(`/account/delete?error=${encodeURIComponent(error.message)}`);
  }

  const sb = createClient();
  await sb.auth.signOut();
  redirect("/login?deletion_pending=1");
}

export async function cancelDeletionAction() {
  const user = await getUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();
  await admin
    .from("account_deletions")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("completed_at", null)
    .is("cancelled_at", null);
  revalidatePath("/account/delete");
  redirect("/account?deletion_cancelled=1");
}
