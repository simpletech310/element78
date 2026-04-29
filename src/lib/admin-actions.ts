"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminForCurrentUser, logAdminAction } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { refundPurchase } from "@/lib/purchases";

async function gate() {
  const admin = await getAdminForCurrentUser();
  if (!admin) redirect("/home?error=admin_only");
  return admin;
}

export async function banUserAction(formData: FormData) {
  const admin = await gate();
  const userId = String(formData.get("user_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!userId) redirect("/admin/users?error=missing_id");

  const sb = createAdminClient();
  await sb
    .from("profiles")
    .update({ is_banned: true, banned_reason: reason, banned_at: new Date().toISOString() })
    .eq("id", userId);
  await logAdminAction({ adminUserId: admin.id, action: "ban_user", targetType: "user", targetId: userId, details: { reason } });
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  redirect(`/admin/users/${userId}?banned=1`);
}

export async function unbanUserAction(formData: FormData) {
  const admin = await gate();
  const userId = String(formData.get("user_id") ?? "");
  const sb = createAdminClient();
  await sb
    .from("profiles")
    .update({ is_banned: false, banned_reason: null, banned_at: null })
    .eq("id", userId);
  await logAdminAction({ adminUserId: admin.id, action: "unban_user", targetType: "user", targetId: userId });
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?unbanned=1`);
}

export async function refundPurchaseAction(formData: FormData) {
  const admin = await gate();
  const purchaseId = String(formData.get("purchase_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "requested_by_customer";
  if (!purchaseId) redirect("/admin/purchases?error=missing_id");

  try {
    await refundPurchase(purchaseId, { reason });
  } catch (err) {
    redirect(`/admin/purchases?error=${encodeURIComponent((err as Error).message)}`);
  }
  await logAdminAction({ adminUserId: admin.id, action: "refund_purchase", targetType: "purchase", targetId: purchaseId, details: { reason } });
  revalidatePath("/admin/purchases");
  redirect(`/admin/purchases?refunded=${purchaseId}`);
}

export async function hidePostAction(formData: FormData) {
  const admin = await gate();
  const postId = String(formData.get("post_id") ?? "");
  const sb = createAdminClient();
  const { data: row } = await sb.from("posts").select("meta").eq("id", postId).maybeSingle();
  const meta = (row as { meta: Record<string, unknown> | null } | null)?.meta ?? {};
  await sb.from("posts").update({ meta: { ...meta, hidden: true } }).eq("id", postId);
  await logAdminAction({ adminUserId: admin.id, action: "hide_post", targetType: "post", targetId: postId });
  revalidatePath("/admin/posts");
  revalidatePath("/wall");
  redirect(`/admin/posts?hidden=${postId}`);
}

export async function setAdminAction(formData: FormData) {
  const admin = await gate();
  const userId = String(formData.get("user_id") ?? "");
  const value = formData.get("value") === "true";
  const sb = createAdminClient();
  await sb.from("profiles").update({ is_admin: value }).eq("id", userId);
  await logAdminAction({ adminUserId: admin.id, action: value ? "grant_admin" : "revoke_admin", targetType: "user", targetId: userId });
  revalidatePath(`/admin/users/${userId}`);
  redirect(`/admin/users/${userId}?admin_${value ? "granted" : "revoked"}=1`);
}
